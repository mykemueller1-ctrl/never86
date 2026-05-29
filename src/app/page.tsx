'use client';

import { useState } from 'react';

const STATS = [
  { v: '16', l: 'stores live' },
  { v: '545,677', l: 'orders read' },
  { v: '$15.72M', l: 'reconciled', hot: true },
  { v: '$1,043,797.69', l: 'canary, to the cent' },
];

const RECEIPTS = [
  {
    big: '$1,043,797.69',
    label: 'The canary',
    body: 'One store, one quarter, matched to the penny against the POS. No rounding, no hand-waving.',
    accent: 'gold',
  },
  {
    big: '$15.72M',
    label: 'The network',
    body: 'A full 16-unit group reconciled to the cent across 545,677 orders.',
    accent: 'gold',
  },
  {
    big: '$8.3M → $1.81M',
    label: 'The correction',
    body: 'We caught our own inflated recovery number and walked it back. The honest figure is the one we ship.',
    accent: 'copper',
  },
];

const STACK = [
  { name: 'The Dashboard', desc: 'Role-based command center — CEO, CFO, COO, CTO, Data Lead. One screen, ranked by what costs you money.', live: true },
  { name: 'The Tools', desc: 'Six live quick wins · Void Hunter · 3P Fee Finder · Labor Leak · Shift Pulse · Catering Leak · Tip Variance. Guardrailed.', live: true },
  { name: 'The Brief', desc: 'A morning email with yesterday’s numbers, week-to-date trends, and what’s off-target.', live: true },
  { name: 'The Discipline', desc: 'Every number tagged Verified, Estimated, or Unverified. We show our work, always.', live: true },
  { name: 'The Integration', desc: 'Native Toast today. Square, Clover, and a universal CSV / Excel drop are next.', live: false, badge: 'Toast live · more coming' },
];

const BUILT_FOR = [
  { h: 'Multi-unit groups', p: '5 to 50 units. One screen for the whole network, every problem routed to the person who owns it — no walls of pain.' },
  { h: 'Single & small operators', p: 'One store or three. The same honest math, none of the enterprise bloat or the enterprise price.' },
];

const AGENTS_MENU: { group: string; items: { name: string; tag?: string }[] }[] = [
  { group: 'POS', items: [{ name: 'Toast', tag: 'live' }, { name: 'Square' }, { name: 'Clover' }, { name: 'Aloha' }, { name: 'Lightspeed' }] },
  { group: '3rd-party delivery', items: [{ name: 'DoorDash' }, { name: 'Uber Eats' }, { name: 'GrubHub' }] },
  { group: 'Loyalty + digital', items: [{ name: 'Thanx' }, { name: 'Marqii (listings)' }, { name: 'Looker (BI)' }] },
  { group: 'Store ops', items: [{ name: 'End-of-night reports' }, { name: 'Excel / CSV / PDF drop', tag: 'universal' }] },
  { group: 'Scheduling + payroll', items: [{ name: '7shifts' }, { name: 'HotSchedules' }, { name: 'Homebase' }, { name: 'ADP' }, { name: 'Gusto' }] },
  { group: 'Roll-ups + interpreters', items: [{ name: '3P Aggregator' }, { name: 'Restaurant Accountant' }, { name: 'Trade Area / Customer Intelligence' }, { name: 'Per-location agents' }] },
  { group: 'Governance', items: [{ name: 'Source-tag enforcer' }, { name: 'HR / legal red-team' }, { name: 'Brand-voice enforcer' }] },
];

const QUICK_WINS_MENU: { name: string; line: string; href: string; tag: string; aud?: string }[] = [
  { name: 'Void Hunter', line: 'Voids vs your own peer median, by store and by name. Flags patterns, never verdicts.', href: '/demo/void-hunter', tag: 'live · try the demo', aud: 'owners' },
  { name: '3P Fee Finder', line: 'What DoorDash / Uber / GrubHub take off the top, ranked by store. 1st-party % as the lever.', href: '/demo/3p-fee-finder', tag: 'live · try the demo', aud: 'owners' },
  { name: 'Labor Leak', line: 'Overtime drift, ghost shifts, schedule-vs-clocked gaps. The labor screen managers actually want.', href: '/demo/labor-leak', tag: 'live · try the demo', aud: 'managers' },
  { name: 'Shift Pulse', line: 'Tonight’s shift in one screen — covers vs forecast, station median, your goal, your streak.', href: '/demo/shift-pulse', tag: 'live · try the demo', aud: 'frontline' },
  { name: 'Catering Leak', line: 'Per-store catering economics + invoice-vs-POS reconciliation gap. The off-prem leak nobody catches.', href: '/demo/catering-leak', tag: 'live · try the demo', aud: 'owners' },
  { name: 'Tip Variance', line: 'Week-over-week tip movement per store and by name. Service slipping shows up here before sales do.', href: '/demo/tip-variance', tag: 'live · try the demo', aud: 'managers' },
];

