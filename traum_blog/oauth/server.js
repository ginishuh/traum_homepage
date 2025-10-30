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

function htmlPostMessage(targetOrigin, payload) {
  return `<!doctype html><html><body><script>
  (function() {
    function send() {
      var data = ${JSON.stringify(payload)};
      var origin = ${JSON.stringify(targetOrigin)};
      if (window.opener) {
        // Decap CMS expects a string in format: "authorization:provider:success:{json}"
        var message = 'authorization:' + data.provider + ':success:' + JSON.stringify(data);
        window.opener.postMessage(message, origin);
        setTimeout(function() { window.close(); }, 1000);
      } else {
        document.body.innerText = 'Error: window.opener is null. You can close this window.';
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', send);
    } else {
      send();
    }
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
    // targetOrigin: 개발 편의를 위해 DEV_ALLOW_ALL_ORIGINS=1이면 '*' 사용
    const origin = DEV_ALLOW_ALL_ORIGINS ? '*' : (ALLOWED_ORIGINS[0] || '*');
    const payload = { token: tokenJson.access_token, provider: 'github' };
    res.set('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; connect-src 'none';");
    res.send(htmlPostMessage(origin, payload));
  } catch (e) {
    console.error('OAuth error:', e.message, e.stack);
    res.status(500).send('OAuth error: ' + e.message);
  }
});

app.get('/', (_req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log('OAuth server listening on ' + PORT);
});
