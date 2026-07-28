// Tip Variance · per-employee week-over-week tip movement on a tip
// summary CSV (Toast Payouts, Square Team tips, Lightspeed shifts).
//
// Surfaces the names whose tip-per-hour or tip-rate has dropped
// significantly week-over-week — the leading indicator the P&L misses
// by two weeks because tips drop before sales do.

import { parseCsv } from './voidHunterCsv';

export type TipDrift = {
  store: string;
  name: string;
  prevTipRate: number;     // 0..1 — tips / net sales last week
  currTipRate: number;
  deltaPp: number;         // current - previous, in percentage points
  prevTipDollars: number;
  currTipDollars: number;
  flagged: boolean;
};

export type TipReport = {
  rowsParsed: number;
  weeks: string[];                   // sorted ISO weeks present in the data
  employees: number;
  networkPrevTips: number;
  networkCurrTips: number;
  networkWoW: number;                // % change
  perEmployee: TipDrift[];
};

export type TipError = { ok: false; error: string; hint?: string; detectedColumns?: string[] };

function norm(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

function findCol(headers: string[], aliases: string[]): number {
  const lc = headers.map(norm);
  for (const a of aliases) {
    const an = norm(a);
    for (let i = 0; i < lc.length; i++) {
      if (lc[i] === an) return i;
    }
  }
  for (const a of aliases) {
    const an = norm(a);
    for (let i = 0; i < lc.length; i++) {
      if (lc[i].includes(an)) return i;
    }
  }
  return -1;
}

const num = (s: string | undefined): number => {
  if (s == null) return 0;
  const n = Number(String(s).replace(/[$,\s%]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - start.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function runTipVariance(csv: string): TipReport | TipError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Tip summary export with header row required.' };
  }

  const iStore    = findCol(headers, ['Location', 'LocationName', 'Store', 'Site']);
  const iEmployee = findCol(headers, ['Employee', 'EmployeeName', 'Name', 'TeamMember', 'Server', 'Staff']);
  const iWeek     = findCol(headers, ['Week', 'WeekStart', 'WeekEnding', 'Period']);
  const iDate     = findCol(headers, ['Date', 'BusinessDate', 'ShiftDate']);
  const iTips     = findCol(headers, ['NetTips', 'Tips', 'TipsCollected', 'TotalTips', 'TipAmount']);
  const iNet      = findCol(headers, ['NetSales', 'Net', 'Sales']);

  const missing: string[] = [];
  if (iStore < 0) missing.push('Location / Store');
  if (iEmployee < 0) missing.push('Employee / Server');
  if (iTips < 0) missing.push('Net Tips / Tip Amount');
  if (iNet < 0) missing.push('Net Sales');
  if (iWeek < 0 && iDate < 0) missing.push('Week or Date');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Tip Variance CSV needs Location, Employee, Net Tips, Net Sales, and either a Week column or a Date column we can bucket into weeks.',
      detectedColumns: headers,
    };
  }

  type Slice = { tips: number; net: number };
  const byEmp = new Map<string, Map<string, Slice>>();
  const weekSet = new Set<string>();

  for (const r of rows) {
    const store = (r[iStore] || '').trim();
    const employee = (r[iEmployee] || '').trim();
    if (!store || !employee) continue;
    let week = '';
    if (iWeek >= 0 && r[iWeek]) {
      const wRaw = r[iWeek].trim();
      const d = new Date(wRaw);
      week = Number.isFinite(d.getTime()) ? isoWeekKey(d) : wRaw;
    } else if (iDate >= 0 && r[iDate]) {
      const d = new Date(r[iDate]);
      if (Number.isFinite(d.getTime())) week = isoWeekKey(d);
    }
    if (!week) continue;
    weekSet.add(week);
    const key = `${store}::${employee}`;
    let perWeek = byEmp.get(key);
    if (!perWeek) { perWeek = new Map(); byEmp.set(key, perWeek); }
    const slice = perWeek.get(week) || { tips: 0, net: 0 };
    slice.tips += num(r[iTips]);
    slice.net += num(r[iNet]);
    perWeek.set(week, slice);
  }

  const weeks = Array.from(weekSet).sort();
  if (weeks.length < 2) {
    return { ok: false, error: 'Need at least two weeks of data for variance', hint: 'Make sure the CSV covers multiple weeks.' };
  }
  const prevWeek = weeks[weeks.length - 2];
  const currWeek = weeks[weeks.length - 1];

  const perEmployee: TipDrift[] = [];
  let netPrevTips = 0;
  let netCurrTips = 0;

  byEmp.forEach((perWeek, key) => {
    const prev = perWeek.get(prevWeek) || { tips: 0, net: 0 };
    const curr = perWeek.get(currWeek) || { tips: 0, net: 0 };
    if (prev.net + curr.net < 100) return; // skip negligible rows
    netPrevTips += prev.tips;
    netCurrTips += curr.tips;
    const prevRate = prev.net > 0 ? prev.tips / prev.net : 0;
    const currRate = curr.net > 0 ? curr.tips / curr.net : 0;
    const deltaPp = (currRate - prevRate) * 100;
    const [store, name] = key.split('::');
    perEmployee.push({
      store, name,
      prevTipRate: prevRate, currTipRate: currRate,
      deltaPp,
      prevTipDollars: prev.tips, currTipDollars: curr.tips,
      flagged: deltaPp < -2 && prev.tips > 50,
    });
  });

  perEmployee.sort((a, b) => a.deltaPp - b.deltaPp);

  return {
    rowsParsed: rows.length,
    weeks,
    employees: perEmployee.length,
    networkPrevTips: netPrevTips,
    networkCurrTips: netCurrTips,
    networkWoW: netPrevTips > 0 ? (netCurrTips - netPrevTips) / netPrevTips : 0,
    perEmployee: perEmployee.slice(0, 20),
  };
}
