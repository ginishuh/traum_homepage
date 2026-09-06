"""트라움자원 문의 챗봇 '한지수' — FastAPI + OpenAI Responses + 텔레그램 알림.

엔드포인트
- GET  /api/chat/health
- POST /api/chat/message   {session_id?, message}                      → SSE (session, delta, draft, handoff, done, error)
- POST /api/chat/inquiry   {session_id, item, quantity, region, address, phone, note} → {ok, id}
- POST /api/chat/handoff   {session_id, phone, reason?}                → {ok, id}

시크릿은 환경 변수로만 받는다. 모델은 도구 두 개(submit_inquiry, handoff)만 쓸 수 있고, 저장·알림은 서버가 한다.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import sqlite3
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, AsyncIterator

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from prompts import TOOLS, build_instructions

log = logging.getLogger("hanjisu")
logging.basicConfig(level=os.environ.get("CHAT_LOG_LEVEL", "INFO"))
# httpx는 요청 URL(봇 토큰 포함)을 INFO로 찍으므로 경고 이상만 남긴다
for _n in ("httpx", "httpx2", "httpcore", "openai"):
    logging.getLogger(_n).setLevel(logging.WARNING)

KST = timezone(timedelta(hours=9))


def env_bool(name: str, default: bool) -> bool:
    v = os.environ.get(name)
    return default if v is None else v.strip().lower() in ("1", "true", "yes", "on")


class Settings:
    enabled = env_bool("CHAT_ENABLED", True)
    openai_api_key = os.environ.get("OPENAI_API_KEY", "")
    model = os.environ.get("CHAT_MODEL", "gpt-5.6-luna")
    reasoning_effort = os.environ.get("CHAT_REASONING_EFFORT", "low")
    max_output_tokens = int(os.environ.get("CHAT_MAX_OUTPUT_TOKENS", "300"))
    prompt_cache_key = os.environ.get("CHAT_PROMPT_CACHE_KEY", "traum-hanjisu-v1")
    max_turns = int(os.environ.get("CHAT_MAX_TURNS", "20"))
    max_message_chars = int(os.environ.get("CHAT_MAX_MESSAGE_CHARS", "500"))
    rate_per_minute = int(os.environ.get("CHAT_RATE_PER_MINUTE", "10"))
    history_messages = int(os.environ.get("CHAT_HISTORY_MESSAGES", "16"))
    retention_days = int(os.environ.get("CHAT_RETENTION_DAYS", "90"))
    db_path = os.environ.get("CHAT_DB_PATH", "/data/chat.sqlite3")
    telegram_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    telegram_chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    telegram_api_base = os.environ.get("TELEGRAM_API_BASE", "https://api.telegram.org")
    phone_fallback = os.environ.get("CHAT_PHONE", "02-6140-6747")
    maintenance_interval_sec = int(os.environ.get("CHAT_MAINTENANCE_INTERVAL_SEC", "600"))
    notify_retry_days = int(os.environ.get("CHAT_NOTIFY_RETRY_DAYS", "7"))


S = Settings()
PHONE_RE = re.compile(r"^0\d{1,2}-?\d{3,4}-?\d{4}$")


# ---------------------------------------------------------------------------
# 저장소 (SQLite)
# ---------------------------------------------------------------------------
class Store:
    def __init__(self, path: str) -> None:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
              id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
              turns INTEGER NOT NULL DEFAULT 0, ip_hash TEXT
            );
            CREATE TABLE IF NOT EXISTS messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL,
              role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);
            CREATE TABLE IF NOT EXISTS inquiries (
              id TEXT PRIMARY KEY, session_id TEXT NOT NULL, kind TEXT NOT NULL,
              item TEXT, quantity TEXT, region TEXT, address TEXT, phone TEXT, note TEXT,
              created_at TEXT NOT NULL, notified INTEGER NOT NULL DEFAULT 0
            );
            """
        )
        self.lock = asyncio.Lock()

    @staticmethod
    def now() -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds")

    def get_or_create_session(self, session_id: str | None, ip_hash: str) -> tuple[str, int]:
        if session_id:
            row = self.conn.execute("SELECT id, turns FROM sessions WHERE id=?", (session_id,)).fetchone()
            if row:
                return row[0], row[1]
        sid = uuid.uuid4().hex
        self.conn.execute(
            "INSERT INTO sessions(id, created_at, updated_at, turns, ip_hash) VALUES (?,?,?,0,?)",
            (sid, self.now(), self.now(), ip_hash),
        )
        self.conn.commit()
        return sid, 0

    def add_message(self, session_id: str, role: str, content: str) -> None:
        self.conn.execute(
            "INSERT INTO messages(session_id, role, content, created_at) VALUES (?,?,?,?)",
            (session_id, role, content, self.now()),
        )
        self.conn.execute(
            "UPDATE sessions SET updated_at=?, turns = turns + ? WHERE id=?",
            (self.now(), 1 if role == "user" else 0, session_id),
        )
        self.conn.commit()

    def history(self, session_id: str, limit: int) -> list[dict[str, str]]:
        rows = self.conn.execute(
            "SELECT role, content FROM messages WHERE session_id=? ORDER BY id DESC LIMIT ?",
            (session_id, limit),
        ).fetchall()
        return [{"role": r, "content": c} for r, c in reversed(rows)]

    def add_inquiry(self, session_id: str, kind: str, fields: dict[str, str]) -> str:
        iid = datetime.now(KST).strftime("%y%m%d-") + uuid.uuid4().hex[:6]
        self.conn.execute(
            "INSERT INTO inquiries(id, session_id, kind, item, quantity, region, address, phone, note, created_at)"
            " VALUES (?,?,?,?,?,?,?,?,?,?)",
            (
                iid, session_id, kind,
                fields.get("item", ""), fields.get("quantity", ""), fields.get("region", ""),
                fields.get("address", ""), fields.get("phone", ""), fields.get("note", ""), self.now(),
            ),
        )
        self.conn.commit()
        return iid

    def unnotified(self, days: int) -> list[dict[str, str]]:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")
        rows = self.conn.execute(
            "SELECT id, session_id, kind, item, quantity, region, address, phone, note FROM inquiries"
            " WHERE notified=0 AND created_at >= ? ORDER BY created_at",
            (cutoff,),
        ).fetchall()
        keys = ("id", "session_id", "kind", "item", "quantity", "region", "address", "phone", "note")
        return [dict(zip(keys, r)) for r in rows]

    def mark_notified(self, iid: str) -> None:
        self.conn.execute("UPDATE inquiries SET notified=1 WHERE id=?", (iid,))
        self.conn.commit()

    def purge(self, days: int) -> None:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")
        self.conn.execute("DELETE FROM messages WHERE created_at < ?", (cutoff,))
        self.conn.execute("DELETE FROM sessions WHERE updated_at < ?", (cutoff,))
        self.conn.execute("DELETE FROM inquiries WHERE created_at < ?", (cutoff,))
        self.conn.commit()


