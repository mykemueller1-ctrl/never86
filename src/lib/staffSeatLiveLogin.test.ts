import { afterEach, describe, expect, it } from 'vitest';
import {
  STAFF_SEAT_LOGIN_ENABLED_ENV,
  evaluateStaffSeatLoginEnablement,
  fingerprintStaffToken,
  isSafeStaffInviteHandle,
} from './staffSeatAuth';
import { attemptLiveStaffSeatLogin } from './staffSeatLiveLogin';

const ORIGINAL_URL = process.env.DATABASE_URL;
const ORIGINAL_FLAG = process.env[STAFF_SEAT_LOGIN_ENABLED_ENV];

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL_URL;
  if (ORIGINAL_FLAG === undefined) delete process.env[STAFF_SEAT_LOGIN_ENABLED_ENV];
  else process.env[STAFF_SEAT_LOGIN_ENABLED_ENV] = ORIGINAL_FLAG;
});

describe('staff seat live login enablement', () => {
  it('fails closed when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    delete process.env[STAFF_SEAT_LOGIN_ENABLED_ENV];
    const gate = evaluateStaffSeatLoginEnablement();
    expect(gate.ready).toBe(false);
    expect(gate.issuance).toBe('blocked');
    expect(gate.status).toBe('database_url_missing');
    expect(gate.mailSent).toBe(false);
    expect(gate.ownerPlane).toBe('/login');
    expect(gate.error).toMatch(/DATABASE_URL is missing/);
  });

  it('stays blocked when DATABASE_URL is present but STAFF_SEAT_LOGIN_ENABLED is not true', () => {
    process.env.DATABASE_URL = 'postgres://example.invalid/never86';
    delete process.env[STAFF_SEAT_LOGIN_ENABLED_ENV];
    const gate = evaluateStaffSeatLoginEnablement();
    expect(gate.ready).toBe(false);
    expect(gate.status).toBe('not_enabled');
    expect(gate.error).toMatch(/STAFF_SEAT_LOGIN_ENABLED=true/);
    expect(gate.error).toMatch(/hashed only/);
  });

  it('marks ready after Neon apply only when the enable flag is true', () => {
    process.env.DATABASE_URL = 'postgres://example.invalid/never86';
    process.env[STAFF_SEAT_LOGIN_ENABLED_ENV] = 'true';
    const gate = evaluateStaffSeatLoginEnablement();
    expect(gate.ready).toBe(true);
    expect(gate.issuance).toBe('enabled');
    expect(gate.status).toBe('ready_after_neon_apply');
    expect(gate.mailSent).toBe(false);
  });

  it('rejects email and PIN-like invite handles', () => {
    expect(isSafeStaffInviteHandle('synth-101-foh-manager')).toBe(true);
    expect(isSafeStaffInviteHandle('person@example.com')).toBe(false);
    expect(isSafeStaffInviteHandle('1234')).toBe(false);
    expect(isSafeStaffInviteHandle('pin-1234')).toBe(false);
  });

  it('authenticates only against a hashed invite token and never sends mail', async () => {
    process.env.DATABASE_URL = 'postgres://example.invalid/never86';
    process.env[STAFF_SEAT_LOGIN_ENABLED_ENV] = 'true';
    const secret = 'a'.repeat(32);
    const tokenHash = fingerprintStaffToken(secret);
    const ok = await attemptLiveStaffSeatLogin({
      inviteHandle: 'synth-101-foh-manager',
      deliverySecret: secret,
      lookup: async (input) => {
        expect(input.tokenHash).toBe(tokenHash);
        expect(JSON.stringify(input)).not.toContain(secret);
        return {
          inviteHandle: 'synth-101-foh-manager',
          tokenHash,
          expiresAt: '2099-01-01T00:00:00.000Z',
          consumedAt: null,
          operatorId: 101,
          locationId: 11,
          seatId: 'seat-101-foh-manager',
          seatKey: 'foh_manager',
          status: 'invited',
        };
      },
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.session.grantsFullOperatorAccess).toBe(false);
    expect(ok.mailSent).toBe(false);
    expect(ok.issuance).toBe('enabled');

    const denied = await attemptLiveStaffSeatLogin({
      inviteHandle: 'synth-101-foh-manager',
      deliverySecret: secret,
      lookup: async () => null,
    });
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.mailSent).toBe(false);
    expect(denied.issuance).toBe('blocked');
  });
});
