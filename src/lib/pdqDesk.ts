/**
 * CTAP PDQ morning-pack desk answers.
 *
 * Honesty: Verified | Estimated | Missing only. Never invent $.
 * Large Pizzas ≠ Food even if Action Shift rolls them together. Combined food
 * bucket is Estimated and shows both Verified inputs. POS payouts stay
 * untrusted until a receipt match. Void_Promo negatives are line amounts
 * — not theft.
 * HARD LOCK: CTAP Seat 1 = PDQ POS only. Toast / NAG / Taco Bamba
 * on this seat is contaminant = Fail. Those dollars never answer CTAP.
 */

import { CTAP_TOAST_CONTAMINANT_SOURCE } from '@/lib/reportAdapters/sourceTags';
import {
  PDQ_PARSE_PREFIX,
  packFromPdqSourceTag,
  type PdqFactPack,
} from '@/lib/pdqEodParse';
import { pdqIngestLaneLabel } from '@/lib/pdqIngest';
import { pickPdqPackForDate, resolvePdqAskedDate, thinEodMissingFacts } from '@/lib/pdqThinEod';
import { isToastTrainingCorpusOnly } from '@/lib/reportAdapters/trainingCorpus';
import { detectToastFamily } from '@/lib/toastParse';
import type { SourceTag } from '@/lib/simpleOwnerDemo/types';

export type PdqDeskKind = 'sales' | 'food' | 'combined-food' | 'negatives' | 'hourly';

export type PdqSeatFacts = {
  packs: PdqFactPack[];
  hasPdq: boolean;
  heldOffNagToast: boolean;
  z: PdqFactPack | null;
  hourly: PdqFactPack | null;
  voids: PdqFactPack | null;
};

export type PdqDeskAnswer = {
  kind: PdqDeskKind;
  slug: string;
  headline: string;
  facts: string[];
  coachTomorrow: string;
  needs: string;
  sourceTags: SourceTag[];
  verifiedClose: boolean;
  sampleDollars: 'none-verified' | 'pdq-verified' | 'pdq-estimated';
};

const NAG_TOAST_RE = /kristin[\s._-]*nag|new american grill|max grill|taco[\s._-]*bomb/i;

export function isNagToastContaminant(filename: string, text = ''): boolean {
  const hay = `${filename}\n${text}`;
  if (isToastTrainingCorpusOnly(hay) || NAG_TOAST_RE.test(hay)) return true;
  return detectToastFamily(filename, text) != null;
}

export function collectPdqFacts(
  uploads: readonly { filename: string; sourceTags?: readonly SourceTag[] }[],
): PdqSeatFacts {
  const packs: PdqFactPack[] = [];
  let hasPdq = false;
  let heldOffNagToast = false;
  for (const upload of uploads) {
    if (isNagToastContaminant(upload.filename)) {
      heldOffNagToast = true;
      continue;
    }
    if (upload.filename && /zreport|hourly_sales|void_promo|\bpdq\b/i.test(upload.filename)) {
      hasPdq = true;
    }
    for (const tag of upload.sourceTags ?? []) {
      if (tag.source.startsWith('toast-parse:')) {
        heldOffNagToast = true;
        continue;
      }
      const pack = packFromPdqSourceTag(tag.source);
      if (!pack) continue;
      packs.push(pack);
      hasPdq = true;
    }
  }
  return {
    packs,
    hasPdq,
    heldOffNagToast,
    z: pickPdqPackForDate(packs, 'z-summary', null),
    hourly: pickPdqPackForDate(packs, 'hourly', null),
    voids: pickPdqPackForDate(packs, 'void-promo', null),
  };
}

