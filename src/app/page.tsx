'use client';

import { useState } from 'react';

const STATS = [
  { v: '16', l: 'stores live' },
  { v: '545,677', l: 'orders read' },
  { v: '$15.72M', l: 'reconciled' },
  { v: '$1,043,797.69', l: 'canary, to the cent' },
];

const RECEIPTS = [
  {
    big: '$1,043,797.69',
    label: 'The canary',
    body: 'One store, one quarter, matched to the penny against the POS. No rounding, no hand-waving.',
  },
  {
    big: '$15.72M',
    label: 'The network',
    body: 'A full 16-unit group reconciled to the cent across 545,677 orders.',
  },
  {
    big: '$8.3M → $1.81M',
    label: 'The correction',
    body: 'We caught our own inflated recovery number and walked it back. The honest figure is the one we ship.',
  },
];

const STACK = [
  { name: 'The Dashboard', desc: 'Role-based command center — CEO, CFO, COO, CTO, Data Lead. One screen, ranked by what costs you money.', live: true },
  { name: 'The Tools', desc: 'Void Hunter and 3P Fee Finder. Quick wins, guardrailed — they flag patterns, never verdicts.', live: true },
  { name: 'The Brief', desc: 'A morning email with yesterday’s numbers, week-to-date trends, and what’s off-target.', live: true },
  { name: 'The Discipline', desc: 'Every number tagged Verified, Estimated, or Unverified. We show our work, always.', live: true },
  { name: 'The Integration', desc: 'Native Toast today. Square, Clover, and a universal CSV / Excel drop are next.', live: false, badge: 'Toast live · more coming' },
];

const BUILT_FOR = [
  { h: 'Multi-unit groups', p: '5 to 50 units. One screen for the whole network, every problem routed to the person who owns it — no walls of pain.' },
  { h: 'Single & small operators', p: 'One store or three. The same honest math, none of the enterprise bloat or the enterprise price.' },
];

// Three dropdowns the visitor sees from the homepage — what the platform covers,
// without revealing any operator's data. Marketing surface only.
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
  { name: 'Catering Leak', line: 'Per-store catering economics + invoice-vs-POS reconciliation gap.', href: '#', tag: 'coming', aud: 'owners' },
  { name: 'Tip Variance', line: 'Tip pool variance week-over-week; the leading indicator the POS misses.', href: '#', tag: 'coming', aud: 'managers' },
];

// Two-product framing — what never86 sells.
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

