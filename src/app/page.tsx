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

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
      <header className="border-b border-dark-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-gold-500 font-bold text-lg tracking-tight">Never 86&apos;d</span>
          <div className="flex items-center gap-4 text-sm">
            <a href="#stack" className="text-dark-300 hover:text-white hidden sm:inline">What it does</a>
            <a href="#proof" className="text-dark-300 hover:text-white hidden sm:inline">The proof</a>
            <a href="/reports/login" className="text-dark-200 hover:text-gold-400 border border-dark-600 rounded-lg px-3 py-1.5">Sign in</a>
          </div>
        </div>
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