# ---------------------------------------------------------------------------
# 남용 제한 (IP 분당 요청 수)
# ---------------------------------------------------------------------------
class RateLimiter:
    def __init__(self, per_minute: int) -> None:
        self.per_minute = per_minute
        self.hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        q = self.hits[key]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= self.per_minute:
            return False
        q.append(now)
        return True


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    ip = fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "0.0.0.0")
    return ip


def ip_hash(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# 텔레그램 알림 (보내기만)
# ---------------------------------------------------------------------------
async def telegram_send(text: str, timeout_sec: float = 5.0) -> bool:
    """텔레그램 그룹으로 전송. 요청 경로에서는 한 번만 짧게 시도하고, 실패한 접수는 notified=0으로 남아
    30초 뒤 재시도와 주기 재전송의 대상이 된다."""
    if not S.telegram_token or not S.telegram_chat_id:
        log.warning("telegram not configured; notification skipped")
        return False
    url = f"{S.telegram_api_base}/bot{S.telegram_token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=timeout_sec) as http:
            r = await http.post(url, json={"chat_id": S.telegram_chat_id, "text": text, "disable_web_page_preview": True})
            if r.status_code == 200 and r.json().get("ok") is True:
                return True
            log.error("telegram send failed: %s %s", r.status_code, r.text[:200])
    except (httpx.HTTPError, ValueError):
        log.exception("telegram send error")
    return False


_retry_tasks: set = set()


def schedule_retry(delay_sec: float = 30.0) -> None:
    async def _later() -> None:
        await asyncio.sleep(delay_sec)
        resent = await retry_unnotified()
        if resent:
            log.info("resent %s unnotified inquiry(ies) after delay", resent)

    task = asyncio.create_task(_later())
    _retry_tasks.add(task)
    task.add_done_callback(_retry_tasks.discard)


async def retry_unnotified() -> int:
    sent = 0
    for row in store.unnotified(S.notify_retry_days):
        summary = summarize(store.history(row["session_id"], 12))
        if await telegram_send(format_inquiry(row["id"], row["kind"], row, summary)):
            store.mark_notified(row["id"])
            sent += 1
    return sent


async def maintenance_loop() -> None:
    """주기 작업: 미전송 접수 재전송 + 보관 기간 지난 데이터 삭제."""
    while True:
        try:
            await asyncio.sleep(S.maintenance_interval_sec)
            resent = await retry_unnotified()
            if resent:
                log.info("resent %s unnotified inquiry(ies)", resent)
            store.purge(S.retention_days)
        except asyncio.CancelledError:
            raise
        except (sqlite3.Error, httpx.HTTPError, ValueError):
            log.exception("maintenance loop iteration failed")


def format_inquiry(iid: str, kind: str, f: dict[str, str], summary: str) -> str:
    when = datetime.now(KST).strftime("%m/%d %H:%M")
    if kind == "handoff":
        return (
            f"[담당자 연결 요청] {iid}\n"
            f"사유: {f.get('note') or '-'}\n"
            f"연락처: {f.get('phone') or '-'}\n"
            f"시각: {when}\n"
            f"대화 요약: {summary or '-'}"
        )
    return (
        f"[수거 요청 접수] {iid}\n"
        f"품목: {f.get('item') or '-'}\n"
        f"수량: {f.get('quantity') or '-'}\n"
        f"지역: {f.get('region') or '-'}\n"
        f"주소: {f.get('address') or '-'}\n"
        f"연락처: {f.get('phone') or '-'}\n"
        f"메모: {f.get('note') or '-'}\n"
        f"시각: {when}\n"
        f"대화 요약: {summary or '-'}"
    )


def summarize(history: list[dict[str, str]]) -> str:
    users = [m["content"] for m in history if m["role"] == "user"]
    text = " / ".join(users[-3:])
    return text[:300]


# ---------------------------------------------------------------------------
# 앱
# ---------------------------------------------------------------------------
store: Store
limiter: RateLimiter
oai: AsyncOpenAI | None = None
INSTRUCTIONS = ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    global store, limiter, oai, INSTRUCTIONS
    store = Store(S.db_path)
    limiter = RateLimiter(S.rate_per_minute)
    INSTRUCTIONS = build_instructions()
    oai = AsyncOpenAI(api_key=S.openai_api_key) if S.openai_api_key else None
    store.purge(S.retention_days)
    task = asyncio.create_task(maintenance_loop())
    log.info("hanjisu up: enabled=%s model=%s telegram=%s", S.enabled, S.model, bool(S.telegram_token and S.telegram_chat_id))
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(title="traum-chat", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)


def chat_available() -> bool:
    return S.enabled and oai is not None


@app.get("/api/chat/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "enabled": chat_available(), "model": S.model, "phone": S.phone_fallback}


class MessageIn(BaseModel):
    session_id: str | None = Field(default=None, max_length=64)
    message: str = Field(min_length=1, max_length=2000)


class InquiryIn(BaseModel):
    session_id: str = Field(max_length=64)
    item: str = Field(default="", max_length=200)
    quantity: str = Field(default="", max_length=200)
    region: str = Field(default="", max_length=200)
    address: str = Field(default="", max_length=300)
    phone: str = Field(max_length=30)
    note: str = Field(default="", max_length=500)


class HandoffIn(BaseModel):
    session_id: str = Field(max_length=64)
    phone: str = Field(max_length=30)
    reason: str = Field(default="", max_length=300)


def sse(event: str, data: Any) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def run_model(session_id: str, history: list[dict[str, str]]) -> AsyncIterator[str]:
    """Responses API 스트리밍. 도구 호출은 화면 이벤트로 바꾸고, 도구 결과를 넣어 마무리 문장을 한 번 더 받는다."""
    assert oai is not None
    input_items: list[dict[str, Any]] = [{"role": m["role"], "content": m["content"]} for m in history]
    assistant_text: list[str] = []
    tool_choice: Any = "auto"

    for _round in range(2):
        pending_calls: list[dict[str, Any]] = []
        stream = await oai.responses.create(
            model=S.model,
            instructions=INSTRUCTIONS,
            input=input_items,
            tools=TOOLS,
            tool_choice=tool_choice,
            reasoning={"effort": S.reasoning_effort},
            max_output_tokens=S.max_output_tokens,
            prompt_cache_key=S.prompt_cache_key,
            store=False,
            stream=True,
        )
        async for event in stream:
            et = event.type
            if et == "response.output_text.delta":
                assistant_text.append(event.delta)
                yield sse("delta", {"text": event.delta})
            elif et == "response.output_item.done" and getattr(event.item, "type", "") == "function_call":
                pending_calls.append({"name": event.item.name, "arguments": event.item.arguments, "call_id": event.item.call_id})
            elif et in ("response.failed", "error"):
                log.error("model stream error: %s", getattr(event, "error", event))
                raise RuntimeError("model_error")

        if not pending_calls:
            break

        outputs: list[dict[str, Any]] = []
        for call in pending_calls:
            try:
                args = json.loads(call["arguments"] or "{}")
            except json.JSONDecodeError:
                args = {}
            if call["name"] == "submit_inquiry":
                draft = {k: str(args.get(k, "")).strip()[:200] for k in ("item", "quantity", "region", "note")}
                yield sse("draft", draft)
                outputs.append({"type": "function_call_output", "call_id": call["call_id"],
                                "output": json.dumps({"status": "draft_shown", "next": "방문자가 주소·연락처를 입력해 접수하도록 한 문장으로 안내"}, ensure_ascii=False)})
            elif call["name"] == "handoff":
                reason = str(args.get("reason", "")).strip()[:200]
                yield sse("handoff", {"reason": reason, "phone": S.phone_fallback})
                outputs.append({"type": "function_call_output", "call_id": call["call_id"],
                                "output": json.dumps({"status": "handoff_shown", "phone": S.phone_fallback, "next": "담당자가 연락드린다고 한 문장으로 안내"}, ensure_ascii=False)})
            else:
                outputs.append({"type": "function_call_output", "call_id": call["call_id"], "output": "{}"})
        # 도구 호출 항목 자체도 입력에 남겨야 call_id가 맞는다
        for call in pending_calls:
            input_items.append({"type": "function_call", "call_id": call["call_id"], "name": call["name"], "arguments": call["arguments"]})
        input_items.extend(outputs)
        tool_choice = "none"

    final = "".join(assistant_text).strip()
    if final:
        store.add_message(session_id, "assistant", final)
    yield sse("done", {"text": final})


@app.post("/api/chat/message")
async def message(body: MessageIn, request: Request):
    if not chat_available():
        return JSONResponse({"error": "disabled", "phone": S.phone_fallback}, status_code=503)
    ip = client_ip(request)
    if not limiter.allow(ip):
        return JSONResponse({"error": "rate_limited", "phone": S.phone_fallback}, status_code=429)
    text = body.message.strip()
    if len(text) > S.max_message_chars:
        return JSONResponse({"error": "too_long", "max": S.max_message_chars}, status_code=413)

    session_id, turns = store.get_or_create_session(body.session_id, ip_hash(ip))
    if turns >= S.max_turns:
        return JSONResponse({"error": "turn_limit", "phone": S.phone_fallback, "session_id": session_id}, status_code=429)

    store.add_message(session_id, "user", text)
    history = store.history(session_id, S.history_messages)

    async def gen() -> AsyncIterator[str]:
        yield sse("session", {"session_id": session_id})
        try:
            async for chunk in run_model(session_id, history):
                yield chunk
        except Exception as e:  # noqa: BLE001
            log.exception("chat failed: %s", e)
            yield sse("error", {"error": "model_error", "phone": S.phone_fallback})

    headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "X-Session-Id": session_id}
    return StreamingResponse(gen(), media_type="text/event-stream", headers=headers)


def normalize_phone(raw: str) -> str | None:
    digits = re.sub(r"[^\d]", "", raw)
    if not (9 <= len(digits) <= 11) or not digits.startswith("0"):
        return None
    if len(digits) == 11:
        return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
    if len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}" if not digits.startswith("02") else f"{digits[:2]}-{digits[2:6]}-{digits[6:]}"
    return f"{digits[:2]}-{digits[2:5]}-{digits[5:]}"


