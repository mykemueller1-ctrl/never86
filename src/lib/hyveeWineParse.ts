/**
 * Hy-Vee Wine & Spirits papers-in (CTAP liquor silo).
 *
 * Loop: order email ↔ yellow CUSTOMER CHARGE slips ↔ delivery invoice.
 * Monday = one check covering that week’s slips + invoice batch.
 *
 * Invoice OCR alone → Verified delivered $ / what got.
 * Without email and/or yellow slip → Missing order-match / slip recon.
 * Unclear Monday pay pattern → Missing (no partials).
 * Wave 0b: OCR into the mess, not AP / 30-60-90.
 * Bar-manager email path. Seat 2 / BOH / PFG day-before is not required.
 * Humes is a later wave — not this path.
 *
 * Labeled totals only. Never invent $. Never echo a customer account
 * number in desk copy. Humes and other beer houses are hooks only.
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

  if (/monday[\s._-]*(batch|check)|one check|batch[\s._-]*pay/.test(hay)) return 'monday-batch';
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
          ? ['Check total', 'One check', 'Monday check', 'Batch total', 'Pay total', 'Monday batch']
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
  if (!/hy[\s-]*vee|winespirits|wine & spirits|yellow slip|customer charge|monday batch|monday check|one check/.test(q)) {
    return null;
  }
  if (/30\s*\/?\s*60|payables|\bap\b|aging/.test(q)) return 'glue';
  if (/monday batch|monday check|one check|batch pay/.test(q)) return 'batch';
  if (/order[- ]match|match the order|reconcil/.test(q)) return 'glue';
  if (/yellow slip|customer charge|charge slip/.test(q) && !/invoice/.test(q)) return 'slip';
  if (/order email|order/.test(q) && !/invoice|delivered|what got/.test(q)) return 'order';
  if (/\binvoice\b|delivered|what got/.test(q)) return 'invoice';
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

const NOT_AP = 'Wave 0b: Hy-Vee coach OCR into the mess (order email, yellow slip, delivery invoice). Not AP / 30-60-90.';

/** Myke-confirmed. Not a default guess. Dollar still needs a labeled check total. */
export const HYVEE_MONDAY_PAY_LOCK =
  'Verified · Monday lock: one check covers that week’s yellow slips + delivery invoice batch.';

