// 2026 operator-complaint benchmarks.
//
// Every row here is a *reference range*, not a verdict. Specialist skills in
// `src/skills/` read these to decide when a desk's own evidence-backed number
// (never invented) crosses into "worth flagging." A flag is a prompt to look,
// not an accusation. Missing Evidence stays Open regardless of what a
// benchmark says.
//
// No real client is named here. No store's actual numbers live in this file —
// only the 2026 industry reference ranges and their public sources.

export type BenchmarkTopic =
  | 'pos-fee-drag'
  | 'delivery-marketplace-skim'
  | 'labor-shortage'
  | 'cash-variance'
  | 'prime-cost-pressure'
  | 'comp-void-abuse';

export type BenchmarkSource = {
  title: string;
  url: string;
  note: string;
};

export type BenchmarkRow = {
  id: string;
  topic: BenchmarkTopic;
  metric: string;
  /** Human-readable reference range, e.g. "1–2% of sales". */
  referenceRange: string;
  /** Numeric bound used by a specialist skill to raise a flag, if any. */
  flagAbovePct: number | null;
  unit: 'pct-of-sales' | 'pct-of-order' | 'usd' | 'count' | 'ratio';
  summary: string;
  sources: BenchmarkSource[];
};

export const BENCHMARKS_2026_VERSION = '2026.1';

