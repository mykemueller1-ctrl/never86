/**
 * Vendor Silence → Action Shift.
 *
 * Quiet vendor is a follow-up signal, not proof a truck was missed or inventory
 * is short. First 14 calendar days after program start stay advisory. Duplicate
 * vendor+store+day does not open a second ticket. Closing requires proof that
 * resets last-seen. Typed inputs stay Unverified. Missing cadence or last-seen
 * = Missing Evidence, not a ticket and not $0.
 */

import type { ActionShiftAction, ActionShiftResult } from './actionShift';
import { buildVendorSilenceTicket, type VendorSilenceResult } from './vendorSilence';
import {
  parseVendorSilencePacket,
  type VendorSilenceDocument,
  type VendorSilenceRow,
} from './vendorSilenceParse';

export type VendorSilenceEvidenceState = 'unverified' | 'missing-evidence';

export type VendorSilenceEvaluation = {
  silenceKey: string;
  vendor: string;
  store: string;
  asOfDate: string | null;
  evidenceState: VendorSilenceEvidenceState;
  ticket: VendorSilenceResult | null;
  ticketAction: VendorSilenceResult['ticketAction'] | 'missing';
  missingEvidence: string[];
};

export type VendorSilenceCompareResult = {
  evaluations: VendorSilenceEvaluation[];
  uniqueTickets: VendorSilenceEvaluation[];
  missingEvidence: string[];
  documents: VendorSilenceDocument[];
};

export const VENDOR_SILENCE_CLAIM_BOUNDARY =
  'A quiet vendor is a follow-up signal, not proof that a truck was missed or inventory is short. Silence is not a shortage, missed delivery, vendor failure, or financial loss.';

export function vendorSilenceKey(vendor: string, store: string, asOfDate: string): string {
  return `${vendor.trim().toLowerCase()}::${store.trim().toLowerCase()}::${asOfDate}`;
}

function ticketIdFor(key: string): string {
  return `vendor-silence:${key}`;
}

export function evaluateVendorSilenceDocuments(
  documents: VendorSilenceDocument[],
): VendorSilenceCompareResult {
  const evaluations: VendorSilenceEvaluation[] = [];
  const openByKey = new Map<string, string>();
  const missingEvidence: string[] = [];

  for (const doc of documents) {
    missingEvidence.push(...doc.missingFields);
    for (const row of doc.rows) {
      evaluations.push(evaluateRow(row, openByKey));
    }
  }

  const uniqueTickets: VendorSilenceEvaluation[] = [];
  const seen = new Set<string>();
  for (const evaluation of evaluations) {
    const key = evaluation.silenceKey;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTickets.push(evaluation);
  }

  return {
    evaluations,
    uniqueTickets,
    missingEvidence: [...new Set([
      ...missingEvidence,
      ...evaluations.flatMap((row) => row.missingEvidence),
    ])],
    documents,
  };
}

function evaluateRow(
  row: VendorSilenceRow,
  openByKey: Map<string, string>,
): VendorSilenceEvaluation {
  const asOfDate = row.asOfDate;
  const key = vendorSilenceKey(row.vendor || 'unknown-vendor', row.store, asOfDate || 'unknown-day');
  if (!row.vendor || !row.lastSeenDate || !asOfDate || row.expectedCadenceDays == null) {
    return {
      silenceKey: key,
      vendor: row.vendor,
      store: row.store,
      asOfDate,
      evidenceState: 'missing-evidence',
      ticket: null,
      ticketAction: 'missing',
      missingEvidence: row.missingEvidence.length
        ? row.missingEvidence
        : ['Vendor silence cadence or last-seen is Missing Evidence, not a ticket and not $0.'],
    };
  }

  const existingFromPacket = openByKey.get(key);
  const existingOpenTicketId = row.existingOpenTicketId || existingFromPacket;
  const built = buildVendorSilenceTicket({
    vendor: row.vendor,
    store: row.store,
    owner: row.owner,
    lastSeenDate: row.lastSeenDate,
    asOfDate,
    expectedCadenceDays: row.expectedCadenceDays,
    graceDays: row.graceDays ?? undefined,
    pauseWeekends: row.pauseWeekends,
    pausedDates: row.pausedDates,
    programStartedDate: row.programStartedDate ?? undefined,
    existingOpenTicketId: existingOpenTicketId ?? undefined,
    lastSeenEvidence: row.lastSeenEvidence ?? undefined,
  });

  if (!built.ok) {
    return {
      silenceKey: key,
      vendor: row.vendor,
      store: row.store,
      asOfDate,
      evidenceState: 'missing-evidence',
      ticket: null,
      ticketAction: 'missing',
      missingEvidence: [`${built.error} Vendor silence stays Missing Evidence, not a ticket and not $0.`],
    };
  }

  const ticketId = existingOpenTicketId || ticketIdFor(key);
  if (built.result.ticketAction === 'open' || built.result.ticketAction === 'keep-open') {
    openByKey.set(key, ticketId);
  }

  return {
    silenceKey: key,
    vendor: row.vendor,
    store: row.store,
    asOfDate,
    evidenceState: 'unverified',
    ticket: {
      ...built.result,
      ...(built.result.ticketAction === 'open' || built.result.ticketAction === 'keep-open'
        ? { ticketId }
        : {}),
    },
    ticketAction: built.result.ticketAction,
    missingEvidence: [],
  };
}

