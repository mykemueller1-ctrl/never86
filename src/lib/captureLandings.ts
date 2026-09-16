/**
 * Search-capture landings for One Seat (2026-09-16 queue).
 * Copy is locked to the spec. Do not invent dollars or savings claims.
 * Command Center stays a separate track.
 */

import { ISSUE_122_3P_SLUGS, WWW } from '@/lib/seoAeo';
import { LAST_WEEK_PRIME_BAND_MAX, LAST_WEEK_PRIME_BAND_MIN } from '@/lib/lastWeekPrimeCost';
import { ONE_SEAT_CLAIM, ONE_SEAT_ICP } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const CAPTURE_LANDING_LASTMOD = new Date('2026-09-16T18:00:00Z');

export const CAPTURE_LANDING_PATHS = {
  pos: '/restaurant-pos-alternative-toast-aloha-pdq',
  invoices: '/restaurant-invoice-price-increase-check',
  labor: '/restaurant-labor-cost-overtime-prime-cost',
  threeP: '/third-party-delivery-fee-truth',
} as const;

export const CAPTURE_LANDING_SLUGS = Object.values(CAPTURE_LANDING_PATHS);

export type CaptureRelatedLink = { href: string; label: string };

export type CaptureLandingSpec = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  geo: string;
  canonical: string;
};

export const POS_CAPTURE = {
  path: CAPTURE_LANDING_PATHS.pos,
  title: 'Restaurant POS alternative when Toast, Aloha, or PDQ still runs the floor',
  description:
    'Keep Toast, Aloha, or PDQ. Drop the export or paper you already have. Free One Seat for 1–5 unit independents — not a Toast replacement and not Command Center.',
  eyebrow: 'ONE SEAT · KEEP THE POS',
  geo: `You do not need to rip out Toast, Aloha, or PDQ to get a clear next move. Drop the export or paper you already have. Never86’d checks the evidence, labels Verified / Estimated / Missing, and names one action for tonight. This is not a contract-cancel service and not Command Center — free One Seat for ${ONE_SEAT_ICP}.`,
  canonical: `${WWW}${CAPTURE_LANDING_PATHS.pos}`,
  kill: [
    'Not a Toast replacement.',
    'Not a contract-cancel service.',
    'Not Command Center.',
  ],
  alreadyOnToast:
    'Already on Toast? Use the quieter export door — not the hero, not a rip-and-replace.',
  related: [
    { href: '/connect/toast', label: 'Already-on-Toast export door' },
    { href: '/connect/aloha', label: 'Aloha export notes' },
    { href: '/connect/pdq', label: 'PDQ export notes' },
    { href: '/product', label: 'What the operator OS does' },
    { href: ONE_SEAT_PATHS.trial, label: 'Free owner seat' },
  ] satisfies CaptureRelatedLink[],
} as const satisfies CaptureLandingSpec & {
  kill: readonly string[];
  alreadyOnToast: string;
  related: readonly CaptureRelatedLink[];
};

export const INVOICE_CAPTURE = {
  path: CAPTURE_LANDING_PATHS.invoices,
  title: 'Restaurant invoice price increase check — compare two invoices free',
  description:
    'Same vendor, SKU, and pack. Later invoice higher → show the delta. Matching papers = Verified; one invoice or unknown pack = Missing, not $0. Not MarginEdge. Not full COGS.',
  eyebrow: 'ONE SEAT · TWO-INVOICE CATCHER',
  geo: 'Same vendor, SKU, and pack. Later invoice higher → show the delta. Matching papers = Verified; one invoice or unknown pack = Missing, not $0. A price jump is not money recovered. Door: Two Invoice Catcher via /check/invoices + free owner seat. Not MarginEdge. Not full COGS.',
  canonical: `${WWW}${CAPTURE_LANDING_PATHS.invoices}`,
  kill: ['Not MarginEdge.', 'Not full COGS.', 'A price jump is not money recovered.'],
  related: [
    { href: ONE_SEAT_PATHS.checkInvoices, label: 'Two Invoice Catcher' },
    { href: ONE_SEAT_PATHS.try, label: 'Try the sample' },
    { href: ONE_SEAT_PATHS.onboard, label: 'Claim free owner seat' },
    { href: '/agents/vendor-drift', label: 'Vendor Drift agent' },
    { href: ONE_SEAT_PATHS.checkMenu, label: 'Check a plate after the price moves' },
  ] satisfies CaptureRelatedLink[],
} as const satisfies CaptureLandingSpec & {
  kill: readonly string[];
  related: readonly CaptureRelatedLink[];
};

