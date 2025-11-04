import { describe, it, expect } from 'vitest'
import { buildCspHeader, buildPostMessageHtml } from '../src/page'

describe('CSP header', () => {
  it('includes nonce and no unsafe-inline', () => {
    const h = buildCspHeader('abc123')
    expect(h).toContain("script-src 'nonce-abc123'")
    expect(h).not.toContain("unsafe-inline")
  })
})

describe('postMessage page', () => {
  it('renders HTML with script nonce attr', () => {
    const html = buildPostMessageHtml(
      { token: 'x', provider: 'github', state: 's' },
      {
        allowedOrigins: ['https://blog.trr.co.kr'],
        includeWildcard: false,
        autoClose: true,
        autoCloseDelayMs: 100,
        successBurstIntervalMs: 100,
        successBurstAttempts: 3,
        fallbackStorageKey: 'k',
        cspNonce: 'nonce123',
      }
    )
    expect(html).toContain('script nonce="nonce123"')
    expect(html).toContain('Finish Login')
  })
})