export function routePdqDeskQuestion(question: string): PdqDeskKind | null {
  const q = question.toLowerCase().replace(/[^a-z0-9\s/%+-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return null;
  if (/compar(e|ison).*(community tap|ctap|nag|toast|pdq|taco bomba)/.test(q)) return null;
  if (/\bhourly\b|peak hour|hour sales/.test(q)) return 'hourly';
  if (/\bvoids?\b|promo|spec instruction|neg menu|neg special|uknown|unknown|discount/.test(q)) {
    return 'negatives';
  }
  if (
    /combined food|food bucket|food plus|food \+|# food and large pizza|food and large pizza/.test(q)
  ) {
    return 'combined-food';
  }
  if (/food today|\bfood\b|large pizza|menu category|beer\b|liquor\b|pop\b/.test(q)) return 'food';
  if (
    /\bpdq\b|z ?report|grand total|net sales|\bsales\b|yesterday|channel mix|mix\b/.test(q)
  ) {
    return 'sales';
  }
  return null;
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

function withContaminantTag(answer: PdqDeskAnswer, facts: PdqSeatFacts): PdqDeskAnswer {
  if (!facts.heldOffNagToast) return answer;
  if (answer.sourceTags.some((tag) => tag.source === CTAP_TOAST_CONTAMINANT_SOURCE)) return answer;
  return {
    ...answer,
    sourceTags: [
      ...answer.sourceTags,
      { tag: 'unverified', source: CTAP_TOAST_CONTAMINANT_SOURCE },
    ],
  };
}

function missingZ(
  kind: PdqDeskKind,
  facts: PdqSeatFacts,
  extra: string[],
  askedDate: string | null,
  hasVoids: boolean,
): PdqDeskAnswer {
  return {
    kind,
    slug: 'foh-voids',
    headline: 'Missing — no ZReport_Summary for that business date.',
    facts: [
      ...thinEodMissingFacts({ askedDate, hasVoids }),
      ...extra,
    ],
    coachTomorrow: 'Forward the pdqreports@pdqpos.com ZReport_Summary for the same store and business date.',
    needs: 'PDQ ZReport_Summary (native PDF) for the asked business date.',
    sourceTags: [{ tag: 'unverified', source: 'pdq-desk:z-summary:missing' }],
    verifiedClose: false,
    sampleDollars: 'none-verified',
  };
}

function verifiedMixLines(z: PdqFactPack): string[] {
  const rows: Array<[string, number | null]> = [
    ['Food', z.mix.food],
    ['Large Pizzas', z.mix.largePizzas],
    ['Pop', z.mix.pop],
    ['Liquor', z.mix.liquor],
    ['Beer', z.mix.beer],
    ['Wine', z.mix.wine],
  ];
  return rows.map(([label, value]) => (
    value != null
      ? `Verified · Menu Category · ${label} ${usd(value)}`
      : `Missing · Menu Category · ${label} is not on this Z. Not $0.`
  ));
}

function answerPdqDeskQuestionUnwrapped(
  question: string,
  facts: PdqSeatFacts,
  now: Date = new Date(),
): PdqDeskAnswer | null {
  const kind = routePdqDeskQuestion(question);
  if (!kind) return null;
  const askedDate = resolvePdqAskedDate(question, now);
  const z = pickPdqPackForDate(facts.packs, 'z-summary', askedDate);
  const hourly = pickPdqPackForDate(facts.packs, 'hourly', askedDate);
  const voids = pickPdqPackForDate(facts.packs, 'void-promo', askedDate);
  const scoped: PdqSeatFacts = { ...facts, z, hourly, voids };

  if (kind === 'hourly') {
    if (!hourly || !hourly.hourlyPeak) {
      return {
        kind,
        slug: 'foh-voids',
        headline: 'Missing — Hourly_Sales_Report is not on this seat for that business date.',
        facts: [
          'Hourly sales stay Missing. No peak hour invented.',
        ],
        coachTomorrow: 'Land Hourly_Sales_Report from the same pdqreports morning pack.',
        needs: 'PDQ Hourly_Sales_Report for the asked business date.',
        sourceTags: [{ tag: 'unverified', source: 'pdq-desk:hourly:missing' }],
        verifiedClose: false,
        sampleDollars: 'none-verified',
      };
    }
    return {
      kind,
      slug: 'foh-voids',
      headline: `Verified peak ${hourly.hourlyPeak.hour} ${usd(hourly.hourlyPeak.sales)}`,
      facts: [
        `Verified · ${hourly.filename} · ${formatDay(hourly.businessDate)} peak ${hourly.hourlyPeak.hour} ${usd(hourly.hourlyPeak.sales)}`,
        hourly.hourlyPeak.guests != null ? `Guests on that hour: ${hourly.hourlyPeak.guests}` : 'Guest count Missing on the peak row.',
        `${hourly.hourlyRowCount} hourly rows on the report.`,
      ],
      coachTomorrow: 'Keep Hourly with the same-date Z so mix and peak stay on one pack.',
      needs: 'Hourly_Sales_Report is on this seat.',
      sourceTags: [{ tag: 'verified', source: `pdq:hourly:${hourly.businessDate || hourly.filename}` }],
      verifiedClose: true,
      sampleDollars: 'pdq-verified',
    };
  }

  if (kind === 'negatives') {
    if (!voids || (voids.voids == null && voids.promotions == null && voids.negatives.promo == null
      && voids.negatives.specInstruction == null && voids.negatives.negMenu == null
      && voids.negatives.negSpecialInstruction == null && voids.negatives.unknown == null)) {
      return {
        kind,
        slug: 'foh-voids',
        headline: 'Missing — Void_Promo_Report is not on this seat for that business date.',
        facts: [
          'Voids / Spec Instruction / Neg Menu / Neg Special Instruction / Promo / UKNOWN stay Missing.',
          'No average. No theft narrative. No person named.',
        ],
        coachTomorrow: 'Land Void_Promo_Report from the same morning pack. I will quote labeled lines only.',
        needs: 'PDQ Void_Promo_Report (and Discount lines) for the asked business date.',
        sourceTags: [{ tag: 'unverified', source: 'pdq-desk:void-promo:missing' }],
        verifiedClose: false,
        sampleDollars: 'none-verified',
      };
    }
    const lines = [
      voids.voids != null ? `Verified · # Voids ${usd(voids.voids)}` : 'Missing · # Voids is not on Void_Promo.',
      voids.negatives.specInstruction != null
        ? `Verified · Spec Instruction ${usd(voids.negatives.specInstruction)}`
        : 'Missing · Spec Instruction is not on Void_Promo / Discount.',
      voids.negatives.negMenu != null
        ? `Verified · Neg Menu ${usd(voids.negatives.negMenu)}`
        : 'Missing · Neg Menu is not on Void_Promo / Discount.',
      voids.negatives.negSpecialInstruction != null
        ? `Verified · Neg Special Instruction ${usd(voids.negatives.negSpecialInstruction)}`
        : 'Missing · Neg Special Instruction is not on Void_Promo / Discount.',
      (voids.promotions ?? voids.negatives.promo) != null
        ? `Verified · Promo ${usd((voids.promotions ?? voids.negatives.promo)!)}`
        : 'Missing · Promo is not on Void_Promo / Discount.',
      voids.negatives.unknown != null
        ? `Verified · UKNOWN ${usd(voids.negatives.unknown)}`
        : 'Missing · UKNOWN / UNKNOWN is not on Void_Promo / Discount.',
    ];
    return {
      kind,
      slug: 'foh-voids',
      headline: voids.voids != null ? `Verified voids ${usd(voids.voids)}` : 'Verified Void_Promo negatives',
      facts: [
        `Verified · ${voids.filename} · ${formatDay(voids.businessDate)}`,
        ...lines,
        'Line amounts from Void_Promo + Discount. Pattern, not a verdict. No person named.',
      ],
      coachTomorrow: 'Review fat promo / spec lines on the same report. Do not invent a save.',
      needs: 'Void_Promo_Report is on this seat.',
      sourceTags: [{ tag: 'verified', source: `pdq:void-promo:${voids.businessDate || voids.filename}` }],
      verifiedClose: true,
      sampleDollars: 'pdq-verified',
    };
  }

  if (!z || (z.netSales == null && z.grandTotal == null && z.mix.food == null && z.mix.largePizzas == null)) {
    return missingZ(kind, scoped, [], askedDate, voids != null);
  }

  if (kind === 'combined-food') {
    const food = z.mix.food;
    const pizzas = z.mix.largePizzas;
    if (food == null || pizzas == null) {
      return {
        kind,
        slug: 'foh-voids',
        headline: 'Missing — cannot Estimate a combined food bucket without both Verified inputs.',
        facts: [
          food != null
            ? `Verified · Menu Category · Food ${usd(food)}`
            : 'Missing · Menu Category · Food is not on this Z.',
          pizzas != null
            ? `Verified · Menu Category · Large Pizzas ${usd(pizzas)}`
            : 'Missing · Menu Category · Large Pizzas is not on this Z.',
          'Large Pizzas ≠ Food even if Action Shift rolls them together. No silent merge. No invented combined total.',
        ],
        coachTomorrow: 'Need both Food and Large Pizzas Menu Category lines on the Z before an Estimated bucket.',
        needs: 'Both Menu Category · Food and Menu Category · Large Pizzas on ZReport_Summary.',
        sourceTags: [{ tag: 'unverified', source: 'pdq-desk:combined-food:missing' }],
        verifiedClose: false,
        sampleDollars: food != null || pizzas != null ? 'pdq-verified' : 'none-verified',
      };
    }
    const combined = Math.round((food + pizzas) * 100) / 100;
    return {
      kind,
      slug: 'foh-voids',
      headline: `Estimated combined food bucket ${usd(combined)}`,
      facts: [
        `Estimated · combined food bucket ${usd(combined)} = Verified Food ${usd(food)} + Verified Large Pizzas ${usd(pizzas)}.`,
        `Math: ${food} + ${pizzas} = ${combined}. Large Pizzas ≠ Food even if Action Shift rolls them together. Never silently merged.`,
        `Verified · ${z.filename} · ${formatDay(z.businessDate)}`,
      ],
      coachTomorrow: 'Keep quoting Large Pizzas on its own line unless you ask for the combined bucket.',
      needs: 'Z Menu Category Food + Large Pizzas are on this seat.',
      sourceTags: [
        { tag: 'verified', source: `pdq:z-summary:food:${z.businessDate || z.filename}` },
        { tag: 'verified', source: `pdq:z-summary:large-pizzas:${z.businessDate || z.filename}` },
        { tag: 'estimated', source: `pdq:z-summary:combined-food:${combined}` },
      ],
      verifiedClose: false,
      sampleDollars: 'pdq-estimated',
    };
  }

  const lane = `Ingest lane: ${pdqIngestLaneLabel(z.ingestLane)}.`;
  const secondaryFallback = z.ingestLane === 'secondary'
    ? 'Verified from secondary CC ZReport for the same morning. Primary had no Z for that date.'
    : null;

  if (kind === 'food') {
    const factsOut = [
      `Verified · ${z.filename} · ${formatDay(z.businessDate)}`,
      z.mix.food != null
        ? `Verified · Menu Category · Food ${usd(z.mix.food)}`
        : 'Missing · Menu Category · Food is not on this Z. Not $0.',
      z.mix.largePizzas != null
        ? `Verified · Menu Category · Large Pizzas ${usd(z.mix.largePizzas)} — separate line, not Food.`
        : 'Missing · Menu Category · Large Pizzas is not on this Z. Not $0.',
      'Default food today is the Food line alone. Large Pizzas ≠ Food even if Action Shift rolls them together. Combined Food+Large is Estimated only when you ask.',
      lane,
      ...(secondaryFallback ? [secondaryFallback] : []),
    ];
    return {
      kind,
      slug: 'foh-voids',
      headline: z.mix.food != null
        ? `Verified Food ${usd(z.mix.food)}`
        : 'Missing — Menu Category · Food is not on this Z.',
      facts: factsOut,
      coachTomorrow: 'Ask for the combined food bucket only if you want Food + Large Pizzas as Estimated.',
      needs: 'ZReport_Summary Menu Category · Food is on this seat.',
      sourceTags: [{ tag: 'verified', source: `pdq:z-summary:food:${z.businessDate || z.filename}` }],
      verifiedClose: z.mix.food != null,
      sampleDollars: z.mix.food != null ? 'pdq-verified' : 'none-verified',
    };
  }

  const channelLines: string[] = [
    ['Pickup', z.channels.pickup],
    ['Delivery', z.channels.delivery],
    ['Bar', z.channels.bar],
    ['Table', z.channels.table],
  ].map(([label, value]) => (
    value != null
      ? `Verified · Channel · ${label} ${usd(value as number)}`
      : `Missing · Channel · ${label} is not on this Z.`
  ));

  const voidLine = voids?.voids != null
    ? `Verified · Void_Promo # Voids ${usd(voids.voids)}`
    : 'Missing · voids stay Missing until Void_Promo_Report lands.';

  const factsOut = [
    `Verified · ${z.filename} · ${formatDay(z.businessDate)}`,
    z.grandTotal != null ? `Verified · Grand Total ${usd(z.grandTotal)}` : 'Missing · Grand Total is not on this Z.',
    z.netSales != null ? `Verified · Subtotal ${usd(z.netSales)}` : 'Missing · Subtotal is not on this Z.',
    voidLine,
    ...verifiedMixLines(z),
    ...channelLines,
    'Wave 0: net sales yesterday quotes Grand Total from the Z for that business date. Voids come from Void_Promo. Hard Missing if no same-date Z.',
    'POS payouts stay untrusted until a receipt match. A Z Pay Outs line is not verified cash-out.',
    lane,
    ...(secondaryFallback ? [secondaryFallback] : []),
  ];

  return {
    kind,
    slug: 'foh-voids',
    headline: z.grandTotal != null
      ? `Verified Grand Total ${usd(z.grandTotal)}`
      : z.netSales != null
        ? `Verified Subtotal ${usd(z.netSales)}`
        : 'Verified PDQ Menu Category lines',
    facts: factsOut,
    coachTomorrow: 'Keep Hourly and Void_Promo with the same-date Z. Secondary CC is often Z-only — primary inbox is the fuller pack.',
    needs: 'ZReport_Summary is on this seat.',
    sourceTags: [{ tag: 'verified', source: `pdq:z-summary:${z.businessDate || z.filename}` }],
    verifiedClose: true,
    sampleDollars: 'pdq-verified',
  };
}

export function answerPdqDeskQuestion(
  question: string,
  facts: PdqSeatFacts,
  now: Date = new Date(),
): PdqDeskAnswer | null {
  const answer = answerPdqDeskQuestionUnwrapped(question, facts, now);
  return answer ? withContaminantTag(answer, facts) : null;
}

export function isPdqParseDisplayTag(tag: SourceTag): boolean {
  return tag.source.startsWith(PDQ_PARSE_PREFIX);
}
