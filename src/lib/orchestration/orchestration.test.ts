import { beforeEach, describe, expect, it } from 'vitest';
import {
  HOUSE_CODE_SEAT_DOOR,
  ORCHESTRATION_BRAND_BLUE,
  ORCHESTRATION_VERSION,
  SEAT_ALIASES,
  SYNTHETIC_HOUSE_CODE,
  SYNTHETIC_HOUSE_CODE_HASH,
  SYNTHETIC_OPERATOR_ID,
  appendLakeRecord,
  classifyIntent,
  deleteLakeRecord,
  getLakeRecord,
  getOrchestrationSeat,
  hashHouseCode,
  listInventory,
  listLakeRecords,
  listOrchestrationSeats,
  listSpecialistSeats,
  resetDataLakeForTests,
  routeIntent,
  specialistBriefPrompt,
  supersedeLakeRecord,
  verifyHouseCode,
} from './index';

describe('orchestration registry', () => {
  it('is one supervisor plus five specialists', () => {
    const seats = listOrchestrationSeats();
    expect(seats.map((seat) => seat.id)).toEqual([
      'supervisor',
      'labor',
      'vendor',
      'voids',
      'action-shift',
      'memory',
    ]);
    expect(listSpecialistSeats()).toHaveLength(5);
    expect(seats.every((seat) => seat.job.length > 0)).toBe(true);
    expect(seats.every((seat) => seat.never.includes('auto-mail'))).toBe(true);
    expect(ORCHESTRATION_BRAND_BLUE).toBe('#0066ff');
    expect(ORCHESTRATION_VERSION).toBe('4.0.0');
  });

  it('resolves old seats to the new five and kills design-qa', () => {
    expect(getOrchestrationSeat('memory-curator')?.id).toBe('memory');
    expect(getOrchestrationSeat('beverage')?.id).toBe('vendor');
    expect(getOrchestrationSeat('human-coach')?.id).toBe('action-shift');
    expect(getOrchestrationSeat('truth-qa')?.id).toBe('supervisor');
    expect(getOrchestrationSeat('design-qa')).toBeNull();
    expect(SEAT_ALIASES['design-qa']).toBeNull();
    expect(specialistBriefPrompt('labor')).toMatch(/ONE JOB/);
    expect(specialistBriefPrompt('design-qa')).toBeNull();
  });
});

describe('supervisor', () => {
  it('refuses to route without operator_id and house-code proof', () => {
    expect(routeIntent({ operatorId: 0, text: 'labor', houseCodeVerified: true }).ok).toBe(false);
    expect(routeIntent({ operatorId: 1, text: 'labor', houseCodeVerified: false }).ok).toBe(false);
  });

  it('routes one job and never computes dollars', () => {
    expect(classifyIntent('OT drift on the timesheet')).toBe('labor');
    expect(classifyIntent('void rate vs peer')).toBe('voids');
    expect(classifyIntent('Sysco invoice price drift')).toBe('vendor');
    expect(classifyIntent('yesterday close one action')).toBe('action-shift');
    expect(classifyIntent('remember vendor cadence')).toBe('memory');

    const routed = routeIntent({
      operatorId: SYNTHETIC_OPERATOR_ID,
      text: 'void hunter names above the band',
      houseCodeVerified: true,
    });
    expect(routed.ok).toBe(true);
    if (!routed.ok) return;
    expect(routed.specialistId).toBe('voids');
    expect(routed.computedDollars).toBe(false);
    expect(routed.portalLogin).toBe(false);
  });
});

describe('tenant data lake', () => {
  beforeEach(() => resetDataLakeForTests());

  it('requires operator_id and a source tag, and never deletes', () => {
    expect(
      appendLakeRecord({
        operatorId: 0,
        kind: 'memory',
        sourceTag: 'verified',
        source: 'owner',
        payload: { rule: 'nope' },
      }).ok,
    ).toBe(false);

    const written = appendLakeRecord({
      operatorId: 7,
      kind: 'memory',
      sourceTag: 'verified',
      source: 'owner verbal',
      payload: { rule: 'Sysco Tue/Thu' },
    });
    expect(written.ok).toBe(true);
    if (!written.ok) return;
    expect(listLakeRecords(99)).toHaveLength(0);
    expect(listLakeRecords(7)).toHaveLength(1);
    expect(getLakeRecord(written.record.id, 99)).toBeNull();
    expect(deleteLakeRecord()).toEqual({ ok: false, error: 'delete_forbidden' });
  });

  it('supersedes forever without dropping the prior atom', () => {
    const first = appendLakeRecord({
      operatorId: 7,
      kind: 'memory',
      sourceTag: 'unverified',
      source: 'model guess blocked → owner correction',
      payload: { rule: 'Order Mon' },
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const next = supersedeLakeRecord(first.record.id, 7, {
      kind: 'memory',
      sourceTag: 'verified',
      source: 'owner correction',
      payload: { rule: 'Order Sun night' },
    });
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.previous.supersededBy).toBe(next.next.id);
    expect(listLakeRecords(7)).toHaveLength(2);
  });
});

describe('house-code portal', () => {
  it('fails closed unless enabled, then opens only the matching operator_id', () => {
    expect(HOUSE_CODE_SEAT_DOOR).toBe('/portal');
    expect(verifyHouseCode({ code: SYNTHETIC_HOUSE_CODE }).ok).toBe(false);

    const opened = verifyHouseCode({
      code: SYNTHETIC_HOUSE_CODE,
      enabled: true,
      expectedHash: SYNTHETIC_HOUSE_CODE_HASH,
      operatorId: SYNTHETIC_OPERATOR_ID,
      pepper: 'test',
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.session.operatorId).toBe(1);
    expect(opened.session.liveIssuance).toBe('blocked');

    const rejected = verifyHouseCode({
      code: 'WRONG-CODE',
      enabled: true,
      expectedHash: SYNTHETIC_HOUSE_CODE_HASH,
      operatorId: SYNTHETIC_OPERATOR_ID,
      pepper: 'test',
    });
    expect(rejected.ok).toBe(false);
    expect(hashHouseCode(SYNTHETIC_HOUSE_CODE, 'test')).toBe(SYNTHETIC_HOUSE_CODE_HASH);
  });
});

describe('inventory', () => {
  it('names keep/kill/replace for the overlapping stacks', () => {
    const rows = listInventory();
    expect(rows.length).toBeGreaterThan(10);
    expect(listInventory('keep').some((row) => row.id === 'supervisor')).toBe(true);
    expect(listInventory('kill').some((row) => row.id === 'design-qa')).toBe(true);
    expect(listInventory('freeze').some((row) => row.id === 'grok-bot-restaurant-scout')).toBe(true);
    expect(rows.every((row) => !/karlee|sturtz|pin\s*\d/i.test(JSON.stringify(row)))).toBe(true);
  });
});
