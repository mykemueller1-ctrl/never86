/**
 * Public phone free-operator demo.
 * Founder lock 2026-09-03: mouth + cards for the small operator.
 * Sample path is FICTIONAL / sample-not-verified. Never invent a close.
 * Files stay on this phone. Owner-seat EOD forward is not this surface.
 */

export const FREE_OPERATOR_DEMO_ID = 'free-operator-demo-v1';
export const FREE_OPERATOR_DEMO_STATUS = 'tested' as const;
export const SAMPLE_LABEL = 'FICTIONAL / sample-not-verified' as const;

export const FREE_OPERATOR_CHIPS = [
  { id: 'foh', label: 'Front of house', answerSlug: 'foh-voids' },
  { id: 'boh', label: 'Back of house', answerSlug: 'boh-invoice' },
  { id: 'schedule', label: 'Schedule', answerSlug: 'schedule-labor' },
  { id: 'vendor', label: 'Vendor', answerSlug: 'vendor-silence' },
  { id: 'merchant', label: 'Merchant', answerSlug: 'merchant-account' },
] as const;

export type FreeOperatorChipId = (typeof FREE_OPERATOR_CHIPS)[number]['id'];

export const FREE_OPERATOR_MOUTH = ['talk', 'type', 'photo', 'file'] as const;
export type FreeOperatorMouth = (typeof FREE_OPERATOR_MOUTH)[number];

export type KnowledgeState = 'NEED' | 'READY';

export type WhatIKnowCard = {
  id: string;
  title: string;
  state: KnowledgeState;
  reason: string;
};

export const BASE_WHAT_I_KNOW: readonly WhatIKnowCard[] = [
  {
    id: 'z-close',
    title: 'Yesterday Z',
    state: 'NEED',
    reason: 'No close invented. A typed guess or a photo on this phone is not a Z.',
  },
  {
    id: 'hourly',
    title: 'Hourly',
    state: 'NEED',
    reason: 'Hourly stays open until the Hourly report is named and read on the owner seat.',
  },
  {
    id: 'voids',
    title: 'Voids',
    state: 'NEED',
    reason: 'Void dollars stay unnamed until the Void report lands. This preview does not print a leak.',
  },
  {
    id: 'vendor-cadence',
    title: 'Vendor cadence',
    state: 'NEED',
    reason: 'Missing cadence is Missing Evidence — not $0 and not a missed truck.',
  },
  {
    id: 'merchant-paper',
    title: 'Merchant paper',
    state: 'NEED',
    reason: 'No rate invented. A free terminal is not a merchant agreement.',
  },
  {
    id: 'mouth',
    title: 'Ask mouth',
    state: 'READY',
    reason: 'Talk, type, photo, or file. Files stay on this phone.',
  },
];

export const PUBLIC_PREVIEW_COPY =
  "Preview only—don't add private restaurant data here yet. Production V2 keeps original files private.";

export const OWNER_SEAT_EOD = {
  surface: 'owner-seat' as const,
  notThisDemo: true,
  copy:
    'Owner seat — not this public preview — forwards PDQ Z + Hourly + Void to close+{seat}@inbound.never86.ai. This phone does not issue a seat address, does not take a merchant account, and does not read your inbox.',
};

export type PrimeCostEvidence = {
  id: 'schedule' | 'hourly' | 'timeclock';
  short: string;
  title: string;
  icon: string;
  state: KnowledgeState;
  reason: string;
};

export const OWNER_PRIME_COST_EVIDENCE: readonly PrimeCostEvidence[] = [
  {
    id: 'schedule',
    short: 'Schedule',
    title: 'Weekly schedule',
    icon: '☰',
    state: 'READY',
    reason: 'I know who was planned.',
  },
  {
    id: 'hourly',
    short: 'Hourly sales',
    title: 'Hourly sales',
    icon: '$',
    state: 'NEED',
    reason: 'From your POS.',
  },
  {
    id: 'timeclock',
    short: 'Time clock',
    title: 'Time clock',
    icon: '◷',
    state: 'NEED',
    reason: 'Actual punches.',
  },
];

