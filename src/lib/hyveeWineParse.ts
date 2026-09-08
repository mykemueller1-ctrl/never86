/**
 * Hy-Vee Wine & Spirits papers-in (CTAP liquor silo).
 *
 * Loop: order email ↔ yellow CUSTOMER CHARGE slips ↔ delivery invoice
 * ↔ Monday batch pay. Fort Dodge Hy-Vee Wine & Spirits.
 *
 * Labeled totals only. Missing paper stays Missing. Never invent $.
 * Never echo a customer account number in desk copy.
 * Humes and other beer houses are hooks only — not this parser.
 */

import type { SourceTag } from '@/lib/simpleOwnerDemo/types';

export const HYVEE_PARSE_PREFIX = 'hyvee-parse:v1:';

export const HYVEE_REPORT_FAMILIES = [
  'order-email',
  'charge-slip',
  'invoice',
  'monday-batch',
] as const;

export type HyveeFamily = (typeof HYVEE_REPORT_FAMILIES)[number];

export type HyveeFactPack = {
  pos: 'hy-vee';
  family: HyveeFamily;
  filename: string;
  vendor: 'Hy-Vee Wine & Spirits';
  location: 'Fort Dodge' | null;
  businessDate: string | null;
  invoiceNumber: string | null;
  labeledTotal: number | null;
  customerNumberOnPaper: boolean;
};

export type HyveeSeatFacts = {
  packs: HyveeFactPack[];
  hasHyvee: boolean;
  orderEmail: HyveeFactPack | null;
  chargeSlip: HyveeFactPack | null;
  invoice: HyveeFactPack | null;
  mondayBatch: HyveeFactPack | null;
  missingLegs: HyveeFamily[];
};

export type HyveeDeskKind = 'glue' | 'invoice' | 'order' | 'slip' | 'batch';

export type HyveeDeskAnswer = {
  kind: HyveeDeskKind;
  slug: string;
  headline: string;
  facts: string[];
  coachTomorrow: string;
  needs: string;
  sourceTags: SourceTag[];
  verifiedClose: boolean;
  sampleDollars: 'none-verified' | 'hyvee-verified' | 'hyvee-estimated';
};

const MONEY = /\$?\s*([\d,]+\.\d{2})/;

/** Vendor account pattern from the CoS field map. Detect only — never print. */
const CUSTOMER_ACCOUNT = /\b94016902\b/;

