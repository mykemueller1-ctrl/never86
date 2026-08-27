import { describe, expect, it } from 'vitest';
import { ACTION_SHIFT_ROLE_PACKS, buildActionShiftSetupPlan } from './actionShiftSetup';
import {
  MANAGER_STATION_KEYS,
  applyManagerStepProof,
  buildManagerRoleTemplates,
  buildSyntheticManagerBoard,
  fixtureContainsPrivatePayload,
  sameTenant,
} from './actionShiftManagerBoard';

const now = '2026-08-26T16:00:00.000-05:00';

describe('Action Shift manager operating board', () => {
  it('builds role templates for manager, opener, closer, kitchen-prep, FOH, and driver from existing packs', () => {
    const templates = buildManagerRoleTemplates();
    const stations = new Set(templates.map((template) => template.stationKey));
    expect([...stations].sort()).toEqual([...MANAGER_STATION_KEYS].sort());
    expect(templates.every((template) => template.steps.length > 0)).toBe(true);

    const opener = templates.find((template) => template.id === 'tmpl-opener-manager-open');
    const closer = templates.find((template) => template.id === 'tmpl-closer-manager-close');
    const prep = templates.find((template) => template.id === 'tmpl-kitchen_prep-prep_cook-open');
    const foh = templates.find((template) => template.stationKey === 'foh' && template.roleKey === 'server');
    const driver = templates.find((template) => template.stationKey === 'driver');

    expect(opener?.phase).toBe('open');
    expect(opener?.steps[0]?.instruction).toBe(ACTION_SHIFT_ROLE_PACKS.manager[0]);
    expect(closer?.phase).toBe('close');
    expect(closer?.steps[0]?.instruction).toBe(ACTION_SHIFT_ROLE_PACKS.manager[2]);
    expect(prep?.roleKey).toBe('prep_cook');
    expect(foh?.roleKey).toBe('server');
    expect(driver?.roleKey).toBe('driver');
    expect(templates.some((template) => template.roleKey === 'host')).toBe(true);
    expect(templates.some((template) => template.roleKey === 'bartender')).toBe(true);
  });

  it('shows manager-owned synthetic runs with proof, exception, and escalation states', () => {
    const board = buildSyntheticManagerBoard(now);
    expect(board.staffLogins).toBe('manager-seat-only');
    expect(board.persistence).toBe('local-only');
    expect(board.tenant).toEqual({
      operatorId: 0,
      locationId: 0,
      locationLabel: 'Synthetic lab location',
      tenantKind: 'fixture',
      boundary: 'Operator 0 / location 0 only. A guessed ID from another tenant cannot own, prove, or escalate these runs.',
    });
    expect(board.runs.every((run) => run.ownerSeatId === 'seat-manager')).toBe(true);
    expect(board.runs.map((run) => [run.stationKey, run.status])).toEqual([
      ['manager', 'verified'],
      ['opener', 'submitted'],
      ['kitchen_prep', 'exception'],
      ['foh', 'assigned'],
      ['driver', 'escalated'],
      ['closer', 'assigned'],
    ]);
    expect(board.exceptions.some((item) => item.reason === 'data_missing' && item.stationKey === 'kitchen_prep')).toBe(true);
    expect(board.exceptions.some((item) => item.reason === 'overdue_unverified' && item.stationKey === 'driver')).toBe(true);
    expect(board.summary.awaitingProof).toBe(1);
    expect(board.summary.exceptions).toBeGreaterThan(0);
    expect(board.summary.escalations).toBeGreaterThan(0);
    expect(board.evidenceContracts.map((item) => item.family)).toEqual(['pdq', 'vendor', 'prime-cost']);
  });

  it('never invents live employee identities, PINs, or private dollars', () => {
    const board = buildSyntheticManagerBoard(now);
    expect(fixtureContainsPrivatePayload(board)).toBe(false);
    expect(board.seats.map((seat) => seat.label)).toEqual([
      'Manager seat',
      'Opener station',
      'Closer station',
      'Kitchen prep station',
      'FOH station',
      'Driver station',
    ]);
  });

  it('will not verify a checklist step from a verbal yes', () => {
    const board = buildSyntheticManagerBoard(now);
    const run = board.runs.find((item) => item.id === 'run-foh')!;
    expect(applyManagerStepProof({
      board,
      runId: run.id,
      stepId: run.steps[0].id,
      actor: { seatId: 'seat-manager', operatorId: 0, locationId: 0, kind: 'manager' },
      outcome: 'verified',
      proofKind: 'verbal',
    })).toEqual({
      ok: false,
      error: 'A verbal yes does not close the checklist. Attach the proof object from the shift.',
    });
  });

  it('verifies with an accepted proof object and refuses a cross-tenant actor', () => {
    const board = buildSyntheticManagerBoard(now);
    const run = board.runs.find((item) => item.id === 'run-foh')!;
    const verified = applyManagerStepProof({
      board,
      runId: run.id,
      stepId: run.steps[0].id,
      actor: { seatId: 'seat-manager', operatorId: 0, locationId: 0, kind: 'manager' },
      outcome: 'verified',
      proofKind: 'exception-log',
      proofNote: 'Synthetic guest-recovery handoff note.',
      now,
    });
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    expect(verified.board.runs.find((item) => item.id === 'run-foh')?.steps[0].status).toBe('verified');

    expect(applyManagerStepProof({
      board,
      runId: run.id,
      stepId: run.steps[0].id,
      actor: { seatId: 'seat-manager', operatorId: 99, locationId: 0, kind: 'manager' },
      outcome: 'verified',
      proofKind: 'exception-log',
    })).toEqual({
      ok: false,
      error: 'Tenant boundary: that seat cannot change another operator location\'s checklist.',
    });
    expect(sameTenant({ operatorId: 0, locationId: 0 }, { operatorId: 1, locationId: 0 })).toBe(false);
  });

  it('escalates missing proof to the manager seat without creating staff-wide credentials', () => {
    const board = buildSyntheticManagerBoard(now);
    const run = board.runs.find((item) => item.id === 'run-closer')!;
    const result = applyManagerStepProof({
      board,
      runId: run.id,
      stepId: run.steps[0].id,
      actor: { seatId: 'seat-manager', operatorId: 0, locationId: 0, kind: 'manager' },
      outcome: 'escalated',
      now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const step = result.board.runs.find((item) => item.id === 'run-closer')?.steps[0];
    expect(step?.status).toBe('escalated');
    expect(step?.ownerSeatId).toBe('seat-manager');
    expect(result.board.staffLogins).toBe('manager-seat-only');
  });
});

describe('Action Shift setup role aliases for manager stations', () => {
  it('maps opener, closer, kitchen-prep, and FOH labels onto existing role packs', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: [
        'external_worker_id,display_name,role_key,status',
        'w1,Example Opener,opener,active',
        'w2,Example Closer,closer,active',
        'w3,Example Prep,kitchen-prep,active',
        'w4,Example FOH,FOH,active',
      ].join('\n'),
      scheduleCsv: [
        'external_shift_id,external_worker_id,business_date,starts_at,ends_at',
        's1,w1,2026-08-26,2026-08-26T08:00:00-05:00,2026-08-26T16:00:00-05:00',
        's2,w2,2026-08-26,2026-08-26T16:00:00-05:00,2026-08-26T23:00:00-05:00',
        's3,w3,2026-08-26,2026-08-26T07:00:00-05:00,2026-08-26T15:00:00-05:00',
        's4,w4,2026-08-26,2026-08-26T10:00:00-05:00,2026-08-26T18:00:00-05:00',
      ].join('\n'),
      providerKey: 'time-clock',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.seats.map((seat) => seat.roleKey)).toEqual([
      'manager',
      'manager',
      'prep_cook',
      'server',
    ]);
    expect(result.plan.seats[0].checklistItems).toBe(ACTION_SHIFT_ROLE_PACKS.manager);
    expect(result.plan.seats[2].checklistItems).toBe(ACTION_SHIFT_ROLE_PACKS.prep_cook);
    expect(result.plan.seats[3].checklistItems).toBe(ACTION_SHIFT_ROLE_PACKS.server);
  });
});
