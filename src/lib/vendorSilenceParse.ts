/**
 * Vendor Silence intake for Action Shift.
 *
 * Typed cadence only: last_seen_date, as_of_date, expected_cadence_days,
 * optional grace_days, paused_dates, pause_weekends, program_started_date.
 * Missing cadence or last-seen is Missing Evidence — not a ticket and not $0.
 * Synthetic fixtures only. Never live vendor totals or private store names.
 */

import { findColumn, parseCsv } from './csv/core';

export type VendorSilenceRow = {
  vendor: string;
  store: string;
  owner: string;
  lastSeenDate: string | null;
  asOfDate: string | null;
  expectedCadenceDays: number | null;
  graceDays: number | null;
  pauseWeekends: boolean;
  pausedDates: string[];
  programStartedDate: string | null;
  existingOpenTicketId: string | null;
  lastSeenEvidence: string | null;
  missingEvidence: string[];
};

export type VendorSilenceDocument = {
  filename: string;
  rows: VendorSilenceRow[];
  missingFields: string[];
};

const PDQ_RE = /zreport_summary|hourly_sales|void_promo|end of day/;

function looksLikePdq(text: string, filename = ''): boolean {
  return PDQ_RE.test(`${filename}\n${text}`.toLowerCase());
}

export function looksLikeVendorSilence(text: string, filename = ''): boolean {
  if (looksLikePdq(text, filename)) return false;
  const hay = `${filename}\n${text}`.toLowerCase();
  if (/\bvendor[-_ ]?silence\b|\bsilence[-_ ]?clock\b/.test(hay)) return true;
  if (/\blast[_ -]?seen[_ -]?date\b/.test(hay) && /\b(expected[_ -]?cadence|cadence[_ -]?days)\b/.test(hay)) {
    return true;
  }
  const { headers } = parseCsv(text);
  if (!headers.length) return false;
  const lastSeen = findColumn(headers, ['last_seen_date', 'lastSeenDate', 'LastSeen']);
  const cadence = findColumn(headers, ['expected_cadence_days', 'expectedCadenceDays', 'CadenceDays', 'Cadence']);
  return lastSeen >= 0 || cadence >= 0;
}

function blank(value: string | undefined | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

function wholePositive(raw: string | null): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function wholeNonNegative(raw: string | null): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function parseBool(raw: string | null): boolean {
  return /^(1|true|yes|y)$/i.test(raw ?? '');
}

function parseDateList(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(/[;,]/).map((part) => part.trim()).filter(Boolean);
}

function rowFromFields(fields: {
  vendor?: string | null;
  store?: string | null;
  owner?: string | null;
  lastSeenDate?: string | null;
  asOfDate?: string | null;
  expectedCadenceDays?: string | null;
  graceDays?: string | null;
  pauseWeekends?: string | null;
  pausedDates?: string | null;
  programStartedDate?: string | null;
  existingOpenTicketId?: string | null;
  lastSeenEvidence?: string | null;
}, fallbackStore: string): VendorSilenceRow {
  const vendor = blank(fields.vendor) ?? '';
  const lastSeenDate = blank(fields.lastSeenDate);
  const asOfDate = blank(fields.asOfDate);
  const expectedCadenceDays = wholePositive(blank(fields.expectedCadenceDays));
  const missingEvidence: string[] = [];
  if (!vendor) missingEvidence.push('Vendor name is Missing Evidence, not a ticket and not $0.');
  if (!lastSeenDate) missingEvidence.push('Last-seen date is Missing Evidence, not a ticket and not $0.');
  if (!asOfDate) missingEvidence.push('As-of date is Missing Evidence, not a ticket and not $0.');
  if (expectedCadenceDays == null) {
    missingEvidence.push('Operator-approved expected cadence (days) is Missing Evidence, not a ticket and not $0.');
  }

  return {
    vendor,
    store: blank(fields.store) || fallbackStore,
    owner: blank(fields.owner) || 'Ordering owner',
    lastSeenDate,
    asOfDate,
    expectedCadenceDays,
    graceDays: wholeNonNegative(blank(fields.graceDays)),
    pauseWeekends: parseBool(blank(fields.pauseWeekends)),
    pausedDates: parseDateList(blank(fields.pausedDates)),
    programStartedDate: blank(fields.programStartedDate),
    existingOpenTicketId: blank(fields.existingOpenTicketId),
    lastSeenEvidence: blank(fields.lastSeenEvidence),
    missingEvidence,
  };
}

function parseCsvPacket(text: string, fallbackStore: string): VendorSilenceRow[] {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || '';
  if (!firstLine.includes(',')) return [];
  const { headers, rows } = parseCsv(text);
  if (!headers.length) return [];
  const vendorCol = findColumn(headers, ['vendor', 'VendorName']);
  const storeCol = findColumn(headers, ['store', 'location', 'Location']);
  const ownerCol = findColumn(headers, ['owner']);
  const lastSeenCol = findColumn(headers, ['last_seen_date', 'lastSeenDate', 'LastSeen']);
  const asOfCol = findColumn(headers, ['as_of_date', 'asOfDate', 'AsOf']);
  const cadenceCol = findColumn(headers, ['expected_cadence_days', 'expectedCadenceDays', 'CadenceDays', 'Cadence']);
  const graceCol = findColumn(headers, ['grace_days', 'graceDays', 'Grace']);
  const pauseWeekendsCol = findColumn(headers, ['pause_weekends', 'pauseWeekends']);
  const pausedDatesCol = findColumn(headers, ['paused_dates', 'pausedDates', 'pause_dates']);
  const programCol = findColumn(headers, ['program_started_date', 'programStartedDate', 'ProgramStart']);
  const ticketCol = findColumn(headers, ['existing_open_ticket_id', 'existingOpenTicketId', 'ticket_id']);
  const evidenceCol = findColumn(headers, ['last_seen_evidence', 'lastSeenEvidence']);
  if (lastSeenCol < 0 && cadenceCol < 0 && asOfCol < 0) return [];

  return rows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => rowFromFields({
      vendor: vendorCol >= 0 ? row[vendorCol] : null,
      store: storeCol >= 0 ? row[storeCol] : null,
      owner: ownerCol >= 0 ? row[ownerCol] : null,
      lastSeenDate: lastSeenCol >= 0 ? row[lastSeenCol] : null,
      asOfDate: asOfCol >= 0 ? row[asOfCol] : null,
      expectedCadenceDays: cadenceCol >= 0 ? row[cadenceCol] : null,
      graceDays: graceCol >= 0 ? row[graceCol] : null,
      pauseWeekends: pauseWeekendsCol >= 0 ? row[pauseWeekendsCol] : null,
      pausedDates: pausedDatesCol >= 0 ? row[pausedDatesCol] : null,
      programStartedDate: programCol >= 0 ? row[programCol] : null,
      existingOpenTicketId: ticketCol >= 0 ? row[ticketCol] : null,
      lastSeenEvidence: evidenceCol >= 0 ? row[evidenceCol] : null,
    }, fallbackStore));
}

