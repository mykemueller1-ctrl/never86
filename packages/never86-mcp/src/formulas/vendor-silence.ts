export type VendorSilenceInput = {
  vendor: string;
  store?: string;
  owner?: string;
  last_seen_date: string;
  as_of_date: string;
  expected_cadence_days: number;
  grace_days?: number;
  pause_weekends?: boolean;
  paused_dates?: string[];
  program_started_date?: string;
  existing_open_ticket_id?: string;
  last_seen_evidence?: string;
};

function parseDay(iso: string): Date {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`invalid date: ${iso}`);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

export function buildVendorSilenceTicket(input: VendorSilenceInput) {
  const last = parseDay(input.last_seen_date);
  const asOf = parseDay(input.as_of_date);
  const cadence = input.expected_cadence_days;
  if (!Number.isInteger(cadence) || cadence < 1) {
    throw new Error("expected_cadence_days must be an integer >= 1");
  }
  const grace = input.grace_days ?? 0;
  const paused = new Set(input.paused_dates ?? []);

  let elapsed = 0;
  const cursor = new Date(last);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= asOf) {
    const iso = cursor.toISOString().slice(0, 10);
    const skipWeekend = Boolean(input.pause_weekends && isWeekend(cursor));
    const skipPaused = paused.has(iso);
    if (!skipWeekend && !skipPaused) elapsed += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const dueAfter = cadence + grace;
  const overdueBy = elapsed - dueAfter;

  let advisory = false;
  if (input.program_started_date) {
    const started = parseDay(input.program_started_date);
    const age = daysBetween(started, asOf);
    advisory = age < 14;
  }

  let state: "quiet-ok" | "advisory" | "follow-up" | "existing-ticket";
  if (input.existing_open_ticket_id) state = "existing-ticket";
  else if (advisory) state = "advisory";
  else if (overdueBy > 0) state = "follow-up";
  else state = "quiet-ok";

  return {
    vendor: input.vendor,
    store: input.store ?? null,
    owner: input.owner ?? "Purchasing / Store GM",
    evidence_status: "UNVERIFIED" as const,
    last_seen_date: input.last_seen_date,
    as_of_date: input.as_of_date,
    expected_cadence_days: cadence,
    grace_days: grace,
    elapsed_countable_days: elapsed,
    overdue_by_days: Math.max(0, overdueBy),
    state,
    ticket_id: input.existing_open_ticket_id ?? null,
    last_seen_evidence: input.last_seen_evidence ?? null,
    claim_boundary:
      "A quiet vendor is a follow-up signal, not proof a delivery was missed or inventory is short.",
    next_move:
      state === "follow-up"
        ? `One ticket: ask ${input.vendor} for invoice/confirmation since ${input.last_seen_date}. Do not open a second ticket.`
        : state === "existing-ticket"
          ? `Keep ticket ${input.existing_open_ticket_id} open. Do not duplicate.`
          : state === "advisory"
            ? "Baseline is inside the first 14 days. Log last-seen only."
            : "Cadence still inside window. No ticket.",
    proof_to_reset_last_seen: "Reviewed receipt, invoice, confirmation, or approved exception.",
  };
}
