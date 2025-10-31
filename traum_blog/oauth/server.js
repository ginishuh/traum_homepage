import express from 'express';
import fetch from 'node-fetch';

const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URL = process.env.OAUTH_REDIRECT_URL; // e.g., https://blog.trr.co.kr/oauth/callback
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const DEV_ALLOW_ALL_ORIGINS = process.env.DEV_ALLOW_ALL_ORIGINS === '1';
const GITHUB_SCOPE = process.env.GITHUB_SCOPE || 'repo';
const OAUTH_AUTOCLOSE = process.env.OAUTH_AUTOCLOSE !== '0';

// 권장 방식(+폴백):
// 1) 팝업이 'authorizing:github' 을 보냄 → 부모가 응답
// 2) 응답의 origin 으로 'authorization:github:success:{...}' 전송
// 3) 폴백: 허용 오리진 및 '*' 로도 재전송(일부 테마/버전 호환)
function htmlPostMessage(allowedOrigins, devAllowAll, payload) {
  const allowed = Array.isArray(allowedOrigins) ? allowedOrigins : [];
  const data = payload; // 객체 그대로 유지
  const fallbackTargets = Array.from(new Set([...(allowed || []), ...(devAllowAll ? ['*'] : [])]));
  const autoClose = OAUTH_AUTOCLOSE ? 'true' : 'false';
  return `<!doctype html><html><body><script>
  (function() {
    var data = ${JSON.stringify(data)};
    var fallbackTargets = ${JSON.stringify(fallbackTargets)};
    // 부모 오리진 추정(최우선: opener.location.origin, 폴백: document.referrer)
    var parentOrigin = '';
    try { if (window.opener && window.opener.location) parentOrigin = window.opener.location.origin; } catch (_e) {}
    if (!parentOrigin) { try { parentOrigin = new URL(document.referrer).origin; } catch (_e2) {}
    }
    function successTo(origin){
      if (!window.opener) return;
      var msg = 'authorization:' + (data.provider||'github') + ':success:' + JSON.stringify(data);
      // 문자열 프로토콜(구버전 호환)
      try { window.opener.postMessage(msg, origin); } catch(e) {}
      // 객체 프로토콜(일부 버전 호환)
      try { window.opener.postMessage({ type: 'authorization', provider: (data.provider||'github'), token: data.token }, origin); } catch(e) {}
      console.log('[OAuth] success posted to', origin);
      if (${autoClose}) setTimeout(function(){ try{ window.close(); }catch(e){} }, 400);
    }
    function receiveAck(e){
      try { successTo(e.origin); } catch(err) {}
      window.removeEventListener('message', receiveAck, false);
    }
    // 즉시 전송 + 버스트 반복(ACK 없어도 전달)
    function burstOnce(){
      if (parentOrigin) successTo(parentOrigin);
      try { fallbackTargets.forEach(function(t){ successTo(t); }); } catch(_){}
    }
    function start(){
      if (!window.opener){ document.body.textContent = 'OAuth done. You may close this window.'; return; }
      window.addEventListener('message', receiveAck, false);
      try { window.opener.postMessage('authorizing:github', '*'); } catch(e) {}
      try { if (data && data.token) localStorage.setItem('decap_oauth_fallback_token', data.token); } catch(_){}
      // ▶ 즉시 1회 + 0.4s 간격 약 5초 반복
      burstOnce();
      var count = 0; var iv = setInterval(function(){
        burstOnce();
        if (++count >= 12) clearInterval(iv);
      }, 400);
    }
    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();
    // 수동 버튼
    document.body.innerHTML = '<p>GitHub 인증 완료. 자동으로 닫히지 않으면 Finish를 누르세요.</p>'+
      '<button id="finish">Finish Login</button>';
    document.getElementById('finish').addEventListener('click', function(){
      if (parentOrigin) successTo(parentOrigin);
      fallbackTargets.forEach(function(t){ successTo(t); });
    });
  })();
  </script></body></html>`;
}

app.get('/auth', (req, res) => {
  const state = req.query.state || '';
  console.log('OAuth auth request:', { state });
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URL);
  url.searchParams.set('scope', GITHUB_SCOPE);
  if (state) url.searchParams.set('state', state);
  console.log('Redirecting to GitHub:', url.toString());
  res.redirect(url.toString());
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state || '';
  console.log('OAuth callback received:', { code: code ? 'present' : 'missing', state });
  if (!code) return res.status(400).send('Missing code');
  try {
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URL,
        state
      })
    });
    const tokenText = await tokenResp.text();
    console.log('GitHub token response status:', tokenResp.status);
    console.log('GitHub token response text:', tokenText.substring(0, 500));

    let tokenJson;
    try {
      tokenJson = JSON.parse(tokenText);
    } catch (parseError) {
      console.error('Failed to parse GitHub response as JSON');
      throw new Error('GitHub returned non-JSON response: ' + tokenText.substring(0, 200));
    }
    console.log('GitHub token response parsed:', tokenJson);
    if (!tokenJson.access_token) {
      console.error('OAuth failed: no access_token in response');
      return res.status(401).send('OAuth failed');
    }
    const payload = { token: tokenJson.access_token, provider: 'github' };
    // 최소한의 CSP만 부여. 인라인 스크립트/스타일 허용(디버그 텍스트용), 외부 연결 차단.
    res.set('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none';");
    res.send(htmlPostMessage(ALLOWED_ORIGINS, DEV_ALLOW_ALL_ORIGINS, payload));
  } catch (e) {
    console.error('OAuth error:', e.message, e.stack);
    res.status(500).send('OAuth error: ' + e.message);
  }
});

app.get('/', (_req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log('OAuth server listening on ' + PORT);
});