function keyAlias(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const NATIVE_KEYS: Record<string, keyof Parameters<typeof rowFromFields>[0]> = {
  vendor: 'vendor',
  store: 'store',
  location: 'store',
  owner: 'owner',
  lastseendate: 'lastSeenDate',
  lastseen: 'lastSeenDate',
  asofdate: 'asOfDate',
  asof: 'asOfDate',
  expectedcadencedays: 'expectedCadenceDays',
  cadencedays: 'expectedCadenceDays',
  cadence: 'expectedCadenceDays',
  gracedays: 'graceDays',
  grace: 'graceDays',
  pauseweekends: 'pauseWeekends',
  pauseddates: 'pausedDates',
  pausedates: 'pausedDates',
  programstarteddate: 'programStartedDate',
  programstart: 'programStartedDate',
  existingopenticketid: 'existingOpenTicketId',
  ticketid: 'existingOpenTicketId',
  lastseenevidence: 'lastSeenEvidence',
};

function parseNativeBlocks(text: string, fallbackStore: string): VendorSilenceRow[] {
  const blocks: Array<Record<string, string>> = [];
  let current: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /^vendor\s*silence$/i.test(trimmed) || /^-+$/.test(trimmed)) {
      if (trimmed.startsWith('-') && Object.keys(current).length) {
        blocks.push(current);
        current = {};
      }
      continue;
    }
    const match = trimmed.match(/^([A-Za-z][A-Za-z0-9 _-]*)\s*[:=]\s*(.*)$/);
    if (!match) continue;
    const alias = keyAlias(match[1]);
    const field = NATIVE_KEYS[alias];
    if (!field) continue;
    if (field === 'vendor' && current.vendor) {
      blocks.push(current);
      current = {};
    }
    current[field] = match[2].trim();
  }
  if (Object.keys(current).length) blocks.push(current);
  return blocks.map((block) => rowFromFields(block, fallbackStore));
}

export function parseVendorSilencePacket(text: string, filename = '', store?: string): VendorSilenceDocument {
  const fallbackStore = store?.trim() || 'Unspecified store';
  const csvRows = parseCsvPacket(text, fallbackStore);
  const rows = csvRows.length ? csvRows : parseNativeBlocks(text, fallbackStore);
  const missingFields = [...new Set(rows.flatMap((row) => row.missingEvidence))];
  return { filename, rows, missingFields };
}

export function serializeVendorSilencePacket(input: {
  vendor: string;
  store?: string;
  owner?: string;
  lastSeenDate?: string;
  asOfDate?: string;
  expectedCadenceDays?: string | number;
  graceDays?: string | number;
  pauseWeekends?: boolean;
  pausedDates?: string;
  programStartedDate?: string;
}): string {
  const lines = [
    'Vendor Silence',
    input.store ? `store: ${input.store}` : null,
    input.owner ? `owner: ${input.owner}` : null,
    `vendor: ${input.vendor}`,
    `last_seen_date: ${input.lastSeenDate ?? ''}`,
    `as_of_date: ${input.asOfDate ?? ''}`,
    `expected_cadence_days: ${input.expectedCadenceDays ?? ''}`,
    input.graceDays !== undefined && input.graceDays !== '' ? `grace_days: ${input.graceDays}` : null,
    input.pauseWeekends ? 'pause_weekends: true' : null,
    input.pausedDates ? `paused_dates: ${input.pausedDates}` : null,
    input.programStartedDate ? `program_started_date: ${input.programStartedDate}` : null,
  ];
  return lines.filter((line): line is string => Boolean(line)).join('\n');
}