export function detectHyveeFamily(filename: string, text = ''): HyveeFamily | null {
  const hay = `${filename}\n${text}`.toLowerCase();
  const isHyvee =
    /hy[\s._-]*vee/.test(hay)
    || /winespiritsmgr@hy-vee/.test(hay)
    || /wine\s*&\s*spirits/.test(hay)
    || CUSTOMER_ACCOUNT.test(`${filename}\n${text}`);
  if (!isHyvee) return null;

  if (/monday[\s._-]*batch|batch[\s._-]*pay/.test(hay)) return 'monday-batch';
  if (/amount due|invoice\s*#|invoice date/.test(hay) && !/slip total/.test(hay)) return 'invoice';
  if (
    (/from:\s*winespiritsmgr@hy-vee|order[\s._-]*email|order total/.test(hay))
    && !/slip total/.test(hay)
  ) {
    return 'order-email';
  }
  if (/yellow[\s._-]*slip|charge[\s._-]*slip|slip total|(?:^|\n)\s*customer charge\b/.test(hay)) {
    return 'charge-slip';
  }
  if (/winespiritsmgr@hy-vee/.test(hay)) return 'order-email';
  return 'invoice';
}

function parseMoney(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const n = Number(String(raw).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function labeledTotal(text: string, labels: string[]): number | null {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:#-]?\\s*${MONEY.source}`, 'i');
    const m = text.match(re);
    const value = parseMoney(m?.[1]);
    if (value != null) return value;
  }
  return null;
}

function parseDate(text: string, filename: string): string | null {
  const labeled = text.match(
    /(?:order|slip|invoice|batch|business)\s*date\s*[:#]?\s*(\d{1,2})[/-](\d{1,2})[/-](\d{4})/i,
  );
  if (labeled) {
    const month = Number(labeled[1]);
    const day = Number(labeled[2]);
    const year = Number(labeled[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const file = filename.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\b/);
  if (!file) return null;
  const month = Number(file[1]);
  const day = Number(file[2]);
  const year = Number(file[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function invoiceNumber(text: string): string | null {
  const m = text.match(/invoice\s*(?:#|no\.|number)\s*[:#]?\s*([A-Z0-9][A-Z0-9._-]{2,})/i);
  return m?.[1] ?? null;
}

export function parseHyveeWineReport(text: string, filename: string): HyveeFactPack | null {
  const family = detectHyveeFamily(filename, text);
  if (!family) return null;
  const totalLabels =
    family === 'order-email'
      ? ['Order total', 'Order amount']
      : family === 'charge-slip'
        ? ['Slip total', 'Charge total', 'Customer charge']
        : family === 'monday-batch'
          ? ['Batch total', 'Pay total', 'Monday batch']
          : ['Amount Due', 'Invoice total', 'Grand Total', 'Total'];
  return {
    pos: 'hy-vee',
    family,
    filename,
    vendor: 'Hy-Vee Wine & Spirits',
    location: /fort\s*dodge/i.test(`${filename}\n${text}`) ? 'Fort Dodge' : null,
    businessDate: parseDate(text, filename),
    invoiceNumber: invoiceNumber(text),
    labeledTotal: labeledTotal(text, totalLabels),
    customerNumberOnPaper: CUSTOMER_ACCOUNT.test(text),
  };
}

export function hyveePackHasNumber(pack: HyveeFactPack): boolean {
  return pack.labeledTotal != null;
}

export function packFromHyveeSourceTag(source: string): HyveeFactPack | null {
  if (!source.startsWith(HYVEE_PARSE_PREFIX)) return null;
  try {
    const pack = JSON.parse(source.slice(HYVEE_PARSE_PREFIX.length)) as HyveeFactPack;
    return pack?.pos === 'hy-vee' ? pack : null;
  } catch {
    return null;
  }
}

export function collectHyveeFacts(
  uploads: readonly { filename: string; sourceTags?: readonly SourceTag[] }[],
): HyveeSeatFacts {
  const packs: HyveeFactPack[] = [];
  for (const upload of uploads) {
    for (const tag of upload.sourceTags ?? []) {
      const pack = packFromHyveeSourceTag(tag.source);
      if (pack) packs.push(pack);
    }
  }
  const pick = (family: HyveeFamily) =>
    packs.find((row) => row.family === family && row.labeledTotal != null)
    ?? packs.find((row) => row.family === family)
    ?? null;
  const orderEmail = pick('order-email');
  const chargeSlip = pick('charge-slip');
  const invoice = pick('invoice');
  const mondayBatch = pick('monday-batch');
  const missingLegs = HYVEE_REPORT_FAMILIES.filter((family) => !pick(family));
  return {
    packs,
    hasHyvee: packs.length > 0,
    orderEmail,
    chargeSlip,
    invoice,
    mondayBatch,
    missingLegs,
  };
}

export function routeHyveeDeskQuestion(question: string): HyveeDeskKind | null {
  const q = question.toLowerCase().replace(/[^a-z0-9\s/%-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return null;
  if (!/hy[\s-]*vee|winespirits|wine & spirits|yellow slip|customer charge|monday batch/.test(q)) {
    return null;
  }
  if (/monday batch|batch pay/.test(q)) return 'batch';
  if (/yellow slip|customer charge|charge slip/.test(q)) return 'slip';
  if (/order email|order/.test(q) && !/invoice/.test(q)) return 'order';
  if (/\binvoice\b/.test(q)) return 'invoice';
  return 'glue';
}

function usd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatDay(iso: string | null): string {
  if (!iso) return 'unlabeled date';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function lineFor(pack: HyveeFactPack | null, label: string): string {
  if (!pack) return `Missing · ${label} is not on this seat.`;
  if (pack.labeledTotal == null) {
    return `Missing · ${label} landed (${pack.filename}) but has no labeled total. No dollar invented.`;
  }
  return `Verified · ${label} · ${pack.filename} · ${formatDay(pack.businessDate)} ${usd(pack.labeledTotal)}`;
}

export function answerHyveeDeskQuestion(
  question: string,
  facts: HyveeSeatFacts,
): HyveeDeskAnswer | null {
  const kind = routeHyveeDeskQuestion(question);
  if (!kind) return null;

  const askedPack =
    kind === 'invoice'
      ? facts.invoice
      : kind === 'order'
        ? facts.orderEmail
        : kind === 'slip'
          ? facts.chargeSlip
          : kind === 'batch'
            ? facts.mondayBatch
            : null;

  if (kind !== 'glue' && (!askedPack || askedPack.labeledTotal == null)) {
    const need =
      kind === 'invoice'
        ? 'Hy-Vee delivery invoice with a labeled Amount Due'
        : kind === 'order'
          ? 'Hy-Vee order email with a labeled order total'
          : kind === 'slip'
            ? 'Yellow CUSTOMER CHARGE slip with a labeled slip total'
            : 'Monday batch-pay paper with a labeled batch total';
    return {
      kind,
      slug: 'boh-invoice',
      headline: `Missing — ${need} is not on this seat.`,
      facts: [
        `${need} stays Missing. No Hy-Vee total invented.`,
        'Loop is order email ↔ yellow CUSTOMER CHARGE slip ↔ delivery invoice ↔ Monday batch pay.',
        facts.hasHyvee
          ? 'Another Hy-Vee paper is on this seat. It is not the asked leg.'
          : 'No Hy-Vee Wine paper is stored for this seat.',
      ],
      coachTomorrow: `Drop the ${need}. I will quote the labeled total only.`,
      needs: need,
      sourceTags: [{ tag: 'unverified', source: `hyvee-desk:${kind}:missing` }],
      verifiedClose: false,
      sampleDollars: 'none-verified',
    };
  }

  const factsOut = [
    lineFor(facts.orderEmail, 'Order email'),
    lineFor(facts.chargeSlip, 'Yellow CUSTOMER CHARGE slip'),
    lineFor(facts.invoice, 'Delivery invoice'),
    lineFor(facts.mondayBatch, 'Monday batch pay'),
  ];
  factsOut.push('Customer account digits stay off the desk copy. Fort Dodge Hy-Vee Wine & Spirits only.');
  factsOut.push('Humes and other beer houses are not parsed on this path.');

  const labeled = [facts.orderEmail, facts.chargeSlip, facts.invoice, facts.mondayBatch]
    .map((row) => row?.labeledTotal)
    .filter((n): n is number => n != null);
  const unique = [...new Set(labeled)];
  let sampleDollars: HyveeDeskAnswer['sampleDollars'] = labeled.length ? 'hyvee-verified' : 'none-verified';
  let verifiedClose = labeled.length > 0 && (kind !== 'glue' || facts.missingLegs.length === 0);

  if (kind === 'glue') {
    if (facts.missingLegs.length) {
      factsOut.unshift(
        `Missing · required glue leg(s): ${facts.missingLegs.join(', ')}. No blended Hy-Vee total invented.`,
      );
      verifiedClose = false;
      if (!labeled.length) sampleDollars = 'none-verified';
    } else if (unique.length > 1) {
      factsOut.unshift(
        `Verified inputs do not agree (${unique.map(usd).join(' vs ')}). No blended total invented.`,
      );
      verifiedClose = false;
    } else if (unique.length === 1) {
      factsOut.unshift(
        `Verified · four-leg glue matches ${usd(unique[0])}. Order email ↔ slip ↔ invoice ↔ Monday batch.`,
      );
      verifiedClose = true;
    }
  }

  const headline = !labeled.length
    ? 'Missing — no labeled Hy-Vee total on this seat.'
    : kind === 'glue' && facts.missingLegs.length
      ? `Missing — Hy-Vee glue is incomplete (${facts.missingLegs.join(', ')}).`
      : kind === 'glue' && unique.length > 1
        ? 'Verified legs disagree. No blended Hy-Vee total.'
        : `Verified Hy-Vee ${kind === 'glue' ? 'glue' : kind} ${usd(askedPack?.labeledTotal ?? unique[0]!)}`;

  return {
    kind,
    slug: 'boh-invoice',
    headline,
    facts: factsOut,
    coachTomorrow: facts.missingLegs.length
      ? `Land the missing Hy-Vee leg(s): ${facts.missingLegs.join(', ')}. Do not type a total.`
      : 'Keep the four legs together so Monday batch can stay Verified.',
    needs: facts.missingLegs.length
      ? `Missing: ${facts.missingLegs.join(', ')}.`
      : 'Hy-Vee order email, yellow slip, delivery invoice, and Monday batch are on this seat.',
    sourceTags: [
      ...labeled.length
        ? [{ tag: 'verified' as const, source: `hy-vee:${kind}:${askedPack?.businessDate || 'seat'}` }]
        : [{ tag: 'unverified' as const, source: `hyvee-desk:${kind}:missing` }],
    ],
    verifiedClose,
    sampleDollars,
  };
}