export const OWNER_DESK_TRAY = [
  { id: 'action', label: 'Action Shift', icon: '⚡' },
  { id: 'food', label: 'Food', icon: '🍽' },
  { id: 'labor', label: 'Labor', icon: '◷' },
  { id: 'pop', label: 'Pop', icon: '🥤' },
  { id: 'beer', label: 'Beer', icon: '🍺' },
  { id: 'liquor', label: 'Liquor', icon: '🥃' },
] as const;

export type OwnerDeskTrayId = (typeof OWNER_DESK_TRAY)[number]['id'];

export function resolveOwnerDeskAsk(
  question: string,
  tray: OwnerDeskTrayId = 'action',
): ResolveAskResult {
  const query = normalizeAsk(question);
  if (!query) {
    if (tray === 'labor') {
      return { ok: true, slug: 'schedule-labor', chipId: 'schedule', inventedClose: false };
    }
    if (tray === 'food') {
      return { ok: true, slug: 'boh-invoice', chipId: 'boh', inventedClose: false };
    }
    if (tray === 'beer' || tray === 'liquor' || tray === 'pop') {
      return { ok: true, slug: 'vendor-silence', chipId: 'vendor', inventedClose: false };
    }
    return {
      ok: false,
      reason: 'Ask is empty. The mouth is ready. The close is not.',
      needs: 'Talk, type, photo, or file. Name labor, invoice, voids, or vendor cadence.',
      inventedClose: false,
    };
  }

  if (/\bbeer\b|\bmargin\b|\bpackage\b|\bcredits?\b/.test(query)) {
    return { ok: true, slug: 'vendor-silence', chipId: 'vendor', inventedClose: false };
  }
  if (/\blabor\b|\bschedule\b|\bclock\b|\bhours?\b|\bovertime\b/.test(query)) {
    return { ok: true, slug: 'schedule-labor', chipId: 'schedule', inventedClose: false };
  }

  return resolveFreeOperatorAsk(question);
}

export type DemoVendorCadenceInput = {
  cadenceDays?: number | null;
  programAgeDays?: number | null;
  quietDays?: number | null;
};

export type DemoVendorCadenceResult = {
  status: 'missing-evidence' | 'advisory' | 'on-track' | 'review';
  inventsDollars: false;
  missedTruck: false;
  dollarClaim: 'none';
  message: string;
};

export function evaluateDemoVendorCadence(input: DemoVendorCadenceInput = {}): DemoVendorCadenceResult {
  const cadence = input.cadenceDays;
  if (cadence == null || !Number.isFinite(cadence) || cadence < 1) {
    return {
      status: 'missing-evidence',
      inventsDollars: false,
      missedTruck: false,
      dollarClaim: 'none',
      message:
        'Missing cadence is Missing Evidence. Quiet is not $0 and not a missed truck. Name the operator-approved days between deliveries first.',
    };
  }

  const programAge = input.programAgeDays;
  if (programAge != null && programAge < 14) {
    return {
      status: 'advisory',
      inventsDollars: false,
      missedTruck: false,
      dollarClaim: 'none',
      message:
        'First 14 calendar days stay advisory while the store baseline is learned. Silence ranks follow-up. It is not a missed truck and not a dollar leak.',
    };
  }

  const quiet = input.quietDays;
  if (quiet != null && quiet >= cadence) {
    return {
      status: 'review',
      inventsDollars: false,
      missedTruck: false,
      dollarClaim: 'none',
      message:
        'Cadence is named and quiet crossed it. Check receiving, invoice, or an approved exception. Do not write $0 and do not call it a missed truck from silence alone.',
    };
  }

  return {
    status: 'on-track',
    inventsDollars: false,
    missedTruck: false,
    dollarClaim: 'none',
    message: 'Approved cadence is on watch. No dollar invented. No missed-truck claim.',
  };
}

export function nameLocalEvidence(
  cards: readonly WhatIKnowCard[],
  kind: 'photo' | 'file',
  filename: string,
): WhatIKnowCard[] {
  const label = filename.trim() || (kind === 'photo' ? 'photo' : 'file');
  return cards.map((card) => {
    if (card.id === 'mouth') return card;
    return {
      ...card,
      state: 'NEED',
      reason: `${label} stays on this phone. Named is not a verified close. ${card.title} stays NEED.`,
    };
  });
}

