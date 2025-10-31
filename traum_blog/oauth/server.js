import express from 'express';
import fetch from 'node-fetch';

const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URL = process.env.OAUTH_REDIRECT_URL; // e.g., https://blog.trr.co.kr/oauth/callback
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const DEV_ALLOW_ALL_ORIGINS = process.env.DEV_ALLOW_ALL_ORIGINS === '1';
const GITHUB_SCOPE = process.env.GITHUB_SCOPE || 'repo';
const OAUTH_AUTOCLOSE = process.env.OAUTH_AUTOCLOSE !== '0';
const AUTO_CLOSE_DELAY_MS = Number(process.env.OAUTH_AUTOCLOSE_DELAY_MS || 400);
const SUCCESS_BURST_INTERVAL_MS = Number(process.env.OAUTH_SUCCESS_BURST_INTERVAL_MS || 400);
const SUCCESS_BURST_ATTEMPTS = Number(process.env.OAUTH_SUCCESS_BURST_ATTEMPTS || 12);
const TEST_MODE_ENABLED = process.env.OAUTH_TEST_MODE === '1';
const FALLBACK_STORAGE_KEY = 'decap_oauth_fallback_token';

function buildPostMessagePage(payload, options = {}) {
  const extraTargets = Array.isArray(options.allowedOrigins) ? options.allowedOrigins : [];
  const includeWildcard = options.includeWildcard ? ['*'] : [];
  const targets = Array.from(new Set([...extraTargets, ...includeWildcard]));

  const script = `
    (function () {
      var payload = ${JSON.stringify(payload)};
      var storageKey = '${FALLBACK_STORAGE_KEY}';
      var burstInterval = ${SUCCESS_BURST_INTERVAL_MS};
      var burstLimit = ${SUCCESS_BURST_ATTEMPTS};
      var autoClose = ${OAUTH_AUTOCLOSE ? 'true' : 'false'};
      var autoCloseDelay = ${AUTO_CLOSE_DELAY_MS};
      var parentOrigin = determineParentOrigin();
      var targets = buildTargets(parentOrigin, ${JSON.stringify(targets)});

      if (!window.opener) {
        renderStandalone();
        return;
      }

      try { window.opener.postMessage('authorizing:github', '*'); } catch (_) {}
      rememberToken(payload);
      rememberNonce(payload);
      updateImplicitHash(payload);
      cachePopupToken(payload, storageKey);
      relayAll(targets, payload);
      scheduleBursts(targets, payload, burstInterval, burstLimit);
      window.addEventListener('message', handleAck, false);
      renderManualFinish(targets, payload);
      if (autoClose) {
        setTimeout(function () {
          try { window.close(); } catch (_) {}
        }, autoCloseDelay);
      }

      function determineParentOrigin() {
        try { return window.opener.location.origin; } catch (_) {}
        try { return new URL(document.referrer).origin; } catch (_) {}
        return '';
      }

      function buildTargets(parentOrigin, extras) {
        var seen = {};
        var list = [];
        function add(origin) {
          if (!origin || seen[origin]) return;
          seen[origin] = true;
          list.push(origin);
        }
        add(parentOrigin);
        (extras || []).forEach(add);
        return list;
      }

      function relayAll(targets, payload) {
        (targets || []).forEach(function (origin) {
          postToOrigin(origin, payload);
        });
      }

      function postToOrigin(origin, payload) {
        try {
          var successMessage = 'authorization:' + (payload.provider || 'github') + ':success:' + JSON.stringify(payload);
          window.opener.postMessage(successMessage, origin);
        } catch (_) {}
        try {
          window.opener.postMessage({
            type: 'authorization',
            provider: payload.provider || 'github',
            token: payload.token,
            access_token: payload.access_token || payload.token,
            state: payload.state
          }, origin);
        } catch (_) {}
      }

      function handleAck(event) {
        if (!event || !event.origin) return;
        relayAll([event.origin], payload);
        window.removeEventListener('message', handleAck, false);
      }

      function rememberToken(payload) {
        if (!payload || !payload.token) return;
        try {
          var serialized = JSON.stringify({ token: payload.token, backendName: payload.provider || 'github' });
          window.opener.localStorage.setItem('decap-cms-user', serialized);
          window.opener.localStorage.setItem('netlify-cms-user', serialized);
        } catch (_) {}
      }

      function rememberNonce(payload) {
        if (!payload || !payload.state) return;
        try {
          window.opener.sessionStorage.setItem('decap-cms-auth', JSON.stringify({ nonce: payload.state }));
        } catch (_) {}
      }

      function updateImplicitHash(payload) {
        if (!payload || !payload.token) return;
        try {
          var openerLocation = window.opener.location;
          if (!openerLocation) return;
          var baseHref = openerLocation.href.split('#')[0];
          var hashParts = [
            'access_token=' + encodeURIComponent(payload.token),
            'token_type=bearer',
            'provider=' + encodeURIComponent(payload.provider || 'github'),
            'expires_in=3600',
            'scope=' + encodeURIComponent('repo public_repo read:user')
          ];
          if (payload.state) hashParts.push('state=' + encodeURIComponent(payload.state));
          var hash = '#' + hashParts.join('&');
          try { openerLocation.hash = hash; } catch (_) { openerLocation.href = baseHref + hash; }
          try { window.opener.dispatchEvent(new HashChangeEvent('hashchange')); } catch (_) {}
        } catch (_) {}
      }

      function cachePopupToken(payload, storageKey) {
        if (!payload || !payload.token) return;
        try { localStorage.setItem(storageKey, payload.token); } catch (_) {}
      }

      function scheduleBursts(targets, payload, interval, limit) {
        if (!interval || interval <= 0 || !limit) return;
        var attempts = 0;
        var timer = setInterval(function () {
          attempts += 1;
          relayAll(targets, payload);
          if (attempts >= limit) clearInterval(timer);
        }, interval);
      }

      function renderManualFinish(targets, payload) {
        document.body.innerHTML = '<p>GitHub authentication complete. Close this window or click Finish.</p>';
        var button = document.createElement('button');
        button.id = 'finish-login';
        button.textContent = 'Finish Login';
        button.addEventListener('click', function () { relayAll(targets, payload); });
        document.body.appendChild(button);
      }

      function renderStandalone() {
        document.body.textContent = 'OAuth done. You may close this window.';
      }
    })();
  `;

  return `<!doctype html><html><body><script>${script}</script></body></html>`;
}

