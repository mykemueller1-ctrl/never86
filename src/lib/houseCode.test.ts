import { describe, expect, it } from 'vitest';
import {
  HOUSE_CODE_BRAND_BLUE,
  HOUSE_CODE_SEAT_DOOR,
  SYNTHETIC_HOUSE_CODE,
  SYNTHETIC_HOUSE_CODE_HASH,
  SYNTHETIC_OPERATOR_ID,
  hashHouseCode,
  verifyHouseCode,
  verifyHouseCodeFromEnv,
} from './houseCode';

describe('house-code door', () => {
  it('fails closed with 401 until a hash is issued', () => {
    const result = verifyHouseCode({ code: SYNTHETIC_HOUSE_CODE });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(401);
    expect(result.error).toBe('not_issued');
    expect(result.hint).not.toMatch(/karlee|sturtz|pin/i);
  });

  it('returns 401 without a valid code even when a hash exists', () => {
    const missing = verifyHouseCode({
      code: '',
      expectedHash: SYNTHETIC_HOUSE_CODE_HASH,
      operatorId: SYNTHETIC_OPERATOR_ID,
      pepper: 'test',
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.status).toBe(401);

    const wrong = verifyHouseCode({
      code: 'WRONG-CODE',
      expectedHash: SYNTHETIC_HOUSE_CODE_HASH,
      operatorId: SYNTHETIC_OPERATOR_ID,
      pepper: 'test',
    });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) {
      expect(wrong.status).toBe(401);
      expect(wrong.error).toBe('invalid');
    }
  });

  it('opens only the matching operator_id for the synthetic test hash', () => {
    const result = verifyHouseCode({
      code: SYNTHETIC_HOUSE_CODE,
      expectedHash: SYNTHETIC_HOUSE_CODE_HASH,
      operatorId: SYNTHETIC_OPERATOR_ID,
      pepper: 'test',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session.operatorId).toBe(1);
    expect(result.session.seatDoor).toBe(HOUSE_CODE_SEAT_DOOR);
    expect(result.session.liveIssuance).toBe('blocked');
    expect(HOUSE_CODE_BRAND_BLUE).toBe('#0066ff');
    expect(hashHouseCode(SYNTHETIC_HOUSE_CODE, 'test')).toBe(SYNTHETIC_HOUSE_CODE_HASH);
  });

  it('reads env hashes and stays fail-closed in an empty env', () => {
    const closed = verifyHouseCodeFromEnv(SYNTHETIC_HOUSE_CODE, {} as NodeJS.ProcessEnv);
    expect(closed.ok).toBe(false);
    if (!closed.ok) expect(closed.status).toBe(401);
  });
});
