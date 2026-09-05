// 문의 챗봇 '한지수' 위젯 — 서버(/api/chat/*)와 SSE로 대화, 접수는 사용자가 카드에서 확정
(function () {
  const root = document.getElementById('chat');
  if (!root) return;
  const log = document.getElementById('chat-log');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendBtn = form.querySelector('.chat__send');
  const closeBtn = root.querySelector('.chat__close');
  const API = '/api/chat';
  const PHONE = '02-6140-6747';
  const GREETING = '안녕하세요, 문의 담당 한지수입니다. 품목·영업시간 안내와 수거 요청 접수를 도와드려요.';
  const CHIPS = ['폐지 수거 요청', '고철·비철도 되나요?', '영업시간·위치'];

  let sessionId = null;
  try { sessionId = sessionStorage.getItem('traum-chat-session'); } catch (e) { /* 저장 불가 환경 */ }
  let busy = false;
  let started = false;
  let disabled = false;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const scrollDown = () => { log.scrollTop = log.scrollHeight; };
  const addMsg = (role, text) => {
    const m = el('div', 'chat__msg chat__msg--' + role, text);
    log.appendChild(m);
    scrollDown();
    return m;
  };
  const setBusy = (v) => { busy = v; sendBtn.disabled = v; input.disabled = v; };
  const saveSession = (id) => {
    sessionId = id;
    try { sessionStorage.setItem('traum-chat-session', id); } catch (e) { /* ignore */ }
  };

  const addChips = () => {
    const wrap = el('div', 'chat__chips');
    CHIPS.forEach((label) => {
      const b = el('button', 'chat__chip', label);
      b.type = 'button';
      b.addEventListener('click', () => { wrap.remove(); send(label); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
    scrollDown();
  };

  const showFallback = (reason) => {
    disabled = true;
    const text = reason === 'rate_limited' || reason === 'turn_limit'
      ? '잠시 후 다시 시도해 주세요. 급한 문의는 ' + PHONE + '로 전화 주시면 바로 안내드릴게요.'
      : '지금은 채팅 상담이 어려워요. ' + PHONE + '로 전화 주시거나 카카오·네이버 톡톡으로 문의해 주세요.';
    addMsg('bot', text);
    setBusy(true);
  };

  // 접수 카드: 모델이 모은 품목·수량·지역 + 사용자가 입력하는 주소·연락처
  const addDraftCard = (draft) => {
    const card = el('div', 'chat__card');
    card.appendChild(el('h4', null, '수거 요청 접수'));
    const dl = el('dl');
    [['품목', draft.item], ['수량', draft.quantity], ['지역', draft.region]].forEach(([k, v]) => {
      dl.appendChild(el('dt', null, k));
      dl.appendChild(el('dd', null, v || '-'));
    });
    card.appendChild(dl);
    const addr = el('input'); addr.placeholder = '상세 주소 (선택)'; addr.maxLength = 300;
    const phone = el('input'); phone.placeholder = '연락처 (필수)'; phone.type = 'tel'; phone.maxLength = 20; phone.required = true;
    const btn = el('button', 'btn btn-primary', '접수하기'); btn.type = 'button';
    const note = el('small', null, '접수 후 담당자가 확인 전화를 드립니다. 연락처는 상담 목적으로만 쓰고 90일 후 삭제해요.');
    card.append(addr, phone, btn, note);
    btn.addEventListener('click', async () => {
      const p = phone.value.trim();
      if (!/^0\d{8,10}$/.test(p.replace(/\D/g, ''))) { phone.classList.add('error'); phone.focus(); return; }
      phone.classList.remove('error');
      btn.disabled = true; btn.textContent = '접수 중…';
      try {
        const r = await fetch(API + '/inquiry', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, item: draft.item, quantity: draft.quantity, region: draft.region, address: addr.value.trim(), phone: p, note: draft.note || '' }),
        });
        if (!r.ok) throw new Error('inquiry ' + r.status);
        const data = await r.json();
        card.classList.add('chat__card--done');
        card.innerHTML = '';
        card.appendChild(el('h4', null, '접수되었습니다 · ' + data.id));
        card.appendChild(el('small', null, '담당자가 ' + p + '로 연락드릴게요. 영업시간 외 접수는 다음 영업일에 연락드립니다.'));
      } catch (e) {
        btn.disabled = false; btn.textContent = '접수하기';
        addMsg('bot', '접수가 잠시 안 되고 있어요. ' + PHONE + '로 전화 주시면 바로 접수해 드릴게요.');
      }
      scrollDown();
    });
    log.appendChild(card);
    scrollDown();
  };

  // 담당자 연결 카드: 연락처만 받아 알림
  const addHandoffCard = (info) => {
    const card = el('div', 'chat__card');
    card.appendChild(el('h4', null, '담당자 연결'));
    card.appendChild(el('small', null, (info.reason ? info.reason + ' 건은 ' : '') + '담당자가 직접 안내드려요. 연락처를 남기시거나 ' + PHONE + '로 전화 주세요.'));
    const phone = el('input'); phone.placeholder = '연락처'; phone.type = 'tel'; phone.maxLength = 20;
    const btn = el('button', 'btn btn-primary', '연락 요청'); btn.type = 'button';
    card.append(phone, btn);
    btn.addEventListener('click', async () => {
      const p = phone.value.trim();
      if (!/^0\d{8,10}$/.test(p.replace(/\D/g, ''))) { phone.classList.add('error'); phone.focus(); return; }
      btn.disabled = true;
      try {
        const r = await fetch(API + '/handoff', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, phone: p, reason: info.reason || '' }),
        });
        if (!r.ok) throw new Error('handoff ' + r.status);
        card.classList.add('chat__card--done');
        card.innerHTML = '';
        card.appendChild(el('h4', null, '연락 요청을 남겼어요'));
        card.appendChild(el('small', null, '담당자가 ' + p + '로 연락드릴게요.'));
      } catch (e) {
        btn.disabled = false;
        addMsg('bot', '요청이 잠시 안 되고 있어요. ' + PHONE + '로 전화 주세요.');
      }
      scrollDown();
    });
    log.appendChild(card);
    scrollDown();
  };

  // SSE 파서 (fetch 스트림)
  const readSSE = async (response, onEvent) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, idx); buf = buf.slice(idx + 2);
        let event = 'message'; const dataLines = [];
        block.split('\n').forEach((line) => {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        });
        if (!dataLines.length) continue;
        let data = null;
        try { data = JSON.parse(dataLines.join('\n')); } catch (e) { data = { text: dataLines.join('\n') }; }
        onEvent(event, data);
      }
    }
  };

  const send = async (text) => {
    if (busy || disabled) return;
    const message = (text || input.value).trim();
    if (!message) return;
    input.value = '';
    addMsg('user', message);
    setBusy(true);
    const bot = addMsg('bot', '');
    bot.classList.add('chat__msg--typing');
    let got = false;
    try {
      const r = await fetch(API + '/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message }),
      });
      if (!r.ok) {
        let reason = r.status === 429 ? 'rate_limited' : 'error';
        try { reason = (await r.json()).error || reason; } catch (e) { /* nginx 429는 본문이 HTML */ }
        bot.remove();
        showFallback(reason);
        return;
      }
      await readSSE(r, (event, data) => {
        if (event === 'session' && data.session_id) saveSession(data.session_id);
        else if (event === 'delta') { got = true; bot.classList.remove('chat__msg--typing'); bot.textContent += data.text; scrollDown(); }
        else if (event === 'draft') { bot.classList.remove('chat__msg--typing'); addDraftCard(data); }
        else if (event === 'handoff') { bot.classList.remove('chat__msg--typing'); addHandoffCard(data); }
        else if (event === 'error') { bot.remove(); showFallback('error'); }
        else if (event === 'done') { bot.classList.remove('chat__msg--typing'); if (!got && !bot.textContent) bot.remove(); }
      });
    } catch (e) {
      bot.remove();
      showFallback('error');
      return;
    } finally {
      if (!disabled) { setBusy(false); input.focus(); }
    }
  };

  // 모바일 키보드: 보이는 창(visualViewport) 크기에 패널을 맞춰 헤더·대화가 위로 밀려나지 않게
  const panel = root.querySelector('.chat__panel');
  const vv = window.visualViewport;
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
  const fitViewport = () => {
    if (!vv || root.hidden || !isMobile()) return;
    panel.style.height = Math.round(vv.height) + 'px';
    panel.style.transform = 'translateY(' + Math.round(vv.offsetTop) + 'px)';
    scrollDown();
  };
  const resetViewport = () => {
    panel.style.height = '';
    panel.style.transform = '';
  };
  if (vv) {
    vv.addEventListener('resize', fitViewport);
    vv.addEventListener('scroll', fitViewport);
  }
  input.addEventListener('focus', () => { setTimeout(fitViewport, 300); setTimeout(fitViewport, 700); });

  const open = async () => {
    root.hidden = false;
    document.body.classList.add('chat-open');
    if (isMobile()) window.scrollTo(0, 0);
    fitViewport();
    const launcherMenu = document.querySelector('.launcher-menu');
    const launcherBtn = document.querySelector('.launcher-btn');
    if (launcherMenu && launcherBtn) { launcherMenu.hidden = true; launcherBtn.setAttribute('aria-expanded', 'false'); }
    if (!started) {
      started = true;
      try {
        const h = await fetch(API + '/health').then((r) => r.json());
        if (!h.enabled) { addMsg('bot', GREETING); showFallback('disabled'); return; }
      } catch (e) { addMsg('bot', GREETING); showFallback('error'); return; }
      addMsg('bot', GREETING);
      addChips();
    }
    input.focus();
  };
  const close = () => {
    root.hidden = true;
    document.body.classList.remove('chat-open');
    resetViewport();
  };

  document.querySelectorAll('.js-open-chat').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) close(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
})();
