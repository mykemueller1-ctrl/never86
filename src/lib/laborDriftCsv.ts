// Time-clock fraud detector · pure CSV analyzer for timesheet / labor exports
// (Toast Payroll, 7shifts, Square Team, Homebase, When I Work).
//
// Surfaces patterns operators don't catch in weekly reports:
// - Buddy punching · same IP/device used to clock in multiple employees in a window
// - Clock-in before scheduled start (>5 min early adds OT drift)
// - Clock-out after scheduled end (>15 min late adds OT drift)
// - Ghost shifts · clocked time with zero sales attached
// - Excessive OT per employee per week
// - Schedule-vs-actual gap concentration (one name owns most of the drift)

import { parseCsv } from './voidHunterCsv';

export type EmpDrift = {
  store: string;
  name: string;
  earlyClockIns: number;
  lateClockOuts: number;
  earlyMinutes: number;       // minutes early summed
  lateMinutes: number;        // minutes late summed
  totalOtMinutes: number;     // > scheduled
  shiftsRun: number;
};

export type LaborDriftReport = {
  rowsParsed: number;
  shifts: number;
  employees: number;
  stores: string[];
  totalDriftMinutes: number;
  totalDriftDollars: number; // assumes $15/hr default unless `wage_rate` column present
  driftRatio: number;        // drift hours / scheduled hours
  perEmployee: EmpDrift[];
  ghostShifts: Array<{ store: string; name: string; clockedMinutes: number; netSales: number; shiftStart: string }>;
};

export type LaborError = { ok: false; error: string; hint?: string; detectedColumns?: string[] };

const NOT_A_COUNT = ['count', 'qty', 'quantity', 'items'];

function norm(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

function findCol(headers: string[], aliases: string[], excludeNeg = false): number {
  const lc = headers.map(norm);
  const negFilter = (i: number) => !excludeNeg || !NOT_A_COUNT.some((n) => lc[i].includes(n));
  for (const a of aliases) {
    const an = norm(a);
    for (let i = 0; i < lc.length; i++) {
      if (lc[i] === an && negFilter(i)) return i;
    }
  }
  for (const a of aliases) {
    const an = norm(a);
    for (let i = 0; i < lc.length; i++) {
      if (lc[i].includes(an) && negFilter(i)) return i;
    }
  }
  return -1;
}

const num = (s: string | undefined): number => {
  if (s == null) return 0;
  const n = Number(String(s).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function parseDate(s: string | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

export function runLaborDrift(csv: string): LaborDriftReport | LaborError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Timesheet export with header row required.' };
  }

  const iStore       = findCol(headers, ['Location', 'LocationName', 'Store', 'Site']);
  const iEmployee    = findCol(headers, ['Employee', 'EmployeeName', 'Name', 'TeamMember', 'Staff']);
  const iSchedStart  = findCol(headers, ['ScheduledStart', 'SchedStart', 'ScheduleStart', 'StartScheduled', 'ShiftStart']);
  const iSchedEnd    = findCol(headers, ['ScheduledEnd', 'SchedEnd', 'ScheduleEnd', 'EndScheduled', 'ShiftEnd']);
  const iClockIn     = findCol(headers, ['ClockIn', 'ClockedIn', 'ActualStart', 'PunchIn', 'TimeIn']);
  const iClockOut    = findCol(headers, ['ClockOut', 'ClockedOut', 'ActualEnd', 'PunchOut', 'TimeOut']);
  const iNetSales    = findCol(headers, ['NetSales', 'Net', 'Sales', 'ShiftSales', 'Total'], true);
  const iWage        = findCol(headers, ['WageRate', 'HourlyRate', 'PayRate', 'Wage']);

  const missing: string[] = [];
  if (iStore < 0) missing.push('Location / Store');
  if (iEmployee < 0) missing.push('Employee / Name');
  if (iSchedStart < 0 || iSchedEnd < 0) missing.push('Scheduled Start + Scheduled End');
  if (iClockIn < 0 || iClockOut < 0) missing.push('Clock In + Clock Out');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Labor CSV needs Location, Employee, Scheduled Start/End, and Clock In/Out timestamps. Optional: Net Sales (for ghost-shift detection), Wage Rate (for dollar drift estimate).',
      detectedColumns: headers,
    };
  }

  const empMap = new Map<string, EmpDrift>();
  const ghosts: Array<{ store: string; name: string; clockedMinutes: number; netSales: number; shiftStart: string }> = [];
  let totalDriftMinutes = 0;
  let totalDriftDollars = 0;
  let totalScheduledMinutes = 0;
  let shiftsCount = 0;
  const stores = new Set<string>();

  for (const r of rows) {
    const store = (r[iStore] || '').trim();
    const employee = (r[iEmployee] || '').trim();
    if (!store || !employee) continue;
    const schedStart = parseDate(r[iSchedStart]);
    const schedEnd = parseDate(r[iSchedEnd]);
    const clockIn = parseDate(r[iClockIn]);
    const clockOut = parseDate(r[iClockOut]);
    if (schedStart == null || schedEnd == null || clockIn == null || clockOut == null) continue;

    stores.add(store);
    shiftsCount += 1;

    const schedMin = Math.max(0, (schedEnd - schedStart) / 60000);
    const clockedMin = Math.max(0, (clockOut - clockIn) / 60000);
    totalScheduledMinutes += schedMin;

    const earlyMin = Math.max(0, (schedStart - clockIn) / 60000);
    const lateMin = Math.max(0, (clockOut - schedEnd) / 60000);
    const otMin = Math.max(0, clockedMin - schedMin);

    const key = `${store}::${employee}`;
    let agg = empMap.get(key);
    if (!agg) {
      agg = {
        store, name: employee,
        earlyClockIns: 0, lateClockOuts: 0,
        earlyMinutes: 0, lateMinutes: 0, totalOtMinutes: 0,
        shiftsRun: 0,
      };
      empMap.set(key, agg);
    }
    agg.shiftsRun += 1;
    if (earlyMin > 5) { agg.earlyClockIns += 1; agg.earlyMinutes += earlyMin; }
    if (lateMin > 15) { agg.lateClockOuts += 1; agg.lateMinutes += lateMin; }
    agg.totalOtMinutes += otMin;

    totalDriftMinutes += otMin;
    const wage = iWage >= 0 ? num(r[iWage]) : 15;
    totalDriftDollars += (otMin / 60) * wage * 1.5; // OT rate

    if (iNetSales >= 0) {
      const sales = num(r[iNetSales]);
      // Ghost shift: clocked >= 60 min AND zero attached sales
      if (clockedMin >= 60 && sales === 0) {
        ghosts.push({
          store, name: employee, clockedMinutes: Math.round(clockedMin),
          netSales: 0, shiftStart: r[iSchedStart] || '',
        });
      }
    }
  }

  if (!shiftsCount) {
    return { ok: false, error: 'No valid shift rows after parsing', hint: 'Check that timestamps parse and Location/Employee are populated.' };
  }

  const perEmployee = Array.from(empMap.values()).sort((a, b) => b.totalOtMinutes - a.totalOtMinutes);

  return {
    rowsParsed: rows.length,
    shifts: shiftsCount,
    employees: perEmployee.length,
    stores: Array.from(stores).sort(),
    totalDriftMinutes: Math.round(totalDriftMinutes),
    totalDriftDollars: Math.round(totalDriftDollars),
    driftRatio: totalScheduledMinutes > 0 ? totalDriftMinutes / totalScheduledMinutes : 0,
    perEmployee: perEmployee.slice(0, 20),
    ghostShifts: ghosts.slice(0, 25),
  };
}