const PRODUCTS: { kicker: string; name: string; line: string; bullets: string[]; status: 'live' | 'coming'; href: string }[] = [
  {
    kicker: 'Product 01',
    name: 'Financial intelligence',
    line: 'For owners and CFOs. Every dollar your restaurants move, read, reconciled, source-tagged.',
    bullets: ['Command Center · role-based one-screen view', 'Void Hunter · 3P Fee Finder · Labor Leak', 'Per-location agents + Trade-Area scorecards', 'Source-tag discipline on every figure'],
    status: 'live',
    href: '/operators',
  },
  {
    kicker: 'Product 02',
    name: 'People-native AI · end-to-end',
    line: 'For managers and the crew. Gamified shifts, knowledge brain, daily standup that helps. Built on a real restaurant.',
    bullets: ['Shift Pulse · station medians, tonight’s goal', 'Knowledge Brain · recipes + specs + service rules', 'Gamified achievements & streaks', 'Manager + frontline coach loop'],
    status: 'coming',
    href: '/operators#talk',
  },
];

const AUDIENCE: { h: string; p: string; wins: string[]; tone: 'gold' | 'copper' | 'mixed' }[] = [
  { h: 'Owners', p: 'The leak, named. Who owns it. What to do tomorrow.', wins: ['Void Hunter', '3P Fee Finder', 'Catering Leak'], tone: 'gold' },
  { h: 'Managers', p: 'Labor before payroll closes. Tip slippage as the leading indicator.', wins: ['Labor Leak', 'Tip Variance', 'EOD reconciler'], tone: 'copper' },
  { h: 'Front-line crew', p: 'A daily standup that helps. Station median, shift goal, streak.', wins: ['Shift Pulse', 'Knowledge Brain', 'Achievements'], tone: 'mixed' },
];

const OUTSIDE_STACK_MENU: { group: string; items: { name: string; line: string }[] }[] = [
  { group: 'Demographics', items: [
    { name: 'Census ACS (block-group)', line: 'Income, age, education, household — the trade-area baseline' },
    { name: 'Census Pulse', line: 'Recent shifts — DMV migration, fed-workforce moves' },
    { name: 'Census LODES', line: 'Workplace employment density — your lunch crowd' },
  ]},
  { group: 'Public peers + benchmarks', items: [
    { name: 'SEC EDGAR XBRL', line: 'Cava · Chipotle · Sweetgreen · Shake Shack · Wingstop — your CFO benchmark strip' },
    { name: 'BLS OEWS', line: 'Wage by metro × role — what your line cooks should make' },
  ]},
  { group: 'Place + traffic', items: [
    { name: 'Google Places / Yelp Fusion', line: 'Halo anchors + heat map — the operator-judgment site rubric' },
    { name: 'OpenStreetMap POIs', line: 'Free fallback when Google quotas tighten' },
    { name: 'State DOT AADT', line: 'Annual average daily traffic — corridor strength per store' },
  ]},
  { group: 'Local context', items: [
    { name: 'NOAA weather', line: 'Government-canonical · the dine-in / delivery shift on a rainy day' },
    { name: 'Sports leagues + venues', line: 'Commanders · Wizards · Capitals · Nationals · Titans · Predators · NC State · venue iCal feeds' },
    { name: 'County open-data permits', line: 'New restaurants breaking ground in your ring · road closures · gentrification signals' },
    { name: 'State ABC alcohol licenses', line: 'New entrants in your 1-mile ring' },
  ]},
  { group: 'Commodity + supply', items: [
    { name: 'USDA Market News', line: 'Ground beef · avocado · corn · dairy weekly index' },
  ]},
];

