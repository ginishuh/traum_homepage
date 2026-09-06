"""한지수 접수 알림 중복 발송 회귀 테스트.

실제 Store·재전송 순회·지연 예약을 쓰고 텔레그램 전송만 느린 가짜로 바꾼다.
실행: `pytest chat/tests` (chat/requirements.txt + pytest 설치 환경).
"""

import asyncio
import importlib
import os
import sys
from collections import Counter
from pathlib import Path

import pytest

CHAT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CHAT_DIR))
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test-token")
os.environ.setdefault("TELEGRAM_CHAT_ID", "1")

chat_app = importlib.import_module("app")  # 환경 변수 설정 뒤에 임포트해야 한다

FIELDS = {"item": "폐지", "quantity": "1톤", "region": "김포", "address": "", "phone": "01012345678", "note": ""}


class FakeTelegram:
    """전송마다 0.2초 걸리는 가짜 텔레그램. 메시지 첫 줄(id 포함) 기준으로 횟수를 센다."""

    def __init__(self) -> None:
        self.calls: Counter[str] = Counter()
        self.ok = True

    async def __call__(self, text: str, *args: object, **kwargs: object) -> bool:
        self.calls[text.split("\n")[0]] += 1
        await asyncio.sleep(0.2)
        return self.ok


@pytest.fixture
def env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> FakeTelegram:
    store = chat_app.Store(str(tmp_path / "chat.db"))
    monkeypatch.setattr(chat_app, "store", store, raising=False)
    monkeypatch.setattr(chat_app, "_inflight", set())
    monkeypatch.setattr(chat_app, "_retry_task", None)
    fake = FakeTelegram()
    monkeypatch.setattr(chat_app, "telegram_send", fake)
    return fake


def _add(kind: str = "inquiry") -> tuple[str, str]:
    sid, _ = chat_app.store.get_or_create_session(None, "iphash")
    lid = chat_app.store.add_inquiry(sid, kind, FIELDS)
    return lid, chat_app.format_inquiry(lid, kind, FIELDS, "")


def test_sweep_skips_row_that_succeeded_meanwhile(env: FakeTelegram) -> None:
    """미전송 [A, B]를 읽은 순회가 A를 보내는 동안 B의 최초 전송이 성공하면, 순회는 B를 다시 보내지 않는다."""

    async def run() -> None:
        a_id, _ = _add()  # 이전에 실패해 notified=0으로 남은 건
        b_id, b_text = _add()
        first = asyncio.create_task(chat_app.notify_inquiry(b_id, b_text))  # B 최초 전송 진행 중
        await asyncio.sleep(0.05)
        sweep = asyncio.create_task(chat_app.retry_unnotified())  # [A, B] 읽고 A부터 전송
        await asyncio.gather(first, sweep)
        assert sum(1 for k in env.calls if a_id in k) == 1
        assert env.calls[[k for k in env.calls if a_id in k][0]] == 1
        assert env.calls[[k for k in env.calls if b_id in k][0]] == 1
        assert chat_app.store.unnotified(7) == []

    asyncio.run(run())


def test_sweep_skips_inflight_row(env: FakeTelegram) -> None:
    """최초 전송이 진행 중인 건은 주기 순회가 건너뛴다."""

    async def run() -> None:
        lid, text = _add()
        first = asyncio.create_task(chat_app.notify_inquiry(lid, text))
        await asyncio.sleep(0.05)
        await chat_app.retry_unnotified()
        await first
        assert list(env.calls.values()) == [1]
        assert chat_app.store.unnotified(7) == []

    asyncio.run(run())


def test_overlapping_retries_send_once(env: FakeTelegram) -> None:
    """실패로 남은 건에 지연 예약 2건과 주기 순회 2건이 겹쳐도 한 번만 보낸다."""

    async def run() -> None:
        env.ok = False
        lid, text = _add()
        assert await chat_app.notify_inquiry(lid, text) is False
        chat_app.schedule_retry(0.05)
        chat_app.schedule_retry(0.05)
        env.ok = True
        await asyncio.gather(chat_app.retry_unnotified(), chat_app.retry_unnotified(), asyncio.sleep(0.5))
        key = next(k for k in env.calls if lid in k)
        assert env.calls[key] == 2  # 실패한 최초 전송 1회 + 재전송 1회
        assert chat_app.store.unnotified(7) == []

    asyncio.run(run())
