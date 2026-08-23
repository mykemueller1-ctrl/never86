export type VendorSilenceInput = {
  vendor: string;
  store?: string;
  owner?: string;
  lastSeenDate: string;
  asOfDate: string;
  expectedCadenceDays: number;
  graceDays?: number;
  pauseWeekends?: boolean;
  pausedDates?: string[];
  programStartedDate?: string;
  existingOpenTicketId?: string;
  lastSeenEvidence?: string;
};

export type VendorSilenceResult = {
  vendor: string;
  store: string;
  owner: string;
  asOfDate: string;
  lastSeenDate: string;
  daysQuiet: number;
  thresholdDays: number;
  status: 'on-track' | 'advisory' | 'review';
  ticketAction: 'none' | 'open' | 'keep-open';
  ticketId?: string;
  sourceStatus: 'unverified';
  message: string;
  nextAction: string;
  proofRequired: string;
  policy: {
    cadence: 'operator-approved only';
    onboarding: 'first 14 calendar days advisory';
    duplicateRule: string;
    resetRule: string;
    boundary: string;
  };
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(name: string, value: string): { date: Date } | { error: string } {
  if (!ISO_DATE.test(value)) return { error: `${name} must be YYYY-MM-DD.` };
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return { error: `${name} must be a real calendar date.` };
  }
  return { date };
}

function wholeNonNegative(name: string, value: number): string | null {
  if (!Number.isInteger(value) || value < 0) return `${name} must be a non-negative whole number.`;
  return null;
}

function calendarDays(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function countQuietDays(lastSeen: Date, asOf: Date, pauseWeekends: boolean, pausedDates: Set<string>): number {
  let count = 0;
  for (let cursor = new Date(lastSeen.getTime() + 86_400_000); cursor <= asOf; cursor = new Date(cursor.getTime() + 86_400_000)) {
    const iso = cursor.toISOString().slice(0, 10);
    const weekend = cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6;
    if (pausedDates.has(iso) || (pauseWeekends && weekend)) continue;
    count += 1;
  }
  return count;
}

export function buildVendorSilenceTicket(
  input: VendorSilenceInput,
): { ok: true; result: VendorSilenceResult } | { ok: false; error: string } {
  const vendor = input.vendor.trim();
  if (!vendor) return { ok: false, error: 'vendor is required.' };

  const lastSeenParsed = parseDate('lastSeenDate', input.lastSeenDate);
  if ('error' in lastSeenParsed) return { ok: false, error: lastSeenParsed.error };
  const asOfParsed = parseDate('asOfDate', input.asOfDate);
  if ('error' in asOfParsed) return { ok: false, error: asOfParsed.error };
  if (asOfParsed.date < lastSeenParsed.date) {
    return { ok: false, error: 'asOfDate must be on or after lastSeenDate.' };
  }

  const cadenceError = wholeNonNegative('expectedCadenceDays', input.expectedCadenceDays);
  if (cadenceError || input.expectedCadenceDays < 1) {
    return { ok: false, error: 'expectedCadenceDays must be a positive whole number.' };
  }
  const graceDays = input.graceDays ?? 0;
  const graceError = wholeNonNegative('graceDays', graceDays);
  if (graceError) return { ok: false, error: graceError };

  const pausedDates = new Set<string>();
  for (const value of input.pausedDates ?? []) {
    const parsed = parseDate('pausedDates entry', value);
    if ('error' in parsed) return { ok: false, error: parsed.error };
    pausedDates.add(value);
  }

  let programAgeDays: number | null = null;
  if (input.programStartedDate) {
    const parsed = parseDate('programStartedDate', input.programStartedDate);
    if ('error' in parsed) return { ok: false, error: parsed.error };
    if (parsed.date > asOfParsed.date) return { ok: false, error: 'programStartedDate must be on or before asOfDate.' };
    programAgeDays = calendarDays(parsed.date, asOfParsed.date);
  }

  const daysQuiet = countQuietDays(
    lastSeenParsed.date,
    asOfParsed.date,
    Boolean(input.pauseWeekends),
    pausedDates,
  );
  const thresholdDays = input.expectedCadenceDays + graceDays;
  const due = daysQuiet >= thresholdDays;
  const advisory = due && programAgeDays !== null && programAgeDays < 14;
  const existingOpenTicketId = input.existingOpenTicketId?.trim();
  const status: VendorSilenceResult['status'] = !due ? 'on-track' : advisory ? 'advisory' : 'review';
  const ticketAction: VendorSilenceResult['ticketAction'] = !due || advisory
    ? 'none'
    : existingOpenTicketId
      ? 'keep-open'
      : 'open';
  const message = !due
    ? `${vendor} is ${daysQuiet} counted day${daysQuiet === 1 ? '' : 's'} quiet against an operator-approved ${thresholdDays}-day threshold.`
    : advisory
      ? `${vendor} reached the ${thresholdDays}-day threshold, but the first 14 days stay advisory while the store baseline is learned.`
      : `${vendor} is ${daysQuiet} counted days quiet against an operator-approved ${thresholdDays}-day threshold; verify the expected delivery or document the exception.`;

  return {
    ok: true,
    result: {
      vendor,
      store: input.store?.trim() || 'Unspecified store',
      owner: input.owner?.trim() || 'Ordering owner',
      asOfDate: input.asOfDate,
      lastSeenDate: input.lastSeenDate,
      daysQuiet,
      thresholdDays,
      status,
      ticketAction,
      ...(existingOpenTicketId && ticketAction === 'keep-open' ? { ticketId: existingOpenTicketId } : {}),
      sourceStatus: 'unverified',
      message,
      nextAction: due
        ? 'Check the receiving log, invoice/confirmation, and closure calendar; then confirm the delivery, contact the vendor from a human-approved draft, or record the exception.'
        : 'No silence ticket. Keep watching the approved cadence.',
      proofRequired: input.lastSeenEvidence?.trim() || 'Receiving log, invoice, confirmation, or operator-approved exception record.',
      policy: {
        cadence: 'operator-approved only',
        onboarding: 'first 14 calendar days advisory',
        duplicateRule: 'One open vendor/location event at a time; new duplicate signals keep the existing ticket open.',
        resetRule: 'Only a human-reviewed receiving, invoice, confirmation, or exception proof resets last-seen.',
        boundary: 'Silence ranks follow-up work. It is not proof of a missed delivery, shortage, vendor failure, or financial loss.',
      },
    },
  };
}
