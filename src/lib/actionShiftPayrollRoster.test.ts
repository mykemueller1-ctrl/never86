import { describe, expect, it } from 'vitest';
import {
  ACTION_SHIFT_PAYROLL_TEMPLATE,
  isPayrollCensus,
  normalizePayrollRosterCsv,
} from './actionShiftPayrollRoster';
import { ACTION_SHIFT_ROLE_PACKS, buildActionShiftSetupPlan } from './actionShiftSetup';

const weekly = [
  'employee,date,start time,end time,station,date,start time,end time,station',
  'Example Manager,8/26/2026,Open,4:00 PM,BAR SIDE,8/27/2026,4:00 PM,CLOSE,BAR SIDE',
  'Example Cook,8/26/2026,11:00 AM,OPEN,FRY LINE,8/27/2026,RO,,,',
].join('\n');

describe('Payroll census → Action Shift roster', () => {
  it('maps ADP File Number + split names and drops SSN/wage columns', () => {
    const result = normalizePayrollRosterCsv(ACTION_SHIFT_PAYROLL_TEMPLATE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toBe('payroll');
    expect(result.droppedHeaders).toEqual(['SSN', 'Pay Rate']);
    expect(result.csv).toBe([
      'external_worker_id,display_name,role_key,status',
      '1001,Example Manager,Manager,active',
      '1002,Example Cook,Line Cook,active',
      '1003,Example Former,Server,inactive',
    ].join('\n'));
    expect(result.csv).not.toMatch(/000-00-0000|Pay Rate|SSN/i);
  });

  it('maps Gusto employee id + first/last + employment status', () => {
    const result = normalizePayrollRosterCsv([
      'Employee ID,First name,Last name,Job title,Employment status',
      'ee-9,Example,Host,Host,employed',
    ].join('\n'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.csv).toBe('external_worker_id,display_name,role_key,status\nee-9,Example Host,Host,active');
  });

  it('maps a QuickBooks employee + employee ID census', () => {
    const result = normalizePayrollRosterCsv([
      'Employee,Employee ID,Title,Status',
      'Example Driver,qb-4,Driver,Active',
    ].join('\n'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.csv).toBe('external_worker_id,display_name,role_key,status\nqb-4,Example Driver,Driver,active');
  });

  it('passes through an already-normalized roster and does not treat it as a census', () => {
    const roster = 'external_worker_id,display_name,role_key,status\nworker-001,Example Manager,manager,active';
    expect(isPayrollCensus(['external_worker_id', 'display_name', 'role_key', 'status'])).toBe(false);
    expect(normalizePayrollRosterCsv(roster)).toEqual({
      ok: true,
      csv: roster,
      source: 'roster',
      droppedHeaders: [],
      rowCount: 1,
    });
  });

  it('refuses a name-only sheet', () => {
    const result = normalizePayrollRosterCsv('employee,station\nExample,BAR SIDE');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Names alone are not an identity key');
  });

  it('joins a weekly sheet to payroll IDs after First Last display names exist', () => {
    const payroll = normalizePayrollRosterCsv([
      'File Number,First Name,Last Name,Job Title,Status,SSN,Pay Rate',
      '1001,Example,Manager,Manager,Active,000-00-0000,0',
      '1002,Example,Cook,Line Cook,Active,000-00-0000,0',
    ].join('\n'));
    expect(payroll.ok).toBe(true);
    if (!payroll.ok) return;
    const result = buildActionShiftSetupPlan({
      rosterCsv: payroll.csv,
      scheduleCsv: weekly,
      providerKey: 'payroll',
      generatedAt: '2026-08-26T12:00:00.000Z',
      storeOpen: '11:00 AM',
      storeClose: '11:00 PM',
      storeFirstCut: '2:00 PM',
      timezoneOffset: '-05:00',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.issues).toEqual([]);
    expect(result.plan.shifts.map((shift) => ({
      id: shift.externalWorkerId,
      role: shift.roleKey,
      start: shift.startsAt,
      end: shift.endsAt,
    }))).toEqual([
      {
        id: '1001',
        role: 'bartender',
        start: '2026-08-26T11:00:00-05:00',
        end: '2026-08-26T16:00:00-05:00',
      },
      {
        id: '1001',
        role: 'bartender',
        start: '2026-08-27T16:00:00-05:00',
        end: '2026-08-27T23:00:00-05:00',
      },
      {
        id: '1002',
        role: 'line_cook',
        start: '2026-08-26T11:00:00-05:00',
        end: '2026-08-26T14:00:00-05:00',
      },
    ]);
    expect(result.plan.shifts[0].checklistItems).toBe(ACTION_SHIFT_ROLE_PACKS.bartender);
  });
});