export function answerHyveeDeskQuestion(
  question: string,
  facts: HyveeSeatFacts,
): HyveeDeskAnswer | null {
  const kind = routeHyveeDeskQuestion(question);
  if (!kind) return null;

  const q = question.toLowerCase();
  if (/30\s*\/?\s*60|payables|\bap\b|aging/.test(q)) {
    return {
      kind: 'glue',
      slug: 'boh-invoice',
      headline: 'Missing — Hy-Vee is OCR into the mess, not AP.',
      facts: [
        NOT_AP,
        'No payable aging invented from a wine invoice.',
        lineFor(facts.invoice, 'Delivery invoice (delivered $ / what got)'),
        lineFor(facts.orderEmail, 'Order email'),
        lineFor(facts.chargeSlip, 'Yellow CUSTOMER CHARGE slip'),
      ],
      coachTomorrow: 'Snap or forward the order email, yellow slip, and delivery invoice. Do not drop an AP export.',
      needs: 'Hy-Vee order / slip / invoice papers — not an AP aging.',
      sourceTags: [{ tag: 'unverified', source: 'hyvee-desk:not-ap' }],
      verifiedClose: false,
      sampleDollars: 'none-verified',
    };
  }

  const delivered = facts.invoice?.labeledTotal ?? null;
  const hasOrder = facts.orderEmail?.labeledTotal != null;
  const hasSlip = facts.chargeSlip?.labeledTotal != null;
  const monday = facts.mondayBatch;
  const mondayClear = monday?.labeledTotal != null;
  const threePresent = delivered != null && hasOrder && hasSlip;

  const matchLines = [
    delivered != null
      ? `Verified · delivered $ / what got · ${facts.invoice!.filename} ${usd(delivered)}`
      : 'Missing · delivery invoice is not on this seat. No delivered $ invented.',
    hasOrder
      ? lineFor(facts.orderEmail, 'Order email')
      : 'Missing · order-match stays Missing without the order email.',
    hasSlip
      ? lineFor(facts.chargeSlip, 'Yellow CUSTOMER CHARGE slip')
      : 'Missing · slip reconciliation stays Missing without the yellow CUSTOMER CHARGE slip.',
    HYVEE_MONDAY_PAY_LOCK,
    mondayClear
      ? `Verified · Monday one check ${usd(monday!.labeledTotal!)} (labeled check total).`
      : 'Missing · Monday check total is not on this seat. No partial invented from invoices or slips.',
    'Prefer all three papers (email, yellow slip, invoice) when present. Invoice OCR alone is only delivered $ / what got.',
    NOT_AP,
    'Customer account digits stay off the desk copy. Humes is not on this path.',
  ];

  if (kind === 'invoice') {
    if (delivered == null) {
      return {
        kind,
        slug: 'boh-invoice',
        headline: 'Missing — Hy-Vee delivery invoice is not on this seat.',
        facts: [
          'Delivered $ / what got stays Missing until invoice OCR lands.',
          ...matchLines,
        ],
        coachTomorrow: 'OCR the delivery invoice. That is delivered $, not an order-match and not AP.',
        needs: 'Hy-Vee delivery invoice with a labeled Amount Due.',
        sourceTags: [{ tag: 'unverified', source: 'hyvee-desk:invoice:missing' }],
        verifiedClose: false,
        sampleDollars: 'none-verified',
      };
    }
    return {
      kind,
      slug: 'boh-invoice',
      headline: `Verified delivered ${usd(delivered)}`,
      facts: matchLines,
      coachTomorrow: (!hasOrder || !hasSlip)
        ? 'Land the order email and yellow slip to move order-match / slip recon from Missing to Verified.'
        : 'Keep the three papers together. Monday lock is one check for the week — do not invent a partial.',
      needs: threePresent
        ? 'Invoice + order email + yellow slip are on this seat.'
        : 'Invoice is on this seat. Order-match / slip recon still Missing without email and/or yellow slip.',
      sourceTags: [{ tag: 'verified', source: `hy-vee:invoice:${facts.invoice?.businessDate || 'seat'}` }],
      verifiedClose: true,
      sampleDollars: 'hyvee-verified',
    };
  }

  if (kind === 'order' && !hasOrder) {
    return {
      kind,
      slug: 'boh-invoice',
      headline: 'Missing — Hy-Vee order email is not on this seat.',
      facts: ['Order-match stays Missing without the order email. Invoice OCR is not an order.', ...matchLines],
      coachTomorrow: 'Forward the winespiritsmgr order email. OCR the mess, not AP.',
      needs: 'Hy-Vee order email with a labeled order total.',
      sourceTags: [{ tag: 'unverified', source: 'hyvee-desk:order:missing' }],
      verifiedClose: false,
      sampleDollars: 'none-verified',
    };
  }

  if (kind === 'slip' && !hasSlip) {
    return {
      kind,
      slug: 'boh-invoice',
      headline: 'Missing — yellow CUSTOMER CHARGE slip is not on this seat.',
      facts: ['Slip reconciliation stays Missing without the yellow slip.', ...matchLines],
      coachTomorrow: 'Snap the yellow CUSTOMER CHARGE slip. OCR the mess, not AP.',
      needs: 'Yellow CUSTOMER CHARGE slip with a labeled slip total.',
      sourceTags: [{ tag: 'unverified', source: 'hyvee-desk:slip:missing' }],
      verifiedClose: false,
      sampleDollars: 'none-verified',
    };
  }

  if (kind === 'batch') {
    if (!mondayClear) {
      return {
        kind,
        slug: 'boh-invoice',
        headline: 'Verified Monday lock — check total Missing',
        facts: [
          HYVEE_MONDAY_PAY_LOCK,
          'Missing · Monday check total is not on this seat. No partial invented from invoices or slips.',
          ...matchLines,
        ],
        coachTomorrow: 'Land the Monday one-check paper with a labeled check total. Do not type a pay from invoices.',
        needs: 'Monday one-check paper with a labeled check total.',
        sourceTags: [
          { tag: 'verified', source: 'hyvee-desk:monday:lock' },
          { tag: 'unverified', source: 'hyvee-desk:monday:amount-missing' },
        ],
        verifiedClose: false,
        sampleDollars: 'none-verified',
      };
    }
    return {
      kind,
      slug: 'boh-invoice',
      headline: `Verified Monday one check ${usd(monday!.labeledTotal!)}`,
      facts: matchLines,
      coachTomorrow: 'One check covers the week. Do not split it into invented daily pay.',
      needs: 'Monday one-check paper is on this seat.',
      sourceTags: [{ tag: 'verified', source: `hy-vee:monday:${monday?.businessDate || 'seat'}` }],
      verifiedClose: true,
      sampleDollars: 'hyvee-verified',
    };
  }

  const paperTotals = [facts.orderEmail?.labeledTotal, facts.chargeSlip?.labeledTotal, delivered]
    .filter((n): n is number => n != null);
  const unique = [...new Set(paperTotals)];
  const canMatch = delivered != null && hasOrder && hasSlip;

  if (!canMatch) {
    return {
      kind: 'glue',
      slug: 'boh-invoice',
      headline: delivered != null
        ? `Verified delivered ${usd(delivered)} — order-match / slip recon Missing`
        : 'Missing — Hy-Vee glue is incomplete.',
      facts: [
        'Prefer all three papers when present. Without email and/or yellow slip, order-match / slip reconciliation stays Missing.',
        ...matchLines,
      ],
      coachTomorrow: 'OCR the missing order email and/or yellow slip. Not AP.',
      needs: 'Order email + yellow slip + delivery invoice for a Verified match.',
      sourceTags: delivered != null
        ? [{ tag: 'verified', source: `hy-vee:invoice:${facts.invoice?.businessDate || 'seat'}` }]
        : [{ tag: 'unverified', source: 'hyvee-desk:glue:missing' }],
      verifiedClose: false,
      sampleDollars: delivered != null ? 'hyvee-verified' : 'none-verified',
    };
  }

  if (unique.length > 1) {
    return {
      kind: 'glue',
      slug: 'boh-invoice',
      headline: 'Verified inputs do not agree. No blended Hy-Vee total.',
      facts: [
        `Verified papers disagree (${unique.map(usd).join(' vs ')}). No blended total invented.`,
        ...matchLines,
      ],
      coachTomorrow: 'Keep each labeled total. Do not average them.',
      needs: 'Three papers are on this seat and do not agree.',
      sourceTags: [{ tag: 'verified', source: `hy-vee:glue:${facts.invoice?.businessDate || 'seat'}` }],
      verifiedClose: false,
      sampleDollars: 'hyvee-verified',
    };
  }

  return {
    kind: 'glue',
    slug: 'boh-invoice',
    headline: `Verified Hy-Vee three-paper glue ${usd(unique[0]!)}`,
    facts: [
      `Verified · order email ↔ yellow slip ↔ delivery invoice match ${usd(unique[0]!)}.`,
      ...matchLines,
    ],
    coachTomorrow: mondayClear
      ? 'Three papers match. Monday stays one check for the week.'
      : 'Three papers match. Monday one-check is still Missing — do not invent a pay.',
    needs: 'Order email, yellow slip, and delivery invoice are on this seat.',
    sourceTags: [{ tag: 'verified', source: `hy-vee:glue:${facts.invoice?.businessDate || 'seat'}` }],
    verifiedClose: true,
    sampleDollars: 'hyvee-verified',
  };
}
