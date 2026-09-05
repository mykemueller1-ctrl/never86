/**
 * CTAP house-code portal — community door, fail-closed. Email /onboard is the free seat.
 * Fail-closed. Hashes only. No live CTAP codes, PINs, or staff names in git.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { HOUSE_CODE_SEAT_DOOR } from './types';

export const HOUSE_CODE_PORTAL_STATUS = 'drafted' as const;
export const HOUSE_CODE_PORTAL_ENABLED_ENV = 'HOUSE_CODE_PORTAL_ENABLED';
export const HOUSE_CODE_HASH_ENV = 'HOUSE_CODE_HASH';
export const HOUSE_CODE_OPERATOR_ID_ENV = 'HOUSE_CODE_OPERATOR_ID';
export const HOUSE_CODE_PEPPER_ENV = 'HOUSE_CODE_PEPPER';

/** Public synthetic phrase for tests only. Not a live house code. */
export const SYNTHETIC_HOUSE_CODE = 'N86-SAMPLE-HOUSE';
export const SYNTHETIC_OPERATOR_ID = 1;

export type HouseCodeVerifyInput = {
  code: string;
  enabled?: boolean;
  expectedHash?: string;
  operatorId?: number;
  pepper?: string;
};

export type HouseCodeSession = {
  operatorId: number;
  seatDoor: typeof HOUSE_CODE_SEAT_DOOR;
  verified: true;
  liveIssuance: 'blocked' | 'enabled';
};

export type HouseCodeResult =
  | { ok: true; session: HouseCodeSession }
  | {
      ok: false;
      error: 'disabled' | 'code_required' | 'invalid' | 'operator_id_required';
      status: 403 | 503;
      hint: string;
    };

export function normalizeHouseCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '-');
}

export function hashHouseCode(code: string, pepper = ''): string {
  return createHash('sha256').update(`${pepper}:${normalizeHouseCode(code)}`).digest('hex');
}

export const SYNTHETIC_HOUSE_CODE_HASH = hashHouseCode(SYNTHETIC_HOUSE_CODE, 'test');

function hashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function houseCodePortalEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[HOUSE_CODE_PORTAL_ENABLED_ENV] === 'true';
}

export function verifyHouseCode(input: HouseCodeVerifyInput): HouseCodeResult {
  if (input.enabled !== true) {
    return {
      ok: false,
      error: 'disabled',
      status: 503,
      hint: 'House-code portal is drafted and fail-closed. Do not apply live hashes from git.',
    };
  }
  const code = input.code?.trim();
  if (!code) {
    return {
      ok: false,
      error: 'code_required',
      status: 403,
      hint: 'Enter the house code. Never paste a PIN, password, or staff name.',
    };
  }
  const expected = input.expectedHash?.trim();
  const operatorId = Number(input.operatorId);
  if (!expected) {
    return {
      ok: false,
      error: 'disabled',
      status: 503,
      hint: 'No HOUSE_CODE_HASH in the environment. Live issuance stays blocked.',
    };
  }
  if (!Number.isInteger(operatorId) || operatorId <= 0) {
    return {
      ok: false,
      error: 'operator_id_required',
      status: 503,
      hint: 'HOUSE_CODE_OPERATOR_ID must be a positive integer. Tenant key is operator_id.',
    };
  }
  const offered = hashHouseCode(code, input.pepper ?? '');
  if (!hashesEqual(offered, expected)) {
    return {
      ok: false,
      error: 'invalid',
      status: 403,
      hint: 'House code did not match. No seat opened. No private store data returned.',
    };
  }
  return {
    ok: true,
    session: {
      operatorId,
      seatDoor: HOUSE_CODE_SEAT_DOOR,
      verified: true,
      liveIssuance: 'blocked',
    },
  };
}

export function verifyHouseCodeFromEnv(
  code: string,
  env: NodeJS.ProcessEnv = process.env,
): HouseCodeResult {
  const operatorId = Number(env[HOUSE_CODE_OPERATOR_ID_ENV] ?? '');
  return verifyHouseCode({
    code,
    enabled: houseCodePortalEnabled(env),
    expectedHash: env[HOUSE_CODE_HASH_ENV],
    operatorId: Number.isInteger(operatorId) ? operatorId : undefined,
    pepper: env[HOUSE_CODE_PEPPER_ENV] ?? '',
  });
}
