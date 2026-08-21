import { describe, it, expect, beforeAll } from 'vitest';
import { signOperatorSession, verifyOperatorSession } from './operatorSession';

// The whole security promise: a logged-in operator carries a signed cookie that
// contains ONLY their own operator_id, and it cannot be forged or edited to
// point at a different operator. These tests lock that in.

const NOW = 1_700_000_000_000; // fixed "now" in ms

beforeAll(() => {
  process.env.OPERATOR_SESSION_SECRET = 'test-secret-please-change';
  // Keep fallback seeds out of the test env so the "disabled" case is clean.
  delete process.env.REPORTS_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.OPS_DATABASE_URL;
});

describe('operator session · sign/verify roundtrip', () => {
  it('a freshly signed session verifies back to the same operator', async () => {
    const token = await signOperatorSession(7, 'owner@store.com', NOW);
    expect(token).toBeTypeOf('string');
    const session = await verifyOperatorSession(token!, NOW);
    expect(session).not.toBeNull();
    expect(session!.operatorId).toBe(7);
    expect(session!.email).toBe('owner@store.com');
  });
});

describe('operator session · cannot be forged to another operator', () => {
  it('editing the payload (operator 7 -> 3) fails verification', async () => {
    const token = (await signOperatorSession(7, 'owner@store.com', NOW))!;
    const [payload, sig] = token.split('.');
    // Decode, flip operatorId to 3, re-encode — but keep the OLD signature.
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    json.operatorId = 3;
    const forgedPayload = Buffer.from(JSON.stringify(json)).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const forged = `${forgedPayload}.${sig}`;
    const session = await verifyOperatorSession(forged, NOW);
    expect(session).toBeNull();
  });

  it('a token signed with a different secret does not verify', async () => {
    const token = (await signOperatorSession(7, 'owner@store.com', NOW))!;
    process.env.OPERATOR_SESSION_SECRET = 'a-different-secret';
    const session = await verifyOperatorSession(token, NOW);
    expect(session).toBeNull();
    process.env.OPERATOR_SESSION_SECRET = 'test-secret-please-change';
  });
});

describe('operator session · expiry + missing config', () => {
  it('an expired session (13h later) is rejected', async () => {
    const token = (await signOperatorSession(7, 'owner@store.com', NOW))!;
    const later = NOW + 13 * 60 * 60 * 1000;
    expect(await verifyOperatorSession(token, later)).toBeNull();
  });

  it('garbage / missing tokens verify to null', async () => {
    expect(await verifyOperatorSession(undefined, NOW)).toBeNull();
    expect(await verifyOperatorSession('not-a-token', NOW)).toBeNull();
    expect(await verifyOperatorSession('a.b', NOW)).toBeNull();
  });

  it('with no secret and no fallback seed, signing is disabled (returns null)', async () => {
    const saved = process.env.OPERATOR_SESSION_SECRET;
    delete process.env.OPERATOR_SESSION_SECRET;
    expect(await signOperatorSession(7, 'x@y.com', NOW)).toBeNull();
    process.env.OPERATOR_SESSION_SECRET = saved;
  });

  it('falls back to an existing server secret so the portal works out of the box', async () => {
    const saved = process.env.OPERATOR_SESSION_SECRET;
    delete process.env.OPERATOR_SESSION_SECRET;
    process.env.REPORTS_PASSWORD = 'some-existing-reports-password';
    const token = await signOperatorSession(7, 'x@y.com', NOW);
    expect(token).toBeTypeOf('string');
    expect((await verifyOperatorSession(token!, NOW))!.operatorId).toBe(7);
    delete process.env.REPORTS_PASSWORD;
    process.env.OPERATOR_SESSION_SECRET = saved;
  });
});
