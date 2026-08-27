import { describe, expect, it } from 'vitest';
import { ACTION_SHIFT_ROLE_PACKS, buildActionShiftSetupPlan } from './actionShiftSetup';
import { ACTION_SHIFT_WEEKLY_TEMPLATE } from './actionShiftWeeklySheet';

const roster = [
  'external_worker_id,display_name,role_key,status',
  'worker-bar,Example Bar,bartender,active',
  'worker-foh,Example Server,server,active',
].join('\n');

describe('Weekly department schedule sheet', () => {
  it('maps BAR SIDE / WAITRESS / Open / Close onto existing role packs without using name as the identity key', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: roster,
      scheduleCsv: ACTION_SHIFT_WEEKLY_TEMPLATE,
      providerKey: 'bar-crew',
      generatedAt: '2026-08-26T12:00:00.000Z',
      storeOpen: '11:00 AM',
      storeClose: '11:00 PM',
      timezoneOffset: '-05:00',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.issues).toEqual([]);
    expect(result.plan.shifts.map((shift) => ({
      id: shift.externalWorkerId,
      role: shift.roleKey,
      date: shift.businessDate,
      start: shift.startsAt,
      end: shift.endsAt,
    }))).toEqual([
      {
        id: 'worker-bar',
        role: 'bartender',
        date: '2026-08-26',
        start: '2026-08-26T11:00:00-05:00',
        end: '2026-08-26T16:00:00-05:00',
      },
      {
        id: 'worker-bar',
        role: 'bartender',
        date: '2026-08-27',
        start: '2026-08-27T16:00:00-05:00',
        end: '2026-08-27T23:00:00-05:00',
      },
      {
        id: 'worker-foh',
        role: 'server',
        date: '2026-08-26',
        start: '2026-08-26T11:00:00-05:00',
        end: '2026-08-26T17:00:00-05:00',
      },
    ]);
    expect(result.plan.shifts[0].checklistItems).toBe(ACTION_SHIFT_ROLE_PACKS.bartender);
    expect(result.plan.shifts.some((shift) => shift.businessDate === '2026-08-27' && shift.externalWorkerId === 'worker-foh')).toBe(false);
  });

  it('refuses Open/Close tokens until store hours are supplied', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: roster,
      scheduleCsv: ACTION_SHIFT_WEEKLY_TEMPLATE,
      providerKey: 'bar-crew',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.issues.some((issue) => issue.reason === 'unresolved_open_close')).toBe(true);
  });

  it('does not match a weekly row by display name when the roster ID is missing', () => {
    const result = buildActionShiftSetupPlan({
      rosterCsv: 'external_worker_id,display_name,role_key,status\nworker-other,Someone Else,server,active',
      scheduleCsv: ACTION_SHIFT_WEEKLY_TEMPLATE,
      providerKey: 'bar-crew',
      storeOpen: '11:00 AM',
      storeClose: '11:00 PM',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.shifts).toHaveLength(0);
    expect(result.plan.issues.every((issue) => issue.reason === 'worker_not_found')).toBe(true);
  });
});
