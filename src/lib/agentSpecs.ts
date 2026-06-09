// Agent specs · single source of truth for /agents and /agents/[slug].
// Used by the agents index, the dynamic [slug] route, and the MCP server.

export type AgentSpec = {
  slug: string;
  name: string;
  href: string; // The interactive demo URL
  tag: string;
  seat: string; // Who this is for
  headline: string;
  intro: string;
  catches: string[];
  needs: string;
  output: string;
  sampleSignal: string; // One-line example signal it surfaces
  posSupport: string;
  csvRunnable?: boolean; // true = has a CSV adapter wired to /trial today
};

export const AGENT_SPECS: AgentSpec[] = [
  {
    slug: 'void-hunter',
    name: 'Void Hunter',
    href: '/demo/void-hunter',
    tag: 'Voids',
    seat: 'COO · Owner',
    headline: 'One name above the peer band.',
    intro: 'Voids vs each store\'s own peer median, by store and by name. The pattern, not the verdict — the next step is a 5-minute review of the names flagged.',
    catches: [
      'Voids vs each store\'s own peer median (not industry benchmark)',
      'Per-store + per-name void rate, flagged if > 1.5× peer median',
      'Annualized excess-vs-peer dollar amount',
      'Pattern detection — not verdict',
    ],
    needs: 'Employee performance CSV (Toast / Square / Clover / PDQ) with Location, Employee, Net Sales, Void Amount columns. Or a live POS connection.',
    output: 'KPI strip · per-store table sorted by void rate · top-15 names sorted by void $.',
    sampleSignal: 'Mall Drive @ 3.36% void rate · 2.4× peer median · $14,840 annualized excess.',
    posSupport: 'Toast · Square · Clover · PDQ (CSV today) · Toast OAuth in approval',
    csvRunnable: true,
  },
  {
    slug: 'leak-detector',
    name: 'Leak Detector',
    href: '/trial',
    tag: '7 signals',
    seat: 'COO · CFO · Owner',
    headline: 'Seven theft signals, ticket-level.',
    intro: 'Seven ticket-level signals: void after payment, cash-only voiders, comp abuse, promo stacking, discount after close, day-of-week patterns, micro-comp pattern (modifier abuse proxy). Each name gets a composite risk score 0-100, sorted by severity.',
    catches: [
      'Void after payment — paid then voided. The classic skim.',
      'Cash-only voiders — ≥80% voids on cash tender, ≥5 voids total',
      'Comp abuse — above peer band or > 10% of own revenue comped',
      'Promo stacking — two or more discounts on a single ticket',
      'Discount after close — discount applied after ticket closed',
      'Day-of-week patterns — ≥40% of voids cluster on one weekday',
      'Micro-comp pattern — 10+ comps averaging under $5 each ("no charge add bacon")',
    ],
    needs: 'Ticket-level CSV (Toast Sales Detail / Square Transactions / Clover Reports) with Location, Employee, Ticket Total, Tender, Void/Comp/Discount columns. Optional Closed-At timestamp enables the day-of-week pattern detector.',
    output: 'Seven color-coded signal cards · top-20 employee table sorted by composite risk score (red ≥ 50, orange ≥ 20).',
    sampleSignal: 'James Wilson · 6 void-after-payment tickets · 100% cash tender · Tue 6/6 · risk score 83.',
    posSupport: 'Toast Sales Detail · Square Transactions · Clover Reports (CSV today)',
    csvRunnable: true,
  },
  {
    slug: '3p-fee-finder',
    name: '3P Fee Finder',
    href: '/demo/3p-fee-finder',
    tag: 'Delivery',
    seat: 'CFO · CEO',
    headline: 'Contract vs blended-effective, per partner.',
    intro: 'The gap between "DD takes 15%" and what DD is actually keeping. Per partner, per store. The renegotiation lever, named to the dollar.',
    catches: [
      'Contracted DD / UE / GH take rate vs what they actually keep',
      'DashPass-blended math: dd × (1 − share) + 0.14 × share',
      'Per-partner renegotiation lever, named to the dollar',
      'The $585K UE+GH lever for our design partner — sourced',
    ],
    needs: 'Per-partner 3P payout statements + your contracted rates.',
    output: 'Per-partner table showing contracted % · blended-effective % · annualized recovery surface if renegotiated to floor.',
    sampleSignal: 'UberEats contract 18% / blended-effective 19.4% · 1.4pp gap · $312K annualized.',
    posSupport: 'DoorDash · UberEats · GrubHub · ChowNow · Olo (payout statements)',
  },
  {
    slug: 'labor-leak',
    name: 'Labor Leak',
    href: '/demo/labor-leak',
    tag: 'Labor',
    seat: 'COO · Manager',
    headline: 'OT drift before payroll closes.',
    intro: 'Drop your timesheet export · we surface OT drift per employee, ghost shifts (≥60 min clocked with zero attached sales), early clock-ins (>5 min before scheduled start), late clock-outs (>15 min after scheduled end), and the dollar estimate of the drift at the OT rate. The labor screen managers actually want at 5:30am.',
    catches: [
      'Overtime drift per employee · ranked by minutes',
      'Ghost shifts · clocked ≥ 60 min with zero sales attached',
      'Early clock-ins · >5 min before scheduled start',
      'Late clock-outs · >15 min after scheduled end',
      'OT $ estimate · per-shift wage × 1.5, summed network-wide',
      'Schedule-vs-actual gap concentration by name',
    ],
    needs: 'Timesheet CSV with Location, Employee, Scheduled Start, Scheduled End, Clock In, Clock Out timestamps. Optional Net Sales (for ghost-shift detection), Wage Rate (for accurate $ drift; defaults to $15/hr).',
    output: 'KPI strip · per-employee table sorted by OT minutes · ghost-shift list with start times · total drift $ at OT rate.',
    sampleSignal: 'James Wilson · 4 early clock-ins · 85 min early · 297 min OT over 4 shifts · $89 drift.',
    posSupport: '7shifts · Toast Payroll · Square Team · Homebase · When I Work (CSV today)',
    csvRunnable: true,
  },
  {
    slug: 'tip-variance',
    name: 'Tip Variance',
    href: '/demo/tip-variance',
    tag: 'Tips',
    seat: 'CFO · Manager · Crew',
    headline: 'Service slipping shows up here first.',
    intro: 'Drop a weekly tips CSV. We compute each name\'s week-over-week tip-rate delta (tips / net sales, in percentage points), flag every server whose rate dropped >2pp on a base of >$50 in tips, and sort by severity. The leading indicator the P&L misses by two weeks.',
    catches: [
      'Per-name tip rate (tips / net sales) computed week-over-week',
      'Flag every server with WoW delta < −2pp on >$50 in tips',
      'Network WoW total delta · spot fleet-wide service drops',
      'Auto-buckets daily exports into ISO weeks',
    ],
    needs: 'Tip summary CSV with Location, Employee, Week-or-Date, Net Sales, Net Tips columns. Toast Payouts / Square Team tips / Lightspeed Shifts all work.',
    output: 'Network WoW % · per-employee table sorted by most-negative delta · prev-rate vs curr-rate vs delta (pp) vs prev-$ vs curr-$.',
    sampleSignal: 'Chris Foster · prev 19.7% / curr 10.3% / Δ −9.4pp · prev $2,540 / curr $1,320. Flagged.',
    posSupport: 'Toast · Square · Clover · Lightspeed · Aloha (CSV today)',
    csvRunnable: true,
  },
  {
    slug: 'catering-leak',
    name: 'Catering Leak',
    href: '/demo/catering-leak',
    tag: 'Catering',
    seat: 'Chef · CFO · Owner',
    headline: "Where the order ran but the receipt didn't.",
    intro: 'Drop your catering reconciliation CSV (one row per order with both Invoice Amount and POS Amount). We surface the per-store gap, the unmatched orders (invoice without a POS ticket), the flagged orders (gap >$50 AND >10% of invoice), and the top-15 customer concentration. Per-store, per-customer, per-order.',
    catches: [
      'Total reconciliation gap (invoice − POS) per store',
      'Unmatched orders · invoice > 0 with no POS match',
      'Flagged orders · gap > $50 AND > 10% of invoice',
      'Customer concentration · who owns the biggest piece of the leak',
      'Network gap ratio · gap / total catering invoice',
    ],
    needs: 'Catering CSV with Location, Customer, Invoice Amount, POS Amount columns. Optional Order ID + Event Date for the unmatched / flagged order list.',
    output: 'KPI strip · per-store table sorted by total gap · unmatched orders list · flagged orders list · top customer concentration.',
    sampleSignal: 'Sukup Manufacturing · 2 unmatched orders · $6,021 gap · 100% gap ratio.',
    posSupport: 'Toast · Square · Aloha · ezCater · CaterCow · invoice CSV',
    csvRunnable: true,
  },
  {
    slug: 'rate-card-audit',
    name: 'Rate Card Audit',
    href: '/demo/rate-card-audit',
    tag: '3P Rates',
    seat: 'CFO · CEO',
    headline: 'Where your DD/UE/GH rates sit vs peer band.',
    intro: 'Drop your contracted DD/UE/GH rates and see where you sit on the industry peer band (floor 10%, typical 18-20%, ceiling 30%). The "contract vs effective" gap is typically 1.2-2.8pp at multi-unit scale.',
    catches: [
      'Operator drops their contracted DD/UE/GH rates',
      'Industry peer band (floor 10%, typical 18-20%, ceiling 30%)',
      'Position bar showing where they sit on the axis',
      'The "contract vs effective" gap typically 1.2-2.8pp at multi-unit scale',
    ],
    needs: 'Just your contracted rates — no POS connection needed.',
    output: 'Verdict card with position bar · the lever amount · industry peer-band context.',
    sampleSignal: 'You\'re at DD 14% / UE 20% / GH 22% · peer median 18% · DD is your renegotiation lever.',
    posSupport: 'Operator self-report (no POS connection needed)',
  },
  {
    slug: 'beverage-score',
    name: 'Beverage Cost Score',
    href: '/trial',
    tag: 'BCS',
    seat: 'Owner · Chef · Bar Manager',
    headline: 'Pours vs inventory. One score 0-100.',
    intro: 'Drop your inventory close + POS pour data. We compute the per-store Beverage Cost Score (100 = perfect pour, 60 = roughly industry baseline, < 40 = pour-cost crisis). Per category — liquor / beer / wine / NA — so the conversation with your bar manager is specific.',
    catches: [
      'Per-store BCS 0-100 with severity coloring',
      'Per-category shrink · liquor · beer · wine · NA',
      'Revenue lost (shrink units × unit price)',
      'Network rollup score · sanity check across the fleet',
      'The free outreach hook · one CSV → one page handed back',
    ],
    needs: 'Beverage CSV with Location, Category, Consumed (inventory delta), Poured (from POS). Optional Unit Price for revenue-lost calculation.',
    output: 'KPI strip · per-store table with BCS score · per-category breakdown with shrink units + %.',
    sampleSignal: 'Highway 7 · BCS 66 · liquor shrink 25% · revenue lost $1,140/wk.',
    posSupport: 'Toast IQ · BevSpot · BarVision · Provi · inventory CSV',
    csvRunnable: true,
  },
  {
    slug: 'vendor-drift',
    name: 'Vendor Drift Detector',
    href: '/trial',
    tag: 'Drift',
    seat: 'Chef · CFO · Owner',
    headline: 'Silent price creep, caught.',
    intro: 'Drop a vendor invoice CSV (per-SKU, per-period). We compute the week-over-week / month-over-month price delta per SKU, flag every line that drifted > 5% upward, and rank by severity. The silent margin killer that the P&L never surfaces.',
    catches: [
      'Per-SKU price drift % vs prior period',
      'Flag every SKU with > 5% upward drift',
      'Per-vendor rollup · who is creeping the most',
      'Auto-buckets daily / weekly exports into months',
      'Dollar amount of network-wide upward drift',
    ],
    needs: 'Vendor invoice CSV with Vendor, SKU, Period (or Invoice Date), and Unit Price. Optional Category for category-level rollups.',
    output: 'Per-SKU table sorted by drift % · vendor rollup · total upward drift $.',
    sampleSignal: 'PFG · Olive Oil Pure 4/1 GAL · prev $68.40 / curr $79.20 · 15.8% drift.',
    posSupport: 'PFG · Sysco · US Foods · Northern Lights · Reinhart · Cheney Bros · invoice CSV',
    csvRunnable: true,
  },
  {
    slug: 'shift-pulse',
    name: 'Shift Pulse',
    href: '/demo/shift-pulse',
    tag: 'Shift',
    seat: 'Manager · Crew',
    headline: "Tonight's shift in one screen.",
    intro: 'Tonight\'s shift in one screen for the crew: pacing vs forecast, station median as the floor, tonight\'s goal, the streak count. Daily standup that actually helps.',
    catches: [
      'Covers vs forecast, live during service',
      'Station median, set as the floor',
      'Tonight\'s goal — the one number that matters',
      'Streak count — zero-comp shifts, voids under the line',
    ],
    needs: 'POS live feed + forecast input (or last 8-week average).',
    output: 'Single-screen crew view · pacing meter · the goal · the streak.',
    sampleSignal: 'Tonight pacing 104% of forecast · station median set · 4-shift zero-comp streak active.',
    posSupport: 'Toast · Square · Clover (live feed)',
  },
];

export const SOURCE_TAGS = [
  { v: 'Verified',   color: '#34c759', meaning: 'We can re-pull this from a primary source and defend it to the penny.' },
  { v: 'Estimated',  color: '#ff9500', meaning: 'Modeled from a benchmark or assumption. We name the assumption next to the number.' },
  { v: 'Unverified', color: '#ff453a', meaning: 'Source not wired yet. Number is illustrative — operator-only.' },
] as const;

export function getAgentSpec(slug: string): AgentSpec | undefined {
  return AGENT_SPECS.find((a) => a.slug === slug);
}
