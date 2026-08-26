import type { PdqReportFamily } from './pdqEodParse';

/** Report families that must parse twice before unattended daily routines. */
export const REQUIRED_PARSE_FAMILIES: readonly PdqReportFamily[] = [
  'z-summary',
  'hourly',
  'void-promo',
];

export type SuccessfulParse = {
  family: PdqReportFamily;
  businessDate: string;
  rejected?: boolean;
};

export type FamilyParseStatus = {
  family: PdqReportFamily;
  distinctDates: string[];
  ready: boolean;
};

export type UnattendedRoutineGate = {
  ok: boolean;
  readyFamilies: PdqReportFamily[];
  missing: FamilyParseStatus[];
  reason: string;
};

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Unattended morning/night routines stay off until each required PDQ family
 * has successful parses on two different business dates. Same-day re-uploads
 * do not count. Rejected/injection rows do not count. Human still reviews
 * those two days before auto-run.
 */
export function unattendedRoutineGate(parses: SuccessfulParse[]): UnattendedRoutineGate {
  const byFamily = new Map<PdqReportFamily, Set<string>>();
  for (const family of REQUIRED_PARSE_FAMILIES) byFamily.set(family, new Set());

  for (const row of parses) {
    if (row.rejected) continue;
    if (row.family === 'unknown') continue;
    if (!isIsoDate(row.businessDate)) continue;
    byFamily.get(row.family)?.add(row.businessDate);
  }

  const statuses: FamilyParseStatus[] = REQUIRED_PARSE_FAMILIES.map((family) => {
    const dates = [...(byFamily.get(family) ?? [])].sort();
    return { family, distinctDates: dates, ready: dates.length >= 2 };
  });

  const missing = statuses.filter((s) => !s.ready);
  const readyFamilies = statuses.filter((s) => s.ready).map((s) => s.family);
  if (missing.length > 0) {
    const need = missing.map((s) => `${s.family} (${s.distinctDates.length}/2 dates)`).join(', ');
    return {
      ok: false,
      readyFamilies,
      missing,
      reason: `Unattended routines stay off until two successful parses on different dates for: ${need}.`,
    };
  }

  return {
    ok: true,
    readyFamilies,
    missing: [],
    reason: 'Two successful parses on different dates for Z, Hourly, and Void. Unattended routines may be enabled after human review of those two days.',
  };
}