export const BENCHMARKS_2026: readonly BenchmarkRow[] = [
  {
    id: 'toast-effective-fee-load',
    topic: 'pos-fee-drag',
    metric: 'POS + processing + add-on effective monthly cost',
    referenceRange: '$300–$700/mo small operator, $1,000+/mo full-service once add-ons and processing stack',
    flagAbovePct: null,
    unit: 'usd',
    summary:
      'Headline "free" POS pricing rarely matches the real bill once card processing (2.49–2.99% + 15¢), proprietary hardware, and paid add-ons (online ordering, loyalty, payroll, inventory) are added. Operators report the true monthly total running 2–3x the advertised starter price.',
    sources: [
      { title: 'Toast Pricing Breakdown: Fees & Hidden Costs (2026)', url: 'https://www.upmenu.com/blog/toast-pricing/', note: 'Effective monthly cost range and add-on stacking.' },
      { title: 'Toast POS Pricing 2026: What Restaurants Actually Pay', url: 'https://www.deelo.ai/blog/toast-pos-pricing-2026', note: 'Processing rate and hardware lock-in.' },
      { title: 'Toast POS Problems & Complaints (2026)', url: 'https://www.sleftpayments.com/learning-hub/toast-pos-problems-complaints-2026', note: 'Contract lock-in and support complaints.' },
    ],
  },
  {
    id: 'toast-card-processing-rate',
    topic: 'pos-fee-drag',
    metric: 'Card processing rate, including tips',
    referenceRange: '2.49%–2.99% + $0.15 per transaction, charged on the full total including post-checkout tips',
    flagAbovePct: 2.99,
    unit: 'pct-of-order',
    summary: 'Processing is charged on the tip amount too, and the operator cannot route to an outside processor — the single largest recurring fee most operators underestimate.',
    sources: [
      { title: 'Toast POS: 4 Hidden Costs Beyond the Price Tag (2026)', url: 'https://costbench.com/software/restaurant-pos/toast-pos/hidden-costs/', note: 'Tip-inclusive processing and third-party processor lock-out.' },
    ],
  },
  {
    id: 'delivery-marketplace-commission',
    topic: 'delivery-marketplace-skim',
    metric: 'Third-party delivery marketplace commission',
    referenceRange: '15–30% of food subtotal, 6% pickup-only, effective all-in cost 30–40%+ once marketing/promo and processing are added',
    flagAbovePct: 30,
    unit: 'pct-of-order',
    summary:
      'The "dashtax": DoorDash/Uber Eats commission tiers plus payment processing (2.5–3%) and optional promoted-placement fees routinely push the effective take on a delivery order to 30–40% of the ticket, sometimes 35–48% once every add-on is counted. On a $50 order, $15+ leaves before food and packaging cost are even subtracted.',
    sources: [
      { title: 'Third-Party Delivery Fees in 2026: What DoorDash, Uber Eats & Grubhub Really Cost Restaurants', url: 'https://rezku.com/blog/third-party-delivery-fees-in-2026-what-doordash-uber-eats-grubhub-really-cost-restaurants/', note: 'Commission tiers and all-in effective rate.' },
      { title: 'The True Cost of DoorDash and Uber Eats Commissions in 2026', url: 'https://www.unplugdining.com/blog/the-true-cost-of-doordash-and-uber-eats-commissions-in-2026', note: 'Per-order profit after commission, packaging, and food cost.' },
      { title: 'Restaurant delivery commission statistics (2026)', url: 'https://zay-os.com/restaurant-delivery-commission-statistics', note: 'Commission benchmark ranges by tier.' },
    ],
  },
  {
    id: 'labor-turnover-rate',
    topic: 'labor-shortage',
    metric: 'Annual hourly turnover',
    referenceRange: '~92% full-service, ~110% limited-service',
    flagAbovePct: 100,
    unit: 'pct-of-sales',
    summary:
      'Turnover at or above 100% (limited-service) means the average line-level seat turns over more than once a year. Combined with a ~$5,864 average replacement cost per worker, staffing churn is now a prime-cost line, not a footnote.',
    sources: [
      { title: 'Restaurant Turnover Rate 2026: BLS Data & Labor Costs', url: 'https://www.duck-hub.com/blog/restaurant-labor-turnover-statistics', note: 'Turnover rate and replacement cost.' },
      { title: 'The Restaurant Labor Crisis in 2026', url: 'https://www.aihostess.co/blog/restaurant-labor-shortage-solutions', note: 'Turnover and hiring-difficulty rates.' },
    ],
  },
  {
    id: 'labor-hiring-difficulty',
    topic: 'labor-shortage',
    metric: 'Operators reporting difficulty hiring / unfilled roles',
    referenceRange: '~70% report difficulty hiring, ~38% left a position unfilled in the last year',
    flagAbovePct: null,
    unit: 'pct-of-sales',
    summary: 'Roughly a third of operators run short-staffed for a meaningful stretch, which shows up downstream as cut hours, trimmed menus, and slower service before it ever shows up as a labor-dollar number.',
    sources: [
      { title: 'Restaurant Labor Shortage Statistics | 2026 Sourced Report', url: 'https://worldmetrics.org/restaurant-labor-shortage-statistics/', note: 'Hiring difficulty, unfilled positions, operational impact.' },
    ],
  },
  {
    id: 'cash-shrinkage-internal-share',
    topic: 'cash-variance',
    metric: 'Share of shrinkage attributable to internal (employee) causes',
    referenceRange: '~75–90% of detected loss is internal, not external theft',
    flagAbovePct: null,
    unit: 'pct-of-sales',
    summary:
      'Cash variance is the highest-signal early indicator available at close — most loss is internal, and detection commonly lags 12–18 months without a daily till-count discipline. A small, consistent daily shortage (e.g. $10/day) compounds to real annual dollars per till.',
    sources: [
      { title: 'Cash Register Shortages: 7 Numbers Behind the Till', url: 'https://happychef.cloud/en/blog/finance/cash-register-shortages-restaurant.html', note: 'Detection lag and daily-shortage compounding.' },
      { title: 'Restaurant Employee Theft Statistics', url: 'https://www.restroworks.com/blog/restaurant-employee-theft-statistics/', note: 'Internal vs external loss share, detection method mix.' },
    ],
  },
  {
    id: 'cash-shrinkage-pct-of-sales',
    topic: 'cash-variance',
    metric: 'Shrinkage as a share of total sales',
    referenceRange: '~1.6% of total sales from internal-theft-linked shrinkage',
    flagAbovePct: 1.6,
    unit: 'pct-of-sales',
    summary: 'A useful outer bound for a single-store daily/weekly cash-variance flag — not a target, and not proof of theft on its own. Register skimming alone accounts for roughly 45% of detected internal-theft incidents in food-and-retail settings.',
    sources: [
      { title: 'Retail Employee Theft Statistics | 2026 Sourced Report', url: 'https://gitnux.org/retail-employee-theft-statistics/', note: 'Shrinkage percent of sales and skimming share of incidents.' },
    ],
  },
  {
    id: 'prime-cost-full-service',
    topic: 'prime-cost-pressure',
    metric: 'Prime cost (COGS + total labor) as a share of sales',
    referenceRange: '60–65% full-service, 55–60% fast-casual/QSR',
    flagAbovePct: 65,
    unit: 'pct-of-sales',
    summary: 'Food and labor costs have each risen roughly 35% over 2021–2026, compressing the room a restaurant has above prime cost for rent, utilities, and margin. Weekly (not monthly) prime-cost review is the 2026-recommended cadence given how fast either half can drift.',
    sources: [
      { title: 'Restaurant Prime Cost: What\u2019s a Good Benchmark and How to Hit It (2026)', url: 'https://restaurantinventorytools.com/what-is-prime-cost-in-a-restaurant-2026/', note: 'Prime-cost benchmark bands by segment.' },
      { title: 'Restaurant Prime Cost 2026: Definition & Benchmarks', url: 'https://www.novatab.com/blog/restaurant-prime-cost', note: '5-year food/labor cost inflation trend.' },
    ],
  },
  {
    id: 'comp-void-revenue-leak',
    topic: 'comp-void-abuse',
    metric: 'Voids + comps + discounts as a share of total sales',
    referenceRange: '2–4% of revenue on average; best-practice ceiling is 1–2% before investigation',
    flagAbovePct: 2,
    unit: 'pct-of-sales',
    summary:
      'Uncontrolled voids/comps/discounts leak 2–4% of revenue industry-wide; disciplined operators hold each under 1–2% and treat anything above that as a prompt to review reason codes and manager approvals, not an automatic theft verdict. Register-disbursement fraud (voids/refunds) accounts for roughly 6% of occupational-fraud cases in food service.',
    sources: [
      { title: 'Restaurant Employee Theft - Voids & Comps', url: 'https://blog.mirus.com/restaurant-employee-theft-voids-comps', note: 'Revenue leak range and best-practice ceiling.' },
      { title: 'Voids and refunds are 6% of restaurant fraud cases', url: 'https://www.katalystos.com/blog/employee-theft-and-pos-fraud-in-restaurants', note: 'Register disbursement share of occupational fraud.' },
      { title: 'Restaurant POS Security: How to Protect Your Business (2026)', url: 'https://www.bpapos.com/blog/post/2026/07/23/restaurant-pos-security-fraud-theft', note: 'Reason codes, manager approval, and exception-report controls.' },
    ],
  },
] as const;

export function getBenchmarksForTopic(topic: BenchmarkTopic): readonly BenchmarkRow[] {
  return BENCHMARKS_2026.filter((row) => row.topic === topic);
}

export function getBenchmark(id: string): BenchmarkRow | undefined {
  return BENCHMARKS_2026.find((row) => row.id === id);
}

export function listBenchmarkSources(): BenchmarkSource[] {
  const seen = new Map<string, BenchmarkSource>();
  for (const row of BENCHMARKS_2026) {
    for (const source of row.sources) {
      seen.set(source.url, source);
    }
  }
  return [...seen.values()];
}