function silenceProof(): ActionShiftAction['proof'] {
  return {
    object: 'Receiving log, invoice, confirmation, or operator-approved exception that resets last-seen',
    nightCheck: 'Attach the receiving log, invoice/confirmation, or approved exception. Closing this ticket resets last-seen. A verbal yes does not close it.',
    verbalYesCloses: false,
  };
}

function actionFor(evaluation: VendorSilenceEvaluation): ActionShiftAction {
  const ticket = evaluation.ticket;
  const vendor = evaluation.vendor || 'this vendor';
  if (evaluation.ticketAction === 'missing' || !ticket) {
    return {
      id: 'vendor-silence',
      instanceKey: `vendor-silence:missing:${evaluation.silenceKey}`,
      title: `Get last-seen and approved cadence before ticking ${vendor} silence`,
      owner: 'Ordering owner',
      evidence: evaluation.missingEvidence.join(' ') || 'Cadence or last-seen is Missing Evidence, not a ticket and not $0.',
      move: 'Type the operator-approved cadence and last human-supported receipt date. Do not invent a missed truck or a $0 gap.',
      dollarsObserved: null,
      sourceStatus: 'unverified',
      claimBoundary: VENDOR_SILENCE_CLAIM_BOUNDARY,
      proof: silenceProof(),
    };
  }

  if (ticket.status === 'advisory') {
    return {
      id: 'vendor-silence',
      instanceKey: `vendor-silence:advisory:${evaluation.silenceKey}`,
      title: `Advisory: ${vendor} is quiet during the first 14 days`,
      owner: ticket.owner,
      evidence: `${ticket.message} Typed cadence stays Unverified. No ticket opens in the advisory window.`,
      move: 'Check the receiving log and closure calendar. Do not treat advisory silence as a missed truck or short inventory.',
      dollarsObserved: null,
      sourceStatus: 'unverified',
      claimBoundary: VENDOR_SILENCE_CLAIM_BOUNDARY,
      proof: silenceProof(),
    };
  }

  if (ticket.status === 'on-track') {
    return {
      id: 'vendor-silence',
      instanceKey: `vendor-silence:on-track:${evaluation.silenceKey}`,
      title: `${vendor} is inside the approved cadence — no silence ticket`,
      owner: ticket.owner,
      evidence: ticket.message,
      move: 'Keep watching the operator-approved cadence. Do not open a ticket from an on-track clock.',
      dollarsObserved: null,
      sourceStatus: 'unverified',
      claimBoundary: VENDOR_SILENCE_CLAIM_BOUNDARY,
      proof: silenceProof(),
    };
  }

  const kind = ticket.ticketAction === 'keep-open' ? 'keep-open' : 'open';
  return {
    id: 'vendor-silence',
    instanceKey: `vendor-silence:${kind}:${evaluation.silenceKey}`,
    title: ticket.ticketAction === 'keep-open'
      ? `Keep the existing ${vendor} silence ticket open`
      : `Follow up on ${vendor} quiet clock`,
    owner: ticket.owner,
    evidence: `${ticket.message} ${ticket.daysQuiet} counted quiet days vs a ${ticket.thresholdDays}-day operator-approved threshold. Typed inputs stay Unverified.`,
    move: ticket.nextAction,
    dollarsObserved: null,
    sourceStatus: 'unverified',
    claimBoundary: VENDOR_SILENCE_CLAIM_BOUNDARY,
    proof: silenceProof(),
  };
}

function rankEvaluations(rows: VendorSilenceEvaluation[]): VendorSilenceEvaluation[] {
  const rank = (row: VendorSilenceEvaluation): number => {
    if (row.ticketAction === 'open' || row.ticketAction === 'keep-open') return 3;
    if (row.ticket?.status === 'advisory') return 2;
    if (row.ticketAction === 'missing') return 1;
    return 0;
  };
  return [...rows].sort((left, right) => rank(right) - rank(left));
}