app.get('/auth', (req, res) => {
  const state = req.query.state || '';

  if (req.query.test === '1') {
    if (!TEST_MODE_ENABLED) {
      return res.status(403).send('OAuth test mode is disabled');
    }
    const payload = { token: 'gho_test_token', access_token: 'gho_test_token', provider: 'github', state };
    res.set('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none';");
    return res.send(buildPostMessagePage(payload, { allowedOrigins: ALLOWED_ORIGINS, includeWildcard: DEV_ALLOW_ALL_ORIGINS }));
  }

  console.log('OAuth auth request:', { state });
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URL);
  url.searchParams.set('scope', GITHUB_SCOPE);
  if (state) url.searchParams.set('state', state);
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

    let tokenJson;
    try {
      tokenJson = JSON.parse(tokenText);
    } catch (parseError) {
      console.error('Failed to parse GitHub response as JSON');
      throw new Error('GitHub returned an unexpected response');
    }

    if (!tokenJson.access_token) {
      console.error('OAuth failed: access_token missing in response');
      return res.status(401).send('OAuth failed');
    }

    const payload = { token: tokenJson.access_token, access_token: tokenJson.access_token, provider: 'github', state };
    res.set('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none';");
    res.send(buildPostMessagePage(payload, { allowedOrigins: ALLOWED_ORIGINS, includeWildcard: DEV_ALLOW_ALL_ORIGINS }));
  } catch (e) {
    console.error('OAuth error:', e.message);
    res.status(500).send('OAuth error: ' + e.message);
  }
});

app.get('/', (_req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log('OAuth server listening on ' + PORT);
});
