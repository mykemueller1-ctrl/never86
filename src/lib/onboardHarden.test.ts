import { afterEach, describe, expect, it } from 'vitest';
import { allowAuthAttempt, AUTH_THROTTLE_LIMITS, resetAuthThrottleForTests } from './authThrottle';
import { escapeHtml } from './escapeHtml';
import { pickTrustedClientIp } from './trustedClientIp';

describe('escapeHtml', () => {
  it('escapes operator-supplied values for HTML email', () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)"> & 'Joe'`)).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#039;Joe&#039;',
    );
  });
});

describe('pickTrustedClientIp', () => {
  it('uses the first forwarded hop and ignores extra client hops', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.10, 10.0.0.1, 127.0.0.1',
      'x-real-ip': '198.51.100.2',
    });
    expect(pickTrustedClientIp(headers)).toBe('203.0.113.10');
  });

  it('falls back to x-real-ip then cf-connecting-ip', () => {
    expect(pickTrustedClientIp(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
    expect(pickTrustedClientIp(new Headers({ 'cf-connecting-ip': '192.0.2.4' }))).toBe('192.0.2.4');
    expect(pickTrustedClientIp(new Headers())).toBeUndefined();
  });
});

describe('authThrottle', () => {
  afterEach(() => resetAuthThrottleForTests());

  it('throttles activation by normalized email', () => {
    const nowMs = 1_700_000_000_000;
    for (let i = 0; i < AUTH_THROTTLE_LIMITS.activation.email; i += 1) {
      expect(allowAuthAttempt({ kind: 'activation', email: '  Myke@N86.APP ', nowMs })).toBe(true);
    }
    expect(allowAuthAttempt({ kind: 'activation', email: 'myke@n86.app', nowMs })).toBe(false);
  });

  it('throttles activation by trusted IP independently', () => {
    const nowMs = 1_700_000_000_000;
    for (let i = 0; i < AUTH_THROTTLE_LIMITS.activation.ip; i += 1) {
      expect(
        allowAuthAttempt({
          kind: 'activation',
          email: `probe${i}@never86.test`,
          ip: '203.0.113.8',
          nowMs,
        }),
      ).toBe(true);
    }
    expect(
      allowAuthAttempt({
        kind: 'activation',
        email: 'other@never86.test',
        ip: '203.0.113.8',
        nowMs,
      }),
    ).toBe(false);
  });

  it('throttles login by normalized email', () => {
    const nowMs = 1_700_000_000_000;
    for (let i = 0; i < AUTH_THROTTLE_LIMITS.login.email; i += 1) {
      expect(allowAuthAttempt({ kind: 'login', email: 'Seat@N86.APP', ip: '203.0.113.1', nowMs })).toBe(true);
    }
    expect(allowAuthAttempt({ kind: 'login', email: 'seat@n86.app', ip: '203.0.113.1', nowMs })).toBe(false);
  });
});
