export interface PostMessagePayload {
  token: string;
  access_token?: string;
  provider?: string;
  state?: string;
}

export interface PageOptions {
  allowedOrigins: string[];
  includeWildcard: boolean;
  autoClose: boolean;
  autoCloseDelayMs: number;
  successBurstIntervalMs: number;
  successBurstAttempts: number;
  fallbackStorageKey: string;
  cspNonce: string;
}

export function buildPostMessageHtml(
  payload: PostMessagePayload,
  opts: PageOptions
): string {
  const allowedList = Array.isArray(opts.allowedOrigins) ? opts.allowedOrigins : [];
  const allowWildcard = opts.includeWildcard === true;
  const provider = payload.provider || 'github';

  const script = `
    (function () {
      var payload = ${JSON.stringify(payload)};
      var storageKey = ${JSON.stringify(opts.fallbackStorageKey)};
      var burstInterval = ${Number(opts.successBurstIntervalMs)};
      var burstLimit = ${Number(opts.successBurstAttempts)};
      var autoClose = ${opts.autoClose ? 'true' : 'false'};
      var autoCloseDelay = ${Number(opts.autoCloseDelayMs)};
      var allowWildcard = ${allowWildcard ? 'true' : 'false'};
      var allowedOrigins = ${JSON.stringify(allowedList)};
      var provider = ${JSON.stringify(provider)};
      var parentOrigin = determineParentOrigin();
      var targets = buildTargets();

      if (!window.opener) {
        renderStandalone();
        return;
      }

      try { window.opener.postMessage('authorizing:' + provider, '*'); } catch (_) {}
      rememberToken(payload);
      rememberNonce(payload);
      updateImplicitHash(payload);
      cachePopupToken(payload, storageKey);
      relayAll(targets, payload);
      scheduleBursts(targets, payload, burstInterval, burstLimit);
      window.addEventListener('message', handleAck, false);
      renderManualFinish(targets, payload);
      if (autoClose) {
        setTimeout(function () { try { window.close(); } catch (_) {} }, autoCloseDelay);
      }

      function determineParentOrigin() {
        try { return window.opener.location.origin; } catch (_) {}
        try { return new URL(document.referrer).origin; } catch (_) {}
        return '';
      }

      function buildTargets() {
        var seen = {};
        var list = [];
        function add(origin) { if (!origin || seen[origin]) return; seen[origin] = true; list.push(origin); }
        if (allowWildcard) {
          if (parentOrigin) add(parentOrigin);
          (allowedOrigins || []).forEach(add);
          add('*');
        } else {
          if (isOriginAllowed(parentOrigin)) add(parentOrigin);
          (allowedOrigins || []).forEach(add);
        }
        return list;
      }

      function relayAll(targets, payload) {
        (targets || []).forEach(function (origin) {
          if (origin === '*' && !allowWildcard) return;
          if (origin !== '*' && !isOriginAllowed(origin)) return;
          postToOrigin(origin, payload);
        });
      }

      function postToOrigin(origin, payload) {
        try {
          var successMessage = 'authorization:' + provider + ':success:' + JSON.stringify(payload);
          window.opener.postMessage(successMessage, origin);
        } catch (_) {}
        try {
          window.opener.postMessage({ type: 'authorization', provider: provider, token: payload.token, access_token: payload.access_token || payload.token, state: payload.state }, origin);
        } catch (_) {}
      }

      function handleAck(event) {
        if (!event || !event.origin) return;
        if (!isOriginAllowed(event.origin)) return;
        relayAll([event.origin], payload);
        window.removeEventListener('message', handleAck, false);
      }

      function isOriginAllowed(origin) {
        if (!origin) return false;
        if (allowWildcard) return true;
        return allowedOrigins.indexOf(origin) !== -1;
      }

      function rememberToken(payload) {
        if (!payload || !payload.token) return;
        try {
          var serialized = JSON.stringify({ token: payload.token, backendName: provider });
          window.opener.localStorage.setItem('decap-cms-user', serialized);
          window.opener.localStorage.setItem('netlify-cms-user', serialized);
        } catch (_) {}
      }

      function rememberNonce(payload) {
        if (!payload || !payload.state) return;
        try { window.opener.sessionStorage.setItem('decap-cms-auth', JSON.stringify({ nonce: payload.state })); } catch (_) {}
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
            'provider=' + encodeURIComponent(provider),
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

      function renderStandalone() { document.body.textContent = 'OAuth done. You may close this window.'; }
    })();
  `;

  const html = `<!doctype html><html><body><script nonce="${opts.cspNonce}">${script}</script></body></html>`;
  return html;
}

export function buildCspHeader(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    `style-src 'nonce-${nonce}'`,
    "connect-src 'none'"
  ].join('; ');
}

export function randomNonce(bytes = 16): string {
  // Lightweight nonce; Node 20 crypto.randomBytes available, but avoid import for bundle simplicity
  const table = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < bytes * 2; i++) out += table[Math.floor(Math.random() * table.length)];
  return out;
}

