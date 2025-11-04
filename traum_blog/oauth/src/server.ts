import express from 'express';
import fetch from 'node-fetch';
import { Counter, Registry } from 'prom-client';
import { buildCspHeader, buildPostMessageHtml, randomNonce, PostMessagePayload } from './page.js';

const app = express();

// Env & defaults
const PORT = Number(process.env.PORT || 3000);
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const REDIRECT_URL = process.env.OAUTH_REDIRECT_URL || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const DEV_ALLOW_ALL_ORIGINS = process.env.DEV_ALLOW_ALL_ORIGINS === '1';
const GITHUB_SCOPE = process.env.GITHUB_SCOPE || 'repo';
const OAUTH_AUTOCLOSE = process.env.OAUTH_AUTOCLOSE !== '0';
const AUTO_CLOSE_DELAY_MS = Number(process.env.OAUTH_AUTOCLOSE_DELAY_MS || 400);
const SUCCESS_BURST_INTERVAL_MS = Number(process.env.OAUTH_SUCCESS_BURST_INTERVAL_MS || 400);
const SUCCESS_BURST_ATTEMPTS = Number(process.env.OAUTH_SUCCESS_BURST_ATTEMPTS || 12);
const TEST_MODE_ENABLED = process.env.OAUTH_TEST_MODE === '1';
const FALLBACK_STORAGE_KEY = 'decap_oauth_fallback_token';

// Metrics
const METRICS_ENABLED = process.env.METRICS_ENABLED === '1';
const METRICS_BASIC_AUTH_USER = process.env.METRICS_BASIC_AUTH_USER || '';
const METRICS_BASIC_AUTH_PASS = process.env.METRICS_BASIC_AUTH_PASS || '';
const registry = new Registry();
const mRequests = new Counter({ name: 'oauth_requests_total', help: 'OAuth requests', registers: [registry] });
const mSuccess = new Counter({ name: 'oauth_success_total', help: 'OAuth success', registers: [registry] });
const mErrors = new Counter({ name: 'oauth_errors_total', help: 'OAuth errors', registers: [registry] });

function metricsAuthOk(req: express.Request): boolean {
  if (!METRICS_ENABLED) return false;
  if (METRICS_BASIC_AUTH_USER && METRICS_BASIC_AUTH_PASS) {
    const hdr = String(req.headers['authorization'] || '');
    if (!hdr.startsWith('Basic ')) return false;
    const raw = Buffer.from(hdr.slice(6), 'base64').toString();
    const [u, p] = raw.split(':');
    return u === METRICS_BASIC_AUTH_USER && p === METRICS_BASIC_AUTH_PASS;
  }
  return true;
}

// Routes
app.get('/auth', (req, res) => {
  mRequests.inc();
  const state = String(req.query.state || '');

  if (req.query.test === '1') {
    if (!TEST_MODE_ENABLED) return res.status(403).send('OAuth test mode is disabled');
    const payload: PostMessagePayload = { token: 'gho_test_token', access_token: 'gho_test_token', provider: 'github', state };
    const nonce = randomNonce();
    res.set('Content-Security-Policy', buildCspHeader(nonce));
    const html = buildPostMessageHtml(payload, {
      allowedOrigins: ALLOWED_ORIGINS,
      includeWildcard: DEV_ALLOW_ALL_ORIGINS,
      autoClose: OAUTH_AUTOCLOSE,
      autoCloseDelayMs: AUTO_CLOSE_DELAY_MS,
      successBurstIntervalMs: SUCCESS_BURST_INTERVAL_MS,
      successBurstAttempts: SUCCESS_BURST_ATTEMPTS,
      fallbackStorageKey: FALLBACK_STORAGE_KEY,
      cspNonce: nonce,
    });
    return res.send(html);
  }

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URL);
  url.searchParams.set('scope', GITHUB_SCOPE);
  if (state) url.searchParams.set('state', state);
  res.redirect(url.toString());
});

app.get('/callback', async (req, res) => {
  mRequests.inc();
  const code = String(req.query.code || '');
  const state = String(req.query.state || '');
  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: REDIRECT_URL, state }),
    });
    const tokenText = await tokenResp.text();
    let tokenJson: any;
    try { tokenJson = JSON.parse(tokenText); } catch { throw new Error('GitHub returned an unexpected response'); }
    if (!tokenJson.access_token) return res.status(401).send('OAuth failed');

    const payload: PostMessagePayload = { token: tokenJson.access_token, access_token: tokenJson.access_token, provider: 'github', state };
    const nonce = randomNonce();
    res.set('Content-Security-Policy', buildCspHeader(nonce));
    const html = buildPostMessageHtml(payload, {
      allowedOrigins: ALLOWED_ORIGINS,
      includeWildcard: DEV_ALLOW_ALL_ORIGINS,
      autoClose: OAUTH_AUTOCLOSE,
      autoCloseDelayMs: AUTO_CLOSE_DELAY_MS,
      successBurstIntervalMs: SUCCESS_BURST_INTERVAL_MS,
      successBurstAttempts: SUCCESS_BURST_ATTEMPTS,
      fallbackStorageKey: FALLBACK_STORAGE_KEY,
      cspNonce: nonce,
    });
    mSuccess.inc();
    res.send(html);
  } catch (e: any) {
    mErrors.inc();
    res.status(500).send('OAuth error: ' + (e?.message || 'unknown'));
  }
});

app.get('/metrics', async (req, res) => {
  if (!metricsAuthOk(req)) return res.status(403).send('forbidden');
  res.setHeader('Content-Type', registry.contentType);
  res.send(await registry.metrics());
});

app.get('/', (_req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log('OAuth server listening on ' + PORT);
});

export default app;