export function buildVendorSilenceActionShift(input: {
  store?: string;
  documents: Array<{ text: string; filename?: string }>;
}): { ok: true; result: ActionShiftResult; compare: VendorSilenceCompareResult } | { ok: false; error: string } {
  if (!input.documents.length) {
    return { ok: false, error: 'Type last-seen, as-of, and the operator-approved cadence first.' };
  }

  const parsed = input.documents.map((doc) => (
    parseVendorSilencePacket(doc.text, doc.filename || '', input.store)
  ));
  if (!parsed.some((doc) => doc.rows.length)) {
    return { ok: false, error: 'Could not read a vendor silence packet. Need last_seen_date, as_of_date, and expected_cadence_days. Typed values stay Unverified.' };
  }

  const compare = evaluateVendorSilenceDocuments(parsed);
  const ranked = rankEvaluations(compare.uniqueTickets);
  const ticketed = ranked.filter((row) => row.ticketAction === 'open' || row.ticketAction === 'keep-open');
  const advisory = ranked.filter((row) => row.ticket?.status === 'advisory');
  const missing = ranked.filter((row) => row.ticketAction === 'missing');
  const chosen = (ticketed.length ? ticketed : advisory.length ? advisory : missing.length ? missing : ranked)
    .slice(0, 3);
  const morningActions = chosen.map((row) => actionFor(row));

  const ticketCount = ticketed.length;
  const summary = ticketCount
    ? `${morningActions.length} ranked vendor-silence action${morningActions.length === 1 ? '' : 's'} from ${ticketCount} unique vendor+store+day clock${ticketCount === 1 ? '' : 's'}. Duplicate day keeps the existing ticket. Quiet is follow-up, not a missed truck.`
    : advisory.length
      ? 'Vendor silence is advisory for the first 14 calendar days after program start. No ticket opens. Typed inputs stay Unverified.'
      : missing.length
        ? 'Cadence or last-seen is Missing Evidence — not a ticket and not $0.'
        : 'No vendor silence ticket. Approved cadence is on track.';

  return {
    ok: true,
    compare,
    result: {
      store: input.store?.trim() || chosen[0]?.store || 'Unspecified store',
      businessDate: chosen[0]?.asOfDate || 'Unspecified business date',
      sourceStatus: 'unverified',
      summary,
      morningActions,
      nightCloseCheck: morningActions.map((action) => action.proof.nightCheck),
      missingEvidence: compare.missingEvidence,
      policy: {
        maxMorningActions: 3,
        benchmark: 'operator-supplied targets only',
        boundary: 'This tool ranks review work. It does not make theft, discipline, contract, bank-reconciliation, or guaranteed-savings claims.',
      },
    },
  };
}

const POS_SCORE: Record<ActionShiftAction['id'], number> = {
  'cash-proof': 100,
  'labor-window': 80,
  'payout-proof': 75,
  'delivery-clock': 70,
  'approval-proof': 60,
  'close-packet': 1,
  'vendor-drift': 90,
  'vendor-silence': 88,
  'po-receive-usage': 85,
};

function actionScore(action: ActionShiftAction): number {
  if (action.id === 'vendor-drift') {
    return 90 + Math.min(Math.max(action.dollarsObserved ?? 0, 0), 40);
  }
  if (action.id === 'po-receive-usage') {
    const base = action.dollarsObserved == null ? 55 : 85;
    return base + Math.min(Math.max(action.dollarsObserved ?? 0, 0), 40);
  }
  if (action.id === 'vendor-silence') {
    if (action.instanceKey?.includes(':open:') || action.instanceKey?.includes(':keep-open:')) return 88;
    if (action.instanceKey?.includes(':advisory:')) return 48;
    if (action.instanceKey?.includes(':missing:')) return 44;
    return 2;
  }
  return POS_SCORE[action.id] ?? 0;
}

export function feedVendorSilenceIntoActionShift(
  existing: ActionShiftResult | null,
  silence: ActionShiftResult | null,
): ActionShiftResult | null {
  if (!existing && !silence) return null;
  if (!existing) return silence;
  if (!silence) return existing;

  const silenceMoves = silence.morningActions.filter((action) => (
    !action.instanceKey?.includes(':on-track:')
  ));
  if (!silenceMoves.length) return existing;

  const combined = [...silenceMoves, ...existing.morningActions]
    .sort((left, right) => actionScore(right) - actionScore(left))
    .slice(0, 3);

  const nightCloseCheck = combined.map((action) => action.proof.nightCheck);
  const dropClosePacketEvidence = existing.morningActions.some((action) => action.id === 'close-packet')
    && combined.every((action) => action.id !== 'close-packet');
  const missingEvidence = [...new Set([
    ...silence.missingEvidence,
    ...existing.missingEvidence.filter((line) => (
      dropClosePacketEvidence ? !/complete same-scope close packet/i.test(line) : true
    )),
  ])];

  const silenceSelected = combined.some((action) => action.id === 'vendor-silence');
  return {
    store: existing.store,
    businessDate: existing.businessDate !== 'Unspecified business date' ? existing.businessDate : silence.businessDate,
    sourceStatus: 'unverified',
    summary: silenceSelected
      ? `${combined.length} ranked action${combined.length === 1 ? '' : 's'} mixing close, vendor, and silence clocks. Verify against source evidence before acting.`
      : existing.summary,
    morningActions: combined,
    nightCloseCheck,
    missingEvidence,
    policy: existing.policy,
  };
}
