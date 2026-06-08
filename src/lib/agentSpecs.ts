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
    intro: 'Overtime drift per store ranked by hours, ghost shifts (clocked time with zero sales), schedule-vs-clocked gaps. The labor screen managers actually want at 5:30am.',
    catches: [
      'Overtime drift per store, ranked by hours',
      'Ghost shifts — clocked time, zero sales attached',
      'Schedule-vs-clocked gaps, per employee per week',
      'Labor % vs budget, per store, with drift bars',
    ],
    needs: 'Schedule + timesheet data from 7shifts / Toast Payroll / Square Team / similar.',
    output: 'Per-store labor scorecard · top OT offenders · ghost-shift list with the shift IDs.',
    sampleSignal: 'Lake Front · 14.2% labor (budget 11.5%) · 3 ghost shifts · top OT offender 17.4 hrs over schedule.',
    posSupport: '7shifts · Toast Payroll · Square Team · Homebase · When I Work',
  },
  {
    slug: 'tip-variance',
    name: 'Tip Variance',
    href: '/demo/tip-variance',
    tag: 'Tips',
    seat: 'CFO · Manager · Crew',
    headline: 'Service slipping shows up here first.',
    intro: 'Week-over-week tip movement per store and per name. Section vs server effects separated. The leading indicator the P&L misses by two weeks.',
    catches: [
      'Week-over-week tip movement per store',
      'Per-name tip drift — diagnostic for service quality',
      'Section vs server effects separated',
      'Leading indicator the P&L misses',
    ],
    needs: 'POS tip data — net tips per employee per shift / week.',
    output: 'Week-over-week trend per store · per-name leaderboard sorted by Δ.',
    sampleSignal: 'Server R. Patel · -18% WoW tip rate · same section last week +4% · coaching conversation set up.',
    posSupport: 'Toast · Square · Clover · Lightspeed · Aloha',
  },
  {
    slug: 'catering-leak',
    name: 'Catering Leak',
    href: '/demo/catering-leak',
    tag: 'Catering',
    seat: 'Chef · CFO · Owner',
    headline: "Where the order ran but the receipt didn't.",
    intro: 'Per-store catering economics — mix, contribution margin — and the invoice-vs-POS reconciliation gap. The off-prem orders that ran without a ticket.',
    catches: [
      'Per-store catering economics (mix, contribution margin)',
      'Invoice-vs-POS reconciliation gap',
      'Off-prem orders that ran without a ticket',
      'Per-customer concentration risk',
    ],
    needs: 'Catering invoices + POS catering category exports.',
    output: 'Per-store catering scorecard · the reconciliation gap dollar amount · top-customer concentration.',
    sampleSignal: 'Highway 7 · 7 catering orders in last month not in POS · $18,420 reconciliation gap.',
    posSupport: 'Toast · Square · Aloha · ezCater · CaterCow · invoice CSV',
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
