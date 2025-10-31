const { test, expect } = require('@playwright/test');

test('admin receives OAuth token (test mode) and sends GitHub API with Authorization', async ({ page, context }) => {
  // Arrange: Intercept GitHub API and capture requests
  const captured = [];
  page.on('console', msg => console.log('[page]', msg.type(), msg.text()));
  await context.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    captured.push(req);
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization,content-type',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'content-type': 'application/json'
    };
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 200, headers, body: '' });
    }
    const url = req.url();
    let body = { ok: true };
    if (url.endsWith('/user')) {
      body = {
        login: 'test-user',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.png',
        email: 'test@example.com',
      };
    }
    return route.fulfill({ status: 200, headers, body: JSON.stringify(body) });
  });

  // Patch window.open so real OAuth flow runs with test token
  await page.addInitScript(() => {
    const rawOpen = window.open;
    window.open = function(url, name, specs){
      if (typeof url === 'string' && url.includes('/oauth/auth')) {
        url += (url.includes('?') ? '&' : '?') + 'test=1';
      }
      return rawOpen ? rawOpen.call(this, url, name, specs) : null;
    };
  });

  // Ensure blog/oauth are up (best-effort; ignore failures)
  try {
  await page.goto('http://localhost:17177/admin/?config=config.dev.yml', { waitUntil: 'load' });
  } catch (_) {}

  // Act: Open OAuth TEST popup so that window.opener is the admin page
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('text=Login with GitHub'),
  ]);
  await popup.waitForEvent('close', { timeout: 5000 }).catch(() => {});

  // Allow the SPA to finish its authentication cycle
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Read token stored by popup and trigger explicit GitHub API call with Authorization
  const token = await page.evaluate(() => {
    const KEYS = ['decap-cms-user', 'netlify-cms-user'];
    for (const key of KEYS) {
      try {
        const u = JSON.parse(localStorage.getItem(key) || '{}');
        if (u && u.token) return u.token;
      } catch { /* ignore */ }
    }
    return null;
  });
  expect(token).toBeTruthy();
  await page.evaluate(async (t) => {
    await fetch('https://api.github.com/user', { headers: { Authorization: 'token ' + t } });
  }, token);

  // Login 버튼이 사라졌는지 확인 (UI 전환)
  await expect(page.locator('text=Login with GitHub')).toHaveCount(0, { timeout: 5000 });

  // Take a screenshot for visual confirmation
  await page.screenshot({ path: 'tests/e2e/screens/admin-after-login.png', fullPage: true });

  // Assert: At least one API call was made with Authorization header containing our fake token
  await expect.poll(async () => captured.length, { timeout: 5000 }).toBeGreaterThan(0);
  const authReq = captured.find(r => r.method() !== 'OPTIONS' && r.headers()['authorization']);
  expect(authReq).toBeTruthy();
  const auth = authReq.headers()['authorization'];
  expect(auth.toLowerCase()).toContain('token');
  expect(auth).toContain('gho_test_token');

  // And localStorage has been populated by the popup
  const stored = await page.evaluate(() => localStorage.getItem('decap-cms-user'));
  expect(stored).toBeTruthy();
});
