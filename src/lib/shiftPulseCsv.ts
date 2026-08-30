// Shift Pulse — tonight's shift from a CSV, not a live portal feed.
// Forecast vs actual, station void median, one goal, zero-comp streak count.

import { parseCsv, findColumn, num, median, type CsvAnalysisError } from './csv/core';

export type ShiftPulseStationCsv = {
  name: string;
  net: number;
  voids: number;
  voidRate: number;
  stationMedianVoidRate: number;
  flagged: boolean;
};

export type ShiftPulseCrewCsv = {
  name: string;
  role: string;
  station: string;
  covers: number;
  net: number;
  voidRate: number;
  comps: number;
  zeroComp: boolean;
};

export type ShiftPulseCsv = {
  rowsParsed: number;
  store: string;
  shift: string;
  forecastCovers: number;
  actualCovers: number;
  forecastNet: number;
  actualNet: number;
  pacingPct: number;
  shiftGoalLabel: string;
  shiftGoalTarget: number;
  shiftGoalActual: number;
  voidMedian: number;
  zeroCompStreak: number;
  stations: ShiftPulseStationCsv[];
  crew: ShiftPulseCrewCsv[];
  sourceStatus: 'unverified';
  portalLoginRequired: false;
  claimBoundary: string;
};

const CLAIM_BOUNDARY =
  'Pacing and station medians are unverified typed figures. They do not prove theft, a missed forecast, or a clean night.';

export function runShiftPulse(csv: string): ShiftPulseCsv | CsvAnalysisError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Shift CSV with a header row is required. No live POS login.' };
  }

  const iStore = findColumn(headers, ['Store', 'Location', 'LocationName', 'Site']);
  const iShift = findColumn(headers, ['Shift', 'Daypart', 'Service']);
  const iStation = findColumn(headers, ['Station', 'RevenueCenter', 'Area']);
  const iForecastCovers = findColumn(headers, ['ForecastCovers', 'ForecastCover']);
  const iActualCovers = findColumn(headers, ['ActualCovers', 'Covers', 'CoverCount']);
  const iForecastNet = findColumn(headers, ['ForecastNet', 'ForecastSales']);
  const iActualNet = findColumn(headers, ['ActualNet', 'Net', 'NetSales', 'Sales']);
  const iVoids = findColumn(headers, ['Voids', 'VoidAmount', 'Void']);
  const iComps = findColumn(headers, ['Comps', 'CompAmount', 'Comp']);
  const iCrew = findColumn(headers, ['Crew', 'Employee', 'Name', 'TeamMember']);
  const iRole = findColumn(headers, ['Role', 'Job', 'Position']);

  const missing: string[] = [];
  if (iStore < 0) missing.push('Store / Location');
  if (iForecastNet < 0) missing.push('Forecast Net');
  if (iActualNet < 0) missing.push('Actual Net');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Shift Pulse CSV needs Store, Forecast Net, and Actual Net. Station, covers, voids, comps, and crew are optional.',
      detectedColumns: headers,
    };
  }

  type Row = {
    store: string;
    shift: string;
    station: string;
    forecastCovers: number;
    actualCovers: number;
    forecastNet: number;
    actualNet: number;
    voids: number;
    comps: number;
    crew: string;
    role: string;
  };

  const parsed: Row[] = [];
  for (const r of rows) {
    const store = (r[iStore] || '').trim();
    if (!store) continue;
    parsed.push({
      store,
      shift: iShift >= 0 ? (r[iShift] || '').trim() : '',
      station: iStation >= 0 ? (r[iStation] || '').trim() : 'Unspecified',
      forecastCovers: iForecastCovers >= 0 ? num(r[iForecastCovers]) : 0,
      actualCovers: iActualCovers >= 0 ? num(r[iActualCovers]) : 0,
      forecastNet: num(r[iForecastNet]),
      actualNet: num(r[iActualNet]),
      voids: iVoids >= 0 ? num(r[iVoids]) : 0,
      comps: iComps >= 0 ? num(r[iComps]) : 0,
      crew: iCrew >= 0 ? (r[iCrew] || '').trim() : '',
      role: iRole >= 0 ? (r[iRole] || '').trim() : '',
    });
  }

  if (!parsed.length) {
    return { ok: false, error: 'No valid shift rows after parsing', hint: 'Check that Store is populated.', detectedColumns: headers };
  }

  const store = parsed[0].store;
  const shift = parsed[0].shift || 'Unspecified shift';
  const scoped = parsed.filter((row) => row.store === store);

  const forecastCovers = scoped.reduce((s, r) => s + r.forecastCovers, 0);
  const actualCovers = scoped.reduce((s, r) => s + r.actualCovers, 0);
  const forecastNet = scoped.reduce((s, r) => s + r.forecastNet, 0);
  const actualNet = scoped.reduce((s, r) => s + r.actualNet, 0);
  const pacingPct = forecastNet > 0 ? (actualNet / forecastNet) * 100 : 0;

  const stationMap = new Map<string, { net: number; voids: number }>();
  for (const r of scoped) {
    const prev = stationMap.get(r.station) || { net: 0, voids: 0 };
    stationMap.set(r.station, { net: prev.net + r.actualNet, voids: prev.voids + r.voids });
  }
  const stationRates = Array.from(stationMap.values()).map((v) => (v.net > 0 ? v.voids / v.net : 0));
  const voidMedian = median(stationRates);
  const stations: ShiftPulseStationCsv[] = Array.from(stationMap.entries()).map(([name, v]) => {
    const voidRate = v.net > 0 ? v.voids / v.net : 0;
    return {
      name,
      net: v.net,
      voids: v.voids,
      voidRate,
      stationMedianVoidRate: voidMedian,
      flagged: voidMedian > 0 && voidRate > 1.5 * voidMedian,
    };
  });

  const crew: ShiftPulseCrewCsv[] = scoped
    .filter((r) => r.crew)
    .map((r) => ({
      name: r.crew,
      role: r.role,
      station: r.station,
      covers: r.actualCovers,
      net: r.actualNet,
      voidRate: r.actualNet > 0 ? r.voids / r.actualNet : 0,
      comps: r.comps,
      zeroComp: r.comps === 0,
    }));

  let zeroCompStreak = 0;
  for (const member of crew) {
    if (!member.zeroComp) break;
    zeroCompStreak += 1;
  }

  return {
    rowsParsed: scoped.length,
    store,
    shift,
    forecastCovers,
    actualCovers,
    forecastNet,
    actualNet,
    pacingPct,
    shiftGoalLabel: 'Hit the forecasted net',
    shiftGoalTarget: forecastNet,
    shiftGoalActual: actualNet,
    voidMedian,
    zeroCompStreak,
    stations,
    crew,
    sourceStatus: 'unverified',
    portalLoginRequired: false,
    claimBoundary: CLAIM_BOUNDARY,
  };
}
