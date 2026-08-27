import { describe, expect, it } from 'vitest';
import {
  ACTION_SHIFT_ROLE_PACKS,
  buildActionShiftSetupPlan,
} from './actionShiftSetup';
import { findCtapLabPackPrivacyHits } from './ctapLabPack';

const roster = [
  'external_worker_id,display_name,role_key,status',
  'mgr-1,Example Manager,manager,active',
    'cook-1,Example Cook,line_cook,active',
].join('\n');

const schedule = [
  'external_shift_id,external_worker_id,business_date,starts_at,ends_at',
  'shift-1,mgr-1,2026-08-26,2026-08-26T08:00:00-05:00,2026-08-26T16:00:00-05:00',
  'shift-2,cook-1,2026-08-26,2026-08-26T10:00:00-05:00,2026-08-26T18:00:00-05:00',
].join('\n');

describe('Action Shift setup plan', () => {
  it('maps schedule rows to active seats and role-specific checklist packs', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: roster,
      scheduleCsv: schedule,
      providerKey: 'Time Clock',
      generatedAt: '2026-08-26T01:00:00.000Z',
    });

    expect(result).toEqual({
      ok: true,
      plan: {
        providerKey: 'time_clock',
        generatedAt: '2026-08-26T01:00:00.000Z',
        seats: [
          {
            externalWorkerId: 'mgr-1',
            displayName: 'Example Manager',
            roleKey: 'manager',
            checklistItems: ACTION_SHIFT_ROLE_PACKS.manager,
          },
          {
            externalWorkerId: 'cook-1',
            displayName: 'Example Cook',
            roleKey: 'line_cook',
            checklistItems: ACTION_SHIFT_ROLE_PACKS.line_cook,
          },
        ],
        shifts: [
          expect.objectContaining({ externalShiftId: 'shift-1', externalWorkerId: 'mgr-1', roleKey: 'manager' }),
          expect.objectContaining({ externalShiftId: 'shift-2', externalWorkerId: 'cook-1', roleKey: 'line_cook' }),
        ],
        issues: [],
      },
    });
  });

  it('never falls back to display-name matching', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: roster,
      scheduleCsv: schedule.replace('shift-1,mgr-1', 'shift-1,Example Manager'),
      providerKey: 'provider',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.shifts.map((shift) => shift.externalShiftId)).not.toContain('shift-1');
    expect(result.plan.issues).toContainEqual({
      source: 'schedule',
      row: 2,
      externalId: 'shift-1',
      reason: 'worker_not_found',
    });
  });

  it('quarantines inactive, unsupported, duplicate, and invalid rows', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: [
        'worker_id,name,role,status',
        'dup,One,server,active',
        'dup,Two,manager,active',
        'bad-role,Three,wizard,active',
        'inactive,Four,host,inactive',
      ].join('\n'),
      scheduleCsv: [
        'shift_id,worker_id,date,start,end',
        'bad-date,dup,2026-02-31,2026-02-28T08:00:00Z,2026-02-28T09:00:00Z',
        'bad-time,dup,2026-02-28,2026-02-28T09:00:00Z,2026-02-28T08:00:00Z',
        'missing-worker,nope,2026-02-28,2026-02-28T08:00:00Z,2026-02-28T09:00:00Z',
        'missing-worker,dup,2026-02-28,2026-02-28T08:00:00Z,2026-02-28T09:00:00Z',
      ].join('\n'),
      providerKey: 'provider',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.shifts).toHaveLength(0);
    expect(result.plan.issues.map((issue) => issue.reason)).toEqual([
      'duplicate_external_worker_id',
      'unsupported_role',
      'inactive_worker',
      'invalid_business_date',
      'invalid_time_window',
      'worker_not_found',
      'duplicate_external_shift_id',
    ]);
  });

  it('requires the full import contract', () => {
    expect(buildActionShiftSetupPlan({
      rosterCsv: 'name,role\nExample,manager',
      scheduleCsv: schedule,
      providerKey: 'provider',
    })).toEqual({
      ok: false,
      error: 'Roster needs external_worker_id, display_name, role_key, and status columns.',
    });
  });

  it('rejects malformed CSV structure before parsing employee values', () => {
    expect(buildActionShiftSetupPlan({
      rosterCsv: 'external_worker_id,display_name,role_key,status\n1,"Unclosed,manager,active',
      scheduleCsv: schedule,
      providerKey: 'provider',
    })).toEqual({ ok: false, error: 'Roster CSV contains an unclosed quoted field.' });

    expect(buildActionShiftSetupPlan({
      rosterCsv: 'external_worker_id,display_name,role_key,status\n1,Name,manager',
      scheduleCsv: schedule,
      providerKey: 'provider',
    })).toEqual({ ok: false, error: 'Roster CSV has a row with the wrong number of columns.' });
  });

  it('normalizes common restaurant role labels deterministically', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: 'external_worker_id,display_name,role_key,status\n1,Example,Kitchen Lead,active',
      scheduleCsv: 'external_shift_id,external_worker_id,business_date,starts_at,ends_at\n1,1,2026-08-26,2026-08-26T08:00:00Z,2026-08-26T09:00:00Z',
      providerKey: 'provider',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.seats[0].roleKey).toBe('kitchen_manager');
  });

  it('maps FOH Manager labels onto the existing manager role', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: 'external_worker_id,display_name,role_key,status\n1,Example,FOH Manager,active',
      scheduleCsv: 'external_shift_id,external_worker_id,business_date,starts_at,ends_at\n1,1,2026-08-24,2026-08-24T08:00:00Z,2026-08-24T09:00:00Z',
      providerKey: 'provider',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.seats[0].roleKey).toBe('manager');
  });

  it('attaches CTap lab templates to shifts without using live payroll names', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: [
        'external_worker_id,display_name,role_key,status',
        'bar-1,Bar Station,bartender,active',
        'drv-1,Driver Station,driver,active',
      ].join('\n'),
      scheduleCsv: [
        'external_shift_id,external_worker_id,business_date,starts_at,ends_at',
        'shift-bar,bar-1,2026-08-24,2026-08-24T08:00:00-05:00,2026-08-24T16:00:00-05:00',
        'shift-drv,drv-1,2026-08-24,2026-08-24T16:00:00-05:00,2026-08-24T22:00:00-05:00',
      ].join('\n'),
      providerKey: 'provider',
      templatePack: 'ctap-lab',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bar = result.plan.shifts.find((shift) => shift.externalShiftId === 'shift-bar');
    const driver = result.plan.shifts.find((shift) => shift.externalShiftId === 'shift-drv');
    expect(bar?.checklistItems).toContain('Stock walk in');
    expect(bar?.checklistItems.join('\n')).not.toMatch(/Beer comes today/);
    expect(driver?.checklistItems.some((item) => /between runs/i.test(item))).toBe(true);
    expect(findCtapLabPackPrivacyHits(result.plan)).toEqual([]);
  });
});