export type FreeOperatorAnswer = {
  slug: string;
  chipId: FreeOperatorChipId;
  headline: string;
  facts: readonly string[];
  coachTomorrow: string;
  needs: string;
  sampleLabel: typeof SAMPLE_LABEL;
  sampleDollars: 'none-verified';
  verifiedClose: false;
};

export const FREE_OPERATOR_ANSWERS: readonly FreeOperatorAnswer[] = [
  {
    slug: 'foh-voids',
    chipId: 'foh',
    headline: 'Voids stay a question until yesterday’s Void report lands.',
    facts: [
      'Front of house chip names the till, not a person.',
      'This phone has not closed a day. $0 verified on this preview — FICTIONAL / sample-not-verified.',
      'A void line without the Void report is Unverified, not a leak.',
    ],
    coachTomorrow: 'Pull Z + Hourly + Void together. Name the station that owns the till. Do not name a thief.',
    needs: 'PDQ Void_Promo_Report for the prior business day, same store and cutoff as the Z.',
    sampleLabel: SAMPLE_LABEL,
    sampleDollars: 'none-verified',
    verifiedClose: false,
  },
  {
    slug: 'boh-invoice',
    chipId: 'boh',
    headline: 'No count → no food cost. An invoice photo is not a close.',
    facts: [
      'Back of house chip asks for paper you already have.',
      'A photo or file stays on this phone. It does not become COGS.',
      'No invoice dollar is verified here — FICTIONAL / sample-not-verified. $0 verified on this preview.',
    ],
    coachTomorrow: 'Photograph one invoice and keep the same-day Z. Count if you want food cost.',
    needs: 'One invoice plus same-scope sales. Count if you want food cost. Missing count stays Missing Evidence.',
    sampleLabel: SAMPLE_LABEL,
    sampleDollars: 'none-verified',
    verifiedClose: false,
  },
  {
    slug: 'schedule-labor',
    chipId: 'schedule',
    headline: 'Hours without sales stay Missing Evidence.',
    facts: [
      'Schedule chip names the labor question. It does not invent overtime dollars.',
      'Clocked hours without the matching Z stay Unverified.',
      'No wage and no OT dollar are verified here — FICTIONAL / sample-not-verified. $0 verified on this preview.',
    ],
    coachTomorrow: 'Bring scheduled vs clocked hours for one complete business day. Keep the Z from that day.',
    needs: 'Schedule or timesheet for the same store and business date as the Z. Wage stays optional and labeled Estimated if used later.',
    sampleLabel: SAMPLE_LABEL,
    sampleDollars: 'none-verified',
    verifiedClose: false,
  },
  {
    slug: 'vendor-silence',
    chipId: 'vendor',
    headline: 'Quiet is follow-up. Missing cadence is Missing Evidence — not a missed truck.',
    facts: [
      'Vendor silence stays advisory for the first 14 calendar days of a new store baseline.',
      'Without an operator-approved cadence, the clock is Missing Evidence. Not $0. Not a missed truck.',
      'No vendor dollar is verified on this phone — FICTIONAL / sample-not-verified.',
    ],
    coachTomorrow: 'Write the expected days between deliveries. Then watch last-seen. First two weeks stay advisory.',
    needs: 'Operator-approved cadence in days plus last-seen date. Receiving log, invoice, or approved exception resets last-seen.',
    sampleLabel: SAMPLE_LABEL,
    sampleDollars: 'none-verified',
    verifiedClose: false,
  },
  {
    slug: 'merchant-account',
    chipId: 'merchant',
    headline: 'A free terminal is a processing contract. This phone does not take a merchant account.',
    facts: [
      'Merchant chip names the processor and the paper, not a person.',
      'This preview does not process cards and does not replace the till. $0 verified — FICTIONAL / sample-not-verified.',
      'A promised rate without the agreement is Unverified, not a leak. A marketplace merchant-fee line is a statement job, not a new processor.',
    ],
    coachTomorrow:
      'Bring the merchant agreement and one processing statement for the same days. Do not switch processors from this preview.',
    needs:
      'Current merchant agreement or rate confirmation plus one processing statement. Missing paper is Missing Evidence.',
    sampleLabel: SAMPLE_LABEL,
    sampleDollars: 'none-verified',
    verifiedClose: false,
  },
];

