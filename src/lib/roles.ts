// Role spec for /for/[role] pages. One per audience.
// "Show enough they love it. Never show how we do it."

export type DemoLink = { name: string; line: string; href: string };

export type RoleSpec = {
  slug: string;
  audience: string; // header chip text
  badge: string; // short tag for cards
  oneWord: string; // single-word card descriptor for /for grid
  subhead: string; // single sentence under H1 on the role page
  tone: 'gold' | 'copper' | 'mixed';
  headline: { l1: string; gradient: string; l3: string };
  intro: string;
  pains: string[];
  reliefs: string[];
  freeAgents: DemoLink[]; // 3 demos this role can try right now, no login
  answers: { slug: string; t: string }[];
  bookCtaLine: string;
};

export const ROLES: Record<string, RoleSpec> = {
  ceo: {
    slug: 'ceo',
    oneWord: 'Network',
    subhead: 'One screen ranked by what costs you money this week.',
    audience: 'For CEOs · multi-unit operators · 5 to 50 units',
    badge: 'CEO',
    tone: 'gold',
    headline: { l1: 'Network performance,', gradient: 'reconciled to the cent.', l3: 'No black boxes. No back-office bottlenecks.' },
    intro: 'You sign the check. We hand you one screen ranked by what costs you money this week — every figure source-tagged so you know which fights to pick and which to let go.',
    pains: [
      'You ask "how did we do this period" and get three answers from three teams.',
      'Your "best store" by revenue might be your worst by margin. You don\'t know which.',
      'The board deck takes a week to build and a quarter to defend. Numbers shift between meetings.',
      'Every consultant pitches "you\'re leaving $X on the table" — and none of them can defend $X.',
    ],
    reliefs: [
      'Network reconciled-to-the-cent. $15.72M across 545,677 orders for our 16-unit design partner.',
      'One screen per role on your team — they see what they need, you see the rollup.',
      'Every figure tagged Verified / Estimated / Unverified. When we\'re wrong we walk the number back in public.',
      'Per-store, per-channel, per-employee leaks with names attached — coachable, not punitive.',
    ],
    freeAgents: [
      { name: 'Void Hunter', line: 'Voids vs each store\'s own peer median. The pattern, not the verdict.', href: '/demo/void-hunter' },
      { name: '3P Fee Finder', line: 'Per-partner contract vs blended-effective rate. The renegotiation lever, named.', href: '/demo/3p-fee-finder' },
      { name: 'Catering Leak', line: 'Per-store catering economics + invoice-vs-POS reconciliation gap.', href: '/demo/catering-leak' },
    ],
    answers: [
      { slug: 'walked-the-number-back', t: 'How we caught $31M and walked it back to $15.7M' },
      { slug: 'doordash-blended-rate-dashpass', t: 'Why your DoorDash 10% blends to 11.2%' },
      { slug: 'catering-economics-multi-unit', t: 'How catering economics break for multi-unit operators' },
    ],
    bookCtaLine: '15 minutes. Bring one store\'s last month. We\'ll show the leak before the call ends.',
  },

  cfo: {
    slug: 'cfo',
    oneWord: 'Books',
    subhead: 'Books that close to the penny. Every figure on the board doc, labeled and defensible.',
    audience: 'For CFOs · finance leaders · controllers · 5 to 50 units',
    badge: 'CFO',
    tone: 'gold',
    headline: { l1: 'Books that close', gradient: 'to the penny.', l3: 'Without the month-end death march.' },
    intro: 'Every dollar your restaurants move, read and reconciled across the chain. Every figure tagged Verified, Estimated, or Unverified — so you walk into the board meeting knowing which numbers to defend and which to flag.',
    pains: [
      'The POS export says $72M. The dining-options export says $53M. The sales-category export says $15.7M. Which one\'s right?',
      'You spend three days a month reconciling 3P payouts against the deposit ledger.',
      'Your food-cost % drifts 4 points week-over-week and nobody can explain it.',
      'Banking covenants want trailing-twelve net. Each store reports it differently.',
    ],
    reliefs: [
      'De-duplicated leaf-channel net sales — the rule that caught $31M and walked it back to $15.7M for our design partner.',
      'Per-partner 3P take rate (DD 10% / UE 18% / GH 18% confirmed for our design partner) vs blended-effective.',
      'Source-tag discipline on every figure that hits a board doc.',
      'When the model is wrong we publish the correction. No vendor in this industry does that.',
    ],
    freeAgents: [
      { name: '3P Fee Finder', line: 'Per-partner contract vs blended-effective, store by store. Plus the $585K UE+GH renegotiation lever.', href: '/demo/3p-fee-finder' },
      { name: 'Catering Leak', line: 'Catering net vs invoiced — the off-prem reconciliation gap.', href: '/demo/catering-leak' },
      { name: 'Tip Variance', line: 'Week-over-week tip movement. The leading indicator the P&L misses.', href: '/demo/tip-variance' },
    ],
    answers: [
      { slug: 'doordash-blended-rate-dashpass', t: 'Why your DoorDash 10% blends to 11.2%' },
      { slug: 'renegotiate-ue-gh-to-dd', t: 'How to renegotiate Uber Eats and GrubHub to the DoorDash rate' },
      { slug: 'walked-the-number-back', t: 'How we caught $31M and walked it back to $15.7M' },
    ],
    bookCtaLine: '15 minutes. Bring last month\'s 3P payout statements. We\'ll show the contract-vs-effective gap live.',
  },

  coo: {
    slug: 'coo',
    oneWord: 'Drift',
    subhead: 'Labor leak before payroll posts. Voids named, ranked, coachable.',
    audience: 'For COOs · VPs of Ops · directors of operations · 5 to 50 units',
    badge: 'COO',
    tone: 'copper',
    headline: { l1: 'Operational drift,', gradient: 'named and ranked.', l3: 'Before payroll closes the door.' },
    intro: 'Labor leak before payroll posts. Void patterns that flag a coaching conversation, not a verdict. Per-store scorecards your DMs actually open. The ops view a COO actually wants to see at 6:30am.',
    pains: [
      'Labor % drifts 3 points and you have to wait for the EOD report to know which store.',
      'A "$50K overtime month" lands as a single P&L line — no idea which employee, which shift, which week.',
      'Your DMs run nine stores each and you have no way to know whose stores are slipping until the quarterly review.',
      'When you ask "is this store\'s void rate normal?" the answer is "compared to what?"',
    ],
    reliefs: [
      'Per-store labor % vs budget with drift bars, overtime $, ghost shifts (clocked time, zero sales attached).',
      'Schedule-vs-clocked offenders ranked by drift — the timesheet pull-list, ready.',
      'Per-store void rates compared against each store\'s OWN peer median — not an industry benchmark you can\'t verify.',
      'The morning email — last night\'s drift, week-to-date trend, the one thing to fix before noon.',
    ],
    freeAgents: [
      { name: 'Labor Leak', line: 'Overtime drift, ghost shifts, schedule-vs-clocked gaps. The labor screen managers actually want.', href: '/demo/labor-leak' },
      { name: 'Void Hunter', line: 'Voids vs each store\'s own peer median, by store and by employee. Patterns, not verdicts.', href: '/demo/void-hunter' },
      { name: 'Tip Variance', line: 'Week-over-week tip movement — service slipping shows up here before sales do.', href: '/demo/tip-variance' },
    ],
    answers: [
      { slug: 'labor-screen-managers-want', t: 'Why the labor screen managers actually want looks different' },
      { slug: 'void-rate-question-ceo', t: 'The void rate question every CEO should be asking' },
      { slug: 'people-native-ai-restaurants', t: 'What does "people-native AI" mean for restaurants' },
    ],
    bookCtaLine: '15 minutes. Bring one store\'s last two weeks of schedule + timesheet. We\'ll show the labor leak before the call ends.',
  },

  cto: {
    slug: 'cto',
    oneWord: 'Stack',
    subhead: 'Plug in. Not rip out. Sit next to your POS and reconcile across the stack.',
    audience: 'For CTOs · directors of IT · tech leaders · 5 to 50 units',
    badge: 'CTO',
    tone: 'mixed',
    headline: { l1: 'Sit on top of', gradient: 'the stack you have.', l3: 'Tell you when one of them is lying.' },
    intro: 'We don\'t replace Toast, Square, Clover, R365, 7shifts, Thanx, Marqii, Looker, DD, UE, or GH. We sit next to them and reconcile. Native Toast today, universal CSV/Excel/PDF drop as the fallback. Source-tag on every output.',
    pains: [
      'Five vendors, five reports, five sources of truth, zero reconciliation.',
      'A "single pane of glass" tool from one vendor that becomes another silo six months in.',
      'Your loyalty platform reports a number, your POS reports a different one — and nobody owns the reconciliation.',
      'Every new vendor pitches "AI agents that take action" — none of them say where the action came from or why.',
    ],
    reliefs: [
      'We sit outside the stack. We don\'t replace any system. We reconcile across them and surface the gaps.',
      'Source-tag discipline — every figure shipped tagged Verified, Estimated, or Unverified, with the system it came from named in the logic-toggle view.',
      'Toast IQ pipeline live today; Square/Clover/Aloha/Lightspeed next; universal CSV/Excel/PDF as the floor.',
      'You can audit every number we surface — and when we\'re wrong we publish the correction.',
    ],
    freeAgents: [
      { name: 'Void Hunter', line: 'POS-native, runs on Toast employee performance + dining-options today.', href: '/demo/void-hunter' },
      { name: '3P Fee Finder', line: 'POS-side 3P revenue reconciled against per-partner contract rate.', href: '/demo/3p-fee-finder' },
      { name: 'Labor Leak', line: 'Schedule system + POS reconciled against actual clocked hours.', href: '/demo/labor-leak' },
    ],
    answers: [
      { slug: 'walked-the-number-back', t: 'How we caught $31M and walked it back to $15.7M' },
      { slug: 'people-native-ai-restaurants', t: 'What does "people-native AI" mean for restaurants' },
      { slug: 'labor-screen-managers-want', t: 'Why the labor screen managers actually want looks different' },
    ],
    bookCtaLine: '15 minutes. Bring your stack list. We\'ll show you where it overlaps, where it lies, and where we sit.',
  },

  owner: {
    slug: 'owner',
    oneWord: 'Solo',
    subhead: 'Solo operator. Same screen as the chain. None of the enterprise price.',
    audience: 'For independent operators · founders · GMs running 1 to 5 units',
    badge: 'Owner',
    tone: 'gold',
    headline: { l1: 'No enterprise bloat.', gradient: 'No enterprise price.', l3: 'The same honest math.' },
    intro: 'You\'re running ops, finance, marketing, and HR yourself. We don\'t replace any of that. We put the leak in front of you with a name and a next step — and we don\'t make you read a PhD-thesis report to find it.',
    pains: [
      'The "back office" is you, on a laptop, at 11pm.',
      'You can feel the leak — you can\'t name it.',
      'Every restaurant tech vendor either ignores you or charges you enterprise prices.',
      'The reports your accountant gives you don\'t answer the questions you actually have.',
    ],
    reliefs: [
      'Same source-tag discipline the 50-unit groups get. Smaller bill.',
      'One screen ranked by what costs you money this week.',
      'The 6 quick-win demos are free to try — bring your CSV.',
      'Direct line to the founder — operator-to-operator.',
    ],
    freeAgents: [
      { name: 'Void Hunter', line: 'Voids vs your store\'s own peer median, by name.', href: '/demo/void-hunter' },
      { name: '3P Fee Finder', line: 'What DoorDash / Uber / GrubHub actually take.', href: '/demo/3p-fee-finder' },
      { name: 'Labor Leak', line: 'Overtime drift, ghost shifts — the labor screen you want.', href: '/demo/labor-leak' },
    ],
    answers: [
      { slug: 'doordash-blended-rate-dashpass', t: 'Why your DoorDash 10% blends to 11.2%' },
      { slug: 'walked-the-number-back', t: 'How we caught $31M and walked it back to $15.7M' },
      { slug: 'labor-screen-managers-want', t: 'Why the labor screen managers actually want looks different' },
    ],
    bookCtaLine: '15 minutes. Bring your last month\'s Toast export. I\'ll run our reconciliation on it during the call.',
  },

  manager: {
    slug: 'manager',
    oneWord: 'Floor',
    subhead: 'Tonight\'s shift in one screen. Coaching conversation set up for you.',
    audience: 'For GMs · kitchen ops · store managers · single-store leaders',
    badge: 'Manager',
    tone: 'copper',
    headline: { l1: 'Tonight\'s shift,', gradient: 'in one screen.', l3: 'Labor leak before payroll closes.' },
    intro: 'You\'re running the floor — we\'re not in your way. One screen for your store: tonight\'s pace, labor leak before payroll posts, void patterns that flag a coaching conversation, station median as the floor. The screen you actually want at 5:30pm.',
    pains: [
      'You feel your store is slipping but can\'t prove it until the EOD report.',
      'Overtime sneaks past you mid-week and you have to explain it Friday.',
      'A server\'s void rate spikes and you have no fast way to know if it\'s the person or the section.',
      'Coaching conversations turn into accusations because you don\'t have the receipt.',
    ],
    reliefs: [
      'Labor % vs your store\'s budget, live. Overtime drift, ghost shifts, the offenders list — ranked by drift.',
      'Void rate vs your station\'s median — patterns, not verdicts. The coaching conversation, set up for you.',
      'Tip variance week-over-week, by name. Section vs server diagnosed.',
      'The morning email tells you the one thing to fix tonight.',
    ],
    freeAgents: [
      { name: 'Labor Leak', line: 'OT drift, ghost shifts, schedule-vs-clocked — the screen managers want.', href: '/demo/labor-leak' },
      { name: 'Tip Variance', line: 'Week-over-week tip movement, per server. Section vs service.', href: '/demo/tip-variance' },
      { name: 'Void Hunter', line: 'Voids vs your station median — the pattern, not the verdict.', href: '/demo/void-hunter' },
    ],
    answers: [
      { slug: 'labor-screen-managers-want', t: 'Why the labor screen managers actually want looks different' },
      { slug: 'void-rate-question-ceo', t: 'The void rate question every CEO should be asking' },
      { slug: 'people-native-ai-restaurants', t: 'What does "people-native AI" mean for restaurants' },
    ],
    bookCtaLine: '15 minutes. Bring your store\'s last week of schedule + sales. We\'ll show the labor leak live.',
  },

  crew: {
    slug: 'crew',
    oneWord: 'Shift',
    subhead: 'Your shift. Your goal. Your streak. The receipt in your hands.',
    audience: 'For the crew · line cooks · servers · bartenders · dishwashers · hosts',
    badge: 'Crew',
    tone: 'mixed',
    headline: { l1: 'Your shift.', gradient: 'Your goal.', l3: 'Your streak.' },
    intro: 'The back office isn\'t the only one who runs the restaurant. Tonight\'s shift in one screen for you: how you\'re pacing vs forecast, your station median, the goal that matters tonight, and the streak you\'re building.',
    pains: [
      'Nobody tells you how the shift is actually going until end-of-night.',
      'You don\'t know if your section is having a slow night or you\'re slow.',
      'The "leaderboard" at most jobs is a piece of paper on the wall.',
      'Nobody puts the receipt in your hands.',
    ],
    reliefs: [
      'Tonight\'s shift on one screen. Covers vs forecast, net vs forecast, your shift goal, your streak.',
      'Your station\'s void rate vs the median — you know if you\'re on or off.',
      'Achievements that mean something — voids under the line, upsell streaks, zero-comp shifts.',
      'A daily standup that actually helps.',
    ],
    freeAgents: [
      { name: 'Shift Pulse', line: 'Tonight\'s shift in one screen — pacing, station median, goal, streak.', href: '/demo/shift-pulse' },
      { name: 'Tip Variance', line: 'Week-over-week tip movement, by name — find your trend.', href: '/demo/tip-variance' },
      { name: 'Labor Leak', line: 'See where the schedule and the clock don\'t agree.', href: '/demo/labor-leak' },
    ],
    answers: [
      { slug: 'people-native-ai-restaurants', t: 'What does "people-native AI" mean for restaurants' },
      { slug: 'labor-screen-managers-want', t: 'Why the labor screen managers actually want looks different' },
    ],
    bookCtaLine: 'Ask your manager to try Shift Pulse free at /demo/shift-pulse — no login. If they like it, we\'ll wire it to your store.',
  },

  chef: {
    slug: 'chef',
    oneWord: 'Kitchen',
    subhead: "The chef who runs the books. The line that doesn't lie. Food cost, beverage mix, prep waste — owned at the pass.",
    audience: 'For chef-owners · executive chefs · culinary directors · chef-led groups',
    badge: 'Chef',
    tone: 'copper',
    headline: { l1: 'The line that', gradient: "doesn't lie.", l3: 'The kitchen, the books, the floor — one screen.' },
    intro: "You're the operator AND the chef. You run the pass at 7pm and the P&L at 11am. We hand you food cost broken out by category, prep waste by station, beverage mix by service period — every figure source-tagged so when the GM says \"the line is fine\" you have the receipt.",
    pains: [
      'Your CDC says food cost is "fine." Your invoices say otherwise. Reconciliation is on you.',
      'Beverage mix drifts and you can\'t tell if it\'s the bartender, the menu, or the inventory count.',
      'Prep waste is invisible until end-of-week — by then the line cook\'s habit is set.',
      'You signed off on a $40K week and the books say $32K. Where did $8K go?',
    ],
    reliefs: [
      'Food cost by category vs your menu mix — daily, not weekly.',
      'Beverage program: beer / liquor / pop / wine split, per service period, per bartender.',
      'Catering economics with the off-prem reconciliation gap surfaced — where the orders ran but the receipts didn\'t.',
      'Source-tag on every number. When the line cook says "we 86\'d it," we know if the receipt agrees.',
    ],
    freeAgents: [
      { name: 'Catering Leak', line: 'Per-store catering net vs invoiced — where the receipt and the order disagree.', href: '/demo/catering-leak' },
      { name: 'Void Hunter', line: 'Voids vs each station\'s peer median — line cook patterns, not verdicts.', href: '/demo/void-hunter' },
      { name: '3P Fee Finder', line: 'What DD/UE/GH actually keep — so menu pricing on 3P is honest.', href: '/demo/3p-fee-finder' },
    ],
    answers: [
      { slug: 'walked-the-number-back', t: 'How we caught $31M and walked it back to $15.7M' },
      { slug: 'catering-economics-multi-unit', t: 'How catering economics break for multi-unit operators' },
      { slug: 'people-native-ai-restaurants', t: 'What does "people-native AI" mean for restaurants' },
    ],
    bookCtaLine: '15 minutes. Bring last week\'s invoices and one day\'s line sheets. We\'ll show the gap before the call ends.',
  },
};

export const ROLE_ORDER = ['ceo', 'cfo', 'coo', 'chef', 'cto', 'owner', 'manager', 'crew'] as const;