export const LABOR_CAPTURE = {
  path: CAPTURE_LANDING_PATHS.labor,
  title: 'Restaurant labor cost and overtime — schedule vs clock, prime cost in view',
  description:
    'Compare the posted schedule with the matching time clock. A missing punch stays Missing, not zero. Prime-cost band is a target, not a guaranteed result.',
  eyebrow: 'ONE SEAT · LABOR DRIFT + PRIME COST',
  geo: 'Start by comparing the posted schedule with the matching time clock; a missing punch stays Missing, not zero. Then load sales, labor, food, and beverage records for the prime-cost view. Use the free One Seat to check the next shift before payroll closes.',
  canonical: `${WWW}${CAPTURE_LANDING_PATHS.labor}`,
  primeBandNote: `The ${LAST_WEEK_PRIME_BAND_MIN}–${LAST_WEEK_PRIME_BAND_MAX}% prime-cost band is a target, not a guaranteed result. We do not invent “you’ll hit ${LAST_WEEK_PRIME_BAND_MAX}%.” Incomplete week stays Open. Missing stays Missing.`,
  kill: [
    'Do not invent “you’ll hit 65%.”',
    'Show method + Missing gaps.',
    'Punch ≠ schedule.',
  ],
  related: [
    { href: ONE_SEAT_PATHS.checkLabor, label: 'Labor Drift Catcher' },
    { href: ONE_SEAT_PATHS.tryLabor, label: 'Try the labor sample' },
    { href: '/agents/labor-leak', label: 'Labor Leak agent' },
    { href: '/demo/labor-leak', label: 'Labor Leak demo' },
    { href: ONE_SEAT_PATHS.operator, label: 'Prime Cost Coach inputs' },
  ] satisfies CaptureRelatedLink[],
} as const satisfies CaptureLandingSpec & {
  primeBandNote: string;
  kill: readonly string[];
  related: readonly CaptureRelatedLink[];
};

export const THREE_P_CAPTURE = {
  path: CAPTURE_LANDING_PATHS.threeP,
  title: 'Third-party delivery fee truth — what did the statement actually cost?',
  description:
    'Commission is not total marketplace cost. Run the free 3P snapshot on /audit. A statement can prove observed cost and payout math, not a contract violation or guaranteed recovery.',
  eyebrow: '3P · GOOGLE DOOR',
  geo: 'Commission is not total marketplace cost. Separate commission, merchant fees, restaurant-funded promotions, refunds, errors, adjustments, and credits; compare expected with reported payout. A statement can prove observed cost and payout math, not a contract violation or guaranteed recovery.',
  canonical: `${WWW}/audit`,
  snapshotCta: 'Use the free 3P snapshot',
  relatedAnswers: [
    ...ISSUE_122_3P_SLUGS.map((slug) => `/answers/${slug}`),
    '/answers/review-doordash-error-charges',
    '/answers/first-30-minutes-of-a-marketplace-payout-investigation',
  ],
} as const satisfies CaptureLandingSpec & {
  snapshotCta: string;
  relatedAnswers: readonly string[];
};

export const CAPTURE_LANDINGS = [POS_CAPTURE, INVOICE_CAPTURE, LABOR_CAPTURE, THREE_P_CAPTURE] as const;

export const ONE_SEAT_STAYS_HOME = ONE_SEAT_CLAIM;

export function captureLandingCorpus(): string {
  return CAPTURE_LANDINGS.map((page) => [page.title, page.description, page.geo].join('\n')).join('\n');
}