function Brand() {
  return (
    <a href="/" className="flex items-center gap-2.5 group">
      <span className="brand-monogram">N86</span>
      <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
    </a>
  );
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [openMenu, setOpenMenu] = useState<'agents' | 'wins' | 'outside' | null>(null);
  const toggle = (k: 'agents' | 'wins' | 'outside') => setOpenMenu((cur) => (cur === k ? null : k));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, restaurantName }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || "You're on the list!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <main className="min-h-screen text-dark-50">
      {/* Sticky header */}
      <header className="border-b border-white/5 sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-1.5 text-sm">
            <button type="button" onClick={() => toggle('wins')} className={`hidden sm:inline px-3 py-1.5 rounded-lg border transition-colors ${openMenu === 'wins' ? 'border-gold-500/60 text-white bg-gold-500/5' : 'border-transparent text-dark-200 hover:text-white hover:bg-white/[0.03]'}`}>Quick wins <span className="text-dark-400">▾</span></button>
            <button type="button" onClick={() => toggle('agents')} className={`hidden sm:inline px-3 py-1.5 rounded-lg border transition-colors ${openMenu === 'agents' ? 'border-gold-500/60 text-white bg-gold-500/5' : 'border-transparent text-dark-200 hover:text-white hover:bg-white/[0.03]'}`}>Agents <span className="text-dark-400">▾</span></button>
            <button type="button" onClick={() => toggle('outside')} className={`hidden sm:inline px-3 py-1.5 rounded-lg border transition-colors ${openMenu === 'outside' ? 'border-gold-500/60 text-white bg-gold-500/5' : 'border-transparent text-dark-200 hover:text-white hover:bg-white/[0.03]'}`}>Outside the stack <span className="text-dark-400">▾</span></button>
            <a href="/operators" className="hidden sm:inline text-dark-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.03]">For operators</a>
            <a href="/reports/login" className="text-dark-50 border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 rounded-lg px-3 py-1.5 ml-1 transition-colors">Sign in</a>
          </div>
        </div>

        {openMenu === 'wins' ? (
          <div className="border-t border-white/5 bg-dark-900/95 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gold-400 text-[10px] font-mono uppercase tracking-[0.2em]">Quick wins</span>
                <span className="accent-rule flex-1" />
                <span className="text-dark-300 text-xs">drop-in tools · guardrailed</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {QUICK_WINS_MENU.map((q) => (
                  <a key={q.name} href={q.href} onClick={() => setOpenMenu(null)} className="elevated-card rounded-xl p-4 transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-white font-semibold">{q.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-gold-300 font-mono">{q.tag}</span>
                    </div>
                    {q.aud ? <p className="text-copper-300 text-[10px] uppercase tracking-[0.18em] mb-1.5 font-mono">for {q.aud}</p> : null}
                    <p className="text-dark-200 text-sm leading-relaxed">{q.line}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {openMenu === 'agents' ? (
          <div className="border-t border-white/5 bg-dark-900/95 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gold-400 text-[10px] font-mono uppercase tracking-[0.2em]">Agents</span>
                <span className="accent-rule flex-1" />
                <span className="text-dark-300 text-xs">one specialist per system · deep not light</span>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {AGENTS_MENU.map((g) => (
                  <div key={g.group}>
                    <p className="text-dark-300 text-[10px] uppercase tracking-[0.2em] font-mono mb-2">{g.group}</p>
                    <ul className="space-y-1.5">
                      {g.items.map((it) => (
                        <li key={it.name} className="text-dark-50 text-sm flex items-center gap-2">
                          <span>{it.name}</span>
                          {it.tag ? <span className="text-[9px] uppercase tracking-[0.18em] font-mono text-green-400 border border-green-500/30 rounded px-1.5 py-0.5">{it.tag}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {openMenu === 'outside' ? (
          <div className="border-t border-white/5 bg-dark-900/95 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gold-400 text-[10px] font-mono uppercase tracking-[0.2em]">Outside the stack</span>
                <span className="accent-rule flex-1" />
                <span className="text-dark-300 text-xs">we sit next to your POS, not inside it</span>
              </div>
              <p className="text-dark-200 text-sm mb-5">Every external feed source-tagged. Free, public, government-canonical where possible. No source wired without operator approval.</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {OUTSIDE_STACK_MENU.map((g) => (
                  <div key={g.group}>
                    <p className="text-dark-300 text-[10px] uppercase tracking-[0.2em] font-mono mb-2">{g.group}</p>
                    <ul className="space-y-2.5">
                      {g.items.map((it) => (
                        <li key={it.name}>
                          <p className="text-dark-50 text-sm font-medium">{it.name}</p>
                          <p className="text-dark-300 text-xs leading-relaxed">{it.line}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-60 pointer-events-none" />
        <div className="hero-orb animate-floatSlow" />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 mb-8">
            <span className="live-dot" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-mono text-dark-100">Live · $15.72M reconciled · 545,677 orders read</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] mb-6 text-white">
            Find the leak.<br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-300 via-gold-400 to-copper-400">Name who owns it.</span><br className="hidden sm:block" />
            Keep the receipt.
          </h1>
          <p className="text-dark-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            We read every dollar your restaurants move, find where it&apos;s leaking, and show our work on every number —
            so you act on facts, not hunches.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <a href="/operators" className="bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-dark-900 font-semibold rounded-lg px-7 py-3.5 shadow-gold-glow transition-all hover:scale-[1.02]">
              Get started — free quick win
            </a>
            <a href="/reports/login" className="border border-white/12 hover:border-gold-400/60 text-dark-50 hover:text-white rounded-lg px-7 py-3.5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              See the Command Center
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/8">
            {STATS.map((s) => (
              <div key={s.l} className={`relative bg-dark-800 px-4 py-6 ${s.hot ? '' : ''}`}>
                {s.hot ? <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" /> : null}
                <p className={`font-mono tabular-nums text-xl md:text-2xl font-bold leading-tight ${s.hot ? 'text-gold-300' : 'text-dark-50'}`}>{s.v}</p>
                <p className="text-dark-300 text-[10px] uppercase tracking-[0.18em] mt-2 font-mono">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three receipts */}
      <section id="proof" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Three receipts</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">No slides. No promises.</h2>
          <p className="text-dark-200 max-w-xl mx-auto">Three numbers we can defend line by line.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {RECEIPTS.map((r) => (
            <div key={r.label} className={`elevated-card rounded-2xl p-7 ${r.accent === 'copper' ? 'hover:border-copper-500/40' : 'hover:border-gold-500/40'} transition-colors`}>
              <p className={`font-mono tabular-nums text-2xl md:text-3xl font-bold mb-3 ${r.accent === 'copper' ? 'text-copper-300' : 'text-dark-50'}`}>{r.big}</p>
              <p className={`text-[10px] uppercase tracking-[0.22em] font-mono mb-3 ${r.accent === 'copper' ? 'text-copper-400' : 'text-gold-400'}`}>{r.label}</p>
              <p className="text-dark-200 text-sm leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two products */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Two products · one platform</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">For the back office AND the people on the floor.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {PRODUCTS.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-7 flex flex-col overflow-hidden ${p.status === 'live' ? 'bg-gradient-to-br from-gold-500/[0.08] to-transparent border border-gold-500/30' : 'bg-gradient-to-br from-copper-500/[0.07] to-transparent border border-copper-500/30'}`}>
              <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: p.status === 'live' ? 'radial-gradient(50% 50% at 100% 0%, rgba(212,154,14,0.18), transparent 60%)' : 'radial-gradient(50% 50% at 100% 0%, rgba(226,92,18,0.18), transparent 60%)' }} />
              <div className="relative flex items-center justify-between mb-3">
                <p className={`text-[10px] uppercase tracking-[0.22em] font-mono ${p.status === 'live' ? 'text-gold-300' : 'text-copper-300'}`}>{p.kicker}</p>
                <span className={`text-[10px] uppercase tracking-[0.18em] font-mono font-semibold rounded-full px-2.5 py-1 border ${p.status === 'live' ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-copper-500/10 text-copper-300 border-copper-500/30'}`}>
                  {p.status === 'live' ? 'Live · in production' : 'Coming · in build'}
                </span>
              </div>
              <p className="relative text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">{p.name}</p>
              <p className="relative text-dark-200 leading-relaxed mb-5">{p.line}</p>
              <ul className="relative space-y-2 mb-6 flex-1">
                {p.bullets.map((b) => (
                  <li key={b} className="text-dark-50 text-sm flex items-start gap-2.5">
                    <span className={p.status === 'live' ? 'text-gold-400 mt-1' : 'text-copper-400 mt-1'}>◆</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a href={p.href} className={`relative inline-flex items-center gap-1 text-sm font-semibold ${p.status === 'live' ? 'text-gold-300 hover:text-gold-200' : 'text-copper-300 hover:text-copper-200'}`}>
                {p.status === 'live' ? 'See it' : 'Get on the list'} <span aria-hidden>→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Three audiences */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Three audiences</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The back office isn&apos;t the only one that runs the restaurant.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {AUDIENCE.map((a) => (
            <div key={a.h} className="elevated-card rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-block w-1.5 h-6 rounded-full ${a.tone === 'copper' ? 'bg-copper-400' : a.tone === 'mixed' ? 'bg-gradient-to-b from-gold-400 to-copper-400' : 'bg-gold-400'}`} />
                <p className="text-xl font-semibold text-white tracking-tight">{a.h}</p>
              </div>
              <p className="text-dark-200 leading-relaxed mb-5">{a.p}</p>
              <p className="text-dark-300 text-[10px] uppercase tracking-[0.22em] font-mono mb-2">Quick wins for them</p>
              <ul className="space-y-1.5">
                {a.wins.map((w) => (
                  <li key={w} className="text-dark-50 text-sm flex items-center gap-2.5">
                    <span className="text-gold-400">·</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* The stack */}
      <section id="stack" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">The stack</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything in one place.</h2>
          <p className="text-dark-200 max-w-xl mx-auto">The whole platform, one screen at a time — and we tell you exactly what&apos;s live today.</p>
        </div>
        <div className="elevated-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {STACK.map((row) => (
              <div key={row.name} className="flex items-start gap-4 p-6 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1">
                  <p className="text-white font-semibold">{row.name}</p>
                  <p className="text-dark-200 text-sm mt-1.5 leading-relaxed">{row.desc}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] uppercase tracking-[0.18em] font-mono font-semibold rounded-full px-3 py-1 border ${
                    row.live ? 'text-green-300 bg-green-500/10 border-green-500/30' : 'text-copper-300 bg-copper-500/10 border-copper-500/30'
                  }`}
                >
                  {row.badge ?? (row.live ? 'Live' : 'Coming soon')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The trust move */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-gold-700/40 bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 p-10 md:p-14 text-center">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,154,14,0.18), transparent 60%)' }} />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(226,92,18,0.15), transparent 60%)' }} />
          <p className="relative text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-5">The trust move</p>
          <p className="relative text-4xl md:text-6xl font-bold tabular-nums font-mono tracking-tight mb-6">
            <span className="text-dark-100">$8.3M</span>
            <span className="text-dark-500 mx-3">→</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-300 to-copper-400">$1.81M</span>
          </p>
          <p className="relative text-dark-200 max-w-2xl mx-auto leading-relaxed">
            Most vendors inflate the number to look impressive. We did the opposite. When our model overstated the
            recovery surface, we corrected it down to the figure we can defend to the penny. The discipline is the
            product — and it&apos;s why operators can trust what we put on the screen.
          </p>
        </div>
      </section>

      {/* Built for */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Built for</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Multi-unit groups and small shops alike.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {BUILT_FOR.map((b) => (
            <div key={b.h} className="elevated-card rounded-2xl p-8">
              <p className="text-gold-300 font-semibold text-lg mb-3 tracking-tight">{b.h}</p>
              <p className="text-dark-200 leading-relaxed">{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Offer + waitlist */}
      <section id="offer" className="max-w-2xl mx-auto px-6 py-24">
        <div className="text-center mb-10">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Founding cohort</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Get a working demo on your data.</h2>
          <p className="text-dark-200">
            We&apos;re onboarding a small group of multi-unit operators as design partners — real data, real numbers,
            a direct line to the founder.
          </p>
        </div>
        {status === 'success' ? (
          <div className="elevated-card rounded-2xl p-10 text-center border-gold-500/40">
            <p className="text-gold-300 text-xl font-semibold mb-2">{message}</p>
            <p className="text-dark-200">Check your email — we sent you a welcome note.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 elevated-card rounded-2xl p-7">
            <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-dark-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-dark-300 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/15 transition-all" />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-dark-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-dark-300 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/15 transition-all" />
            <input type="text" placeholder="Restaurant / group name (optional)" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-dark-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-dark-300 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/15 transition-all" />
            <button type="submit" disabled={status === 'loading'} className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-dark-900 font-semibold rounded-lg px-4 py-3.5 transition-all disabled:opacity-50 shadow-gold-glow">
              {status === 'loading' ? 'Sending…' : 'Request access'}
            </button>
            {status === 'error' && <p className="text-red-400 text-sm">{message}</p>}
          </form>
        )}
      </section>

      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-dark-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.55rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/operators" className="hover:text-gold-300 transition-colors">For operators</a>
            <a href="/reports/login" className="hover:text-gold-300 transition-colors">Sign in</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