@app.post("/api/chat/inquiry")
async def inquiry(body: InquiryIn, request: Request):
    if not limiter.allow(client_ip(request) + ":inq"):
        raise HTTPException(429, "rate_limited")
    phone = normalize_phone(body.phone)
    if not phone:
        raise HTTPException(422, "phone_invalid")
    if not body.item.strip() or not body.region.strip():
        raise HTTPException(422, "fields_required")
    sid, _ = store.get_or_create_session(body.session_id, ip_hash(client_ip(request)))
    fields = {"item": body.item.strip(), "quantity": body.quantity.strip(), "region": body.region.strip(),
              "address": body.address.strip(), "phone": phone, "note": body.note.strip()}
    iid = store.add_inquiry(sid, "inquiry", fields)
    store.add_message(sid, "user", f"[접수 완료 {iid}] {fields['item']} / {fields['quantity']} / {fields['region']}")
    ok = await telegram_send(format_inquiry(iid, "inquiry", fields, summarize(store.history(sid, 12))))
    if ok:
        store.mark_notified(iid)
    else:
        schedule_retry()
    return {"ok": True, "id": iid, "notified": ok}


@app.post("/api/chat/handoff")
async def handoff(body: HandoffIn, request: Request):
    if not limiter.allow(client_ip(request) + ":inq"):
        raise HTTPException(429, "rate_limited")
    phone = normalize_phone(body.phone)
    if not phone:
        raise HTTPException(422, "phone_invalid")
    sid, _ = store.get_or_create_session(body.session_id, ip_hash(client_ip(request)))
    fields = {"phone": phone, "note": body.reason.strip()}
    iid = store.add_inquiry(sid, "handoff", fields)
    store.add_message(sid, "user", f"[담당자 연결 요청 {iid}]")
    ok = await telegram_send(format_inquiry(iid, "handoff", fields, summarize(store.history(sid, 12))))
    if ok:
        store.mark_notified(iid)
    else:
        schedule_retry()
    return {"ok": True, "id": iid, "notified": ok}