// Three audiences the platform serves at once.
const AUDIENCE: { h: string; p: string; wins: string[] }[] = [
  { h: 'Owners', p: 'The leak, named. Who owns it. What to do tomorrow.', wins: ['Void Hunter', '3P Fee Finder', 'Trade-Area scorecard'] },
  { h: 'Managers', p: 'Tonight’s shift in one screen. Labor before payroll closes.', wins: ['Labor Leak', 'Shift Pulse', 'Tip Variance'] },
  { h: 'Front-line crew', p: 'A daily standup that helps. Station median, shift goal, streak.', wins: ['Knowledge Brain', 'Achievements', 'Frontline coach'] },
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
    <main className="min-h-screen bg-dark-800 text-white">
      {/* Nav */}
      <header className="border-b border-dark-700 sticky top-0 z-40 bg-dark-800/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <span className="text-gold-500 font-bold text-lg tracking-tight">Never 86&apos;d</span>
          <div className="flex items-center gap-1 sm:gap-2 text-sm">
            <button type="button" onClick={() => toggle('wins')} className={`hidden sm:inline px-3 py-1.5 rounded-lg border ${openMenu === 'wins' ? 'border-gold-500 text-white' : 'border-transparent text-dark-300 hover:text-white'}`}>Quick wins <span className="text-dark-500">▾</span></button>
            <button type="button" onClick={() => toggle('agents')} className={`hidden sm:inline px-3 py-1.5 rounded-lg border ${openMenu === 'agents' ? 'border-gold-500 text-white' : 'border-transparent text-dark-300 hover:text-white'}`}>Agents <span className="text-dark-500">▾</span></button>
            <button type="button" onClick={() => toggle('outside')} className={`hidden sm:inline px-3 py-1.5 rounded-lg border ${openMenu === 'outside' ? 'border-gold-500 text-white' : 'border-transparent text-dark-300 hover:text-white'}`}>Outside the stack <span className="text-dark-500">▾</span></button>
            <a href="/operators" className="hidden sm:inline text-dark-300 hover:text-white px-3 py-1.5">For operators</a>
            <a href="/reports/login" className="text-dark-200 hover:text-gold-400 border border-dark-600 rounded-lg px-3 py-1.5 ml-1">Sign in</a>
          </div>
        </div>

        {/* Dropdown panel */}
        {openMenu === 'wins' ? (
          <div className="border-t border-dark-700 bg-dark-800">
            <div className="max-w-6xl mx-auto px-6 py-5">
              <p className="text-gold-500 text-xs uppercase tracking-widest mb-3">Quick wins · drop-in tools, guardrailed</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {QUICK_WINS_MENU.map((q) => (
                  <a key={q.name} href={q.href} onClick={() => setOpenMenu(null)} className="block bg-dark-700 hover:border-gold-500 border border-dark-600 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-white font-semibold">{q.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-gold-300">{q.tag}</span>
                    </div>
                    {q.aud ? <p className="text-gold-400 text-[10px] uppercase tracking-wider mb-1">for {q.aud}</p> : null}
                    <p className="text-dark-300 text-sm">{q.line}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {openMenu === 'agents' ? (
          <div className="border-t border-dark-700 bg-dark-800">
            <div className="max-w-6xl mx-auto px-6 py-5">
              <p className="text-gold-500 text-xs uppercase tracking-widest mb-3">Agents · one specialist per system, deep not light</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {AGENTS_MENU.map((g) => (
                  <div key={g.group}>
                    <p className="text-dark-400 text-[10px] uppercase tracking-wider mb-2">{g.group}</p>
                    <ul className="space-y-1.5">
                      {g.items.map((it) => (
                        <li key={it.name} className="text-white text-sm flex items-center gap-2">
                          <span>{it.name}</span>
                          {it.tag ? <span className="text-[9px] uppercase tracking-wider text-green-400">{it.tag}</span> : null}
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
          <div className="border-t border-dark-700 bg-dark-800">
            <div className="max-w-6xl mx-auto px-6 py-5">
              <p className="text-gold-500 text-xs uppercase tracking-widest mb-1">Outside the stack · we sit next to your POS, not inside it</p>
              <p className="text-dark-300 text-sm mb-4">Every external feed source-tagged. Free, public, government-canonical where possible. No source wired without operator approval.</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {OUTSIDE_STACK_MENU.map((g) => (
                  <div key={g.group}>
                    <p className="text-dark-400 text-[10px] uppercase tracking-wider mb-2">{g.group}</p>
                    <ul className="space-y-2">
                      {g.items.map((it) => (
                        <li key={it.name}>
                          <p className="text-white text-sm font-medium">{it.name}</p>
                          <p className="text-dark-400 text-xs">{it.line}</p>
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
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-gold-500 text-xs uppercase tracking-widest mb-5">Restaurant financial intelligence</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
          Find the leak.<br className="hidden sm:block" /> Name who owns it.<br className="hidden sm:block" /> Keep the receipt.
        </h1>
        <p className="text-dark-200 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          We read every dollar your restaurants move, find where it&apos;s leaking, and show our work on every
          number — so you act on facts, not hunches.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
          <a href="#offer" className="bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-6 py-3">Request access</a>
          <a href="/reports/login" className="border border-dark-600 hover:border-gold-500 text-white rounded-lg px-6 py-3">See the Command Center</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-dark-700 rounded-2xl overflow-hidden border border-dark-700">
          {STATS.map((s) => (
            <div key={s.l} className="bg-dark-800 px-4 py-6">
              <p className="text-gold-400 text-xl md:text-2xl font-bold tabular-nums">{s.v}</p>
              <p className="text-dark-400 text-[11px] uppercase tracking-wide mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Proof */}
      <section id="proof" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-gold-500 text-xs uppercase tracking-widest mb-2 text-center">Three receipts</h2>
        <p className="text-dark-200 text-center mb-10 max-w-xl mx-auto">No slides. No promises. Three numbers we can defend line by line.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {RECEIPTS.map((r) => (
            <div key={r.label} className="bg-dark-700 border border-dark-600 rounded-2xl p-7">
              <p className="text-2xl md:text-3xl font-bold text-white tabular-nums mb-3">{r.big}</p>
              <p className="text-gold-400 text-xs uppercase tracking-wider mb-2">{r.label}</p>
              <p className="text-dark-300 text-sm leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Stack */}
      <section id="stack" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-2">Everything in one place</h2>
        <p className="text-dark-200 text-center mb-10 max-w-xl mx-auto">The whole platform, one screen at a time — and we tell you exactly what&apos;s live today.</p>
        <div className="bg-dark-700 border border-dark-600 rounded-2xl overflow-hidden divide-y divide-dark-600">
          {STACK.map((row) => (
            <div key={row.name} className="flex items-start gap-4 p-5 md:p-6">
              <div className="flex-1">
                <p className="text-white font-semibold">{row.name}</p>
                <p className="text-dark-300 text-sm mt-1">{row.desc}</p>
              </div>
              <span
                className={`shrink-0 text-[10px] uppercase tracking-wider font-semibold rounded-full px-3 py-1 ${
                  row.live ? 'text-green-400 bg-green-500/10' : 'text-gold-300 bg-gold-500/10'
                }`}
              >
                {row.badge ?? (row.live ? 'Live' : 'Coming soon')}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* The Trust Move */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-b from-dark-700 to-dark-800 border border-gold-700/40 rounded-2xl p-10 text-center">
          <p className="text-gold-500 text-xs uppercase tracking-widest mb-4">The trust move</p>
          <p className="text-4xl md:text-5xl font-bold tabular-nums mb-5">
            $8.3M <span className="text-dark-400">→</span> <span className="text-gold-400">$1.81M</span>
          </p>
          <p className="text-dark-200 max-w-2xl mx-auto leading-relaxed">
            Most vendors inflate the number to look impressive. We did the opposite. When our model overstated the
            recovery surface, we corrected it down to the figure we can defend to the penny. The discipline is the
            product — and it&apos;s why operators can trust what we put on the screen.
          </p>
        </div>
      </section>

      {/* Two products — what never86 sells */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-gold-500 text-xs uppercase tracking-widest mb-2 text-center">Two products · one platform</h2>
        <p className="text-3xl font-bold text-center mb-10">For the back office AND the people on the floor.</p>
        <div className="grid md:grid-cols-2 gap-5">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="bg-dark-700 border border-dark-600 rounded-2xl p-7 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gold-500 text-[10px] uppercase tracking-widest">{p.kicker}</p>
                <span className={`text-[10px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-0.5 ${p.status === 'live' ? 'bg-green-500/10 text-green-300 border border-green-700/40' : 'bg-gold-500/10 text-gold-300 border border-gold-700/40'}`}>
                  {p.status === 'live' ? 'Live · in production' : 'Coming · in build'}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-2">{p.name}</p>
              <p className="text-dark-300 leading-relaxed mb-4">{p.line}</p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {p.bullets.map((b) => (
                  <li key={b} className="text-white text-sm flex items-start gap-2">
                    <span className="text-gold-500 mt-0.5">·</span> <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a href={p.href} className="inline-block text-gold-400 hover:text-gold-300 text-sm font-semibold">{p.status === 'live' ? 'See it →' : 'Get on the list →'}</a>
            </div>
          ))}
        </div>
      </section>

      {/* Three audiences */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-gold-500 text-xs uppercase tracking-widest mb-2 text-center">Three audiences</h2>
        <p className="text-3xl font-bold text-center mb-10">The back office isn&apos;t the only one that runs the restaurant.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {AUDIENCE.map((a) => (
            <div key={a.h} className="bg-dark-700 border border-dark-600 rounded-2xl p-7">
              <p className="text-gold-400 font-semibold text-lg mb-2">{a.h}</p>
              <p className="text-dark-300 leading-relaxed mb-4">{a.p}</p>
              <p className="text-dark-400 text-[10px] uppercase tracking-wider mb-1.5">Quick wins built for them</p>
              <ul className="space-y-1">
                {a.wins.map((w) => (
                  <li key={w} className="text-white text-sm flex items-center gap-2">
                    <span className="text-gold-500">·</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Built For */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Built for</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {BUILT_FOR.map((b) => (
            <div key={b.h} className="bg-dark-700 border border-dark-600 rounded-2xl p-7">
              <p className="text-gold-400 font-semibold text-lg mb-2">{b.h}</p>
              <p className="text-dark-300 leading-relaxed">{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Offer + waitlist */}
      <section id="offer" className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <p className="text-gold-500 text-xs uppercase tracking-widest mb-3">Founding cohort</p>
          <h2 className="text-3xl font-bold mb-3">Get a working demo on your data</h2>
          <p className="text-dark-200">
            We&apos;re onboarding a small group of multi-unit operators as design partners — real data, real numbers,
            a direct line to the founder.
          </p>
        </div>
        {status === 'success' ? (
          <div className="bg-dark-700 rounded-2xl p-8 border border-gold-700 text-center">
            <p className="text-gold-500 text-xl font-semibold mb-2">{message}</p>
            <p className="text-dark-300">Check your email — we sent you a welcome note.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Restaurant / group name (optional)"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-4 py-3 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending…' : 'Request access'}
            </button>
            {status === 'error' && <p className="text-red-400 text-sm">{message}</p>}
          </form>
        )}
      </section>

      <footer className="border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-dark-400 text-xs">
          <span>Never 86&apos;d · Built by an operator, for operators</span>
          <a href="/reports/login" className="hover:text-gold-400">Operator sign-in</a>
        </div>
      </footer>
    </main>
  );
}