export function getFreeOperatorAnswer(slug: string): FreeOperatorAnswer | null {
  return FREE_OPERATOR_ANSWERS.find((answer) => answer.slug === slug) ?? null;
}

export function chipForSlug(slug: string): (typeof FREE_OPERATOR_CHIPS)[number] | null {
  const answer = getFreeOperatorAnswer(slug);
  if (!answer) return null;
  return FREE_OPERATOR_CHIPS.find((chip) => chip.id === answer.chipId) ?? null;
}

const CHIP_HINTS: Record<FreeOperatorChipId, readonly string[]> = {
  foh: ['front of house', 'foh', 'void', 'till', 'comp', 'guest', 'cash drawer'],
  boh: ['back of house', 'boh', 'invoice', 'food cost', 'prep', 'count', 'cogs'],
  schedule: ['schedule', 'labor', 'hours', 'clock', 'overtime', 'shift'],
  vendor: ['vendor', 'silence', 'truck', 'cadence', 'delivery', 'sysco', 'us foods'],
  merchant: ['merchant', 'processing', 'card rate', 'interchange', 'terminal', 'free pos', 'merchant account', 'iso'],
};

export type ResolveAskResult =
  | { ok: true; slug: string; chipId: FreeOperatorChipId; inventedClose: false }
  | { ok: false; reason: string; needs: string; inventedClose: false };

function normalizeAsk(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function resolveFreeOperatorAsk(
  question: string,
  chipId?: FreeOperatorChipId | null,
): ResolveAskResult {
  const query = normalizeAsk(question);
  if (!query) {
    if (chipId && FREE_OPERATOR_CHIPS.some((chip) => chip.id === chipId)) {
      const chip = FREE_OPERATOR_CHIPS.find((row) => row.id === chipId)!;
      return { ok: true, slug: chip.answerSlug, chipId: chip.id, inventedClose: false };
    }
    return {
      ok: false,
      reason: 'Ask is empty. The mouth is ready. The close is not.',
      needs: 'Talk, type, or tap Front of house / Back of house / Schedule / Vendor / Merchant.',
      inventedClose: false,
    };
  }

  let best: { chipId: FreeOperatorChipId; slug: string; score: number } | null = null;
  for (const chip of FREE_OPERATOR_CHIPS) {
    let score = 0;
    for (const hint of CHIP_HINTS[chip.id]) {
      if (query.includes(hint)) score += hint.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { chipId: chip.id, slug: chip.answerSlug, score };
    }
  }

  if (!best) {
    return {
      ok: false,
      reason: 'This preview answers FOH, BOH, Schedule, Vendor, or Merchant. It does not invent a close or a dollar.',
      needs: 'Tap a chip or name voids, an invoice, the schedule, a vendor cadence, or the merchant paper.',
      inventedClose: false,
    };
  }

  return { ok: true, slug: best.slug, chipId: best.chipId, inventedClose: false };
}

const PRIVATE_HITS: readonly RegExp[] = [
  /\bkarlee\b/i,
  /\bsturtz\b/i,
  /\bashley\b/i,
  /\bholding\b/i,
  /\bkenzy\b/i,
  /\bpars?\b/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(pin|password|ssn)\b/i,
  /\$1,000\.00/,
  /\$1,070\.00/,
  /\$12\.00/,
  /Late Deliverys/i,
];

export function findFreeOperatorPrivacyHits(value: unknown): string[] {
  const text = JSON.stringify(value);
  return PRIVATE_HITS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

export function freeOperatorCorpus(): string {
  return JSON.stringify({
    chips: FREE_OPERATOR_CHIPS,
    mouth: FREE_OPERATOR_MOUTH,
    cards: BASE_WHAT_I_KNOW,
    answers: FREE_OPERATOR_ANSWERS,
    tray: OWNER_DESK_TRAY,
    primeCost: OWNER_PRIME_COST_EVIDENCE,
    preview: PUBLIC_PREVIEW_COPY,
    eod: OWNER_SEAT_EOD,
    sampleLabel: SAMPLE_LABEL,
  });
}
