'use client';

import { useState } from 'react';

const STEPS = [
  {
    n: '01',
    title: 'Sample the work, free',
    body: 'Try Void Hunter, 3P Fee Finder, or Labor Leak on sample data — see exactly what the platform finds on your real numbers. No login, no card.',
    cta: 'Try a demo',
    href: '/demo/void-hunter',
  },
  {
    n: '02',
    title: 'Drop us your data — or wire your stack',
    body: 'Email a Toast CSV. Forward your Looker schedule. Or wire Toast IQ / Square / Clover natively. We work with the operator, not against them.',
    cta: 'Talk to us',
    href: '#talk',
  },
  {
    n: '03',
    title: 'Get the Command Center',
    body: 'Your reconciled numbers, every figure source-tagged Verified / Estimated / Unverified. One screen per role — CEO, CFO, COO, CTO, Data Lead.',
    cta: 'See a live view',
    href: '/reports/login',
  },
];

const AUDIENCES = [
  {
    h: 'Owners',
    p: 'The leak, named. Who owns it. What to do tomorrow. No more $0 monthly reports that nobody opens.',
    examples: ['Void Hunter', '3P Fee Finder', 'Catering Leak', 'Trade-Area scorecard per store'],
  },
  {
    h: 'Managers',
    p: 'Tonight\'s shift in one screen. Labor leaks before payroll closes. Per-station void medians as the floor.',
    examples: ['Labor Leak', 'Shift Pulse', 'Tip Variance', 'EOD reconciler'],
  },
  {
    h: 'Front-line crew',
    p: 'A daily standup that actually helps. Your station median, your shift goal, the one thing to fix tonight — and the ranking that says you did it.',
    examples: ['Knowledge brain (recipe + spec)', 'Gamified shift goals', 'Achievement streaks', 'Frontline coach'],
  },
];

const PROOF = [
  { v: '$15.72M', l: 'reconciled · chef-led 16-unit group' },
  { v: '545,677', l: 'orders read · to the penny' },
  { v: '$1,043,797.69', l: 'canary store · matched to the cent' },
];

export default function OperatorsLanding() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [units, setUnits] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, restaurantName, units }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || "You're on the list — we'll be in touch within 24 hours.");
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
      <header className="border-b border-dark-700 sticky top-0 z-40 bg-dark-800/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <a href="/" className="text-gold-500 font-bold text-lg tracking-tight">Never 86&apos;d</a>
          <div className="flex items-center gap-2 text-sm">
            <a href="/" className="text-dark-300 hover:text-white px-3 py-1.5">Home</a>
            <a href="/reports/login" className="text-dark-200 hover:text-gold-400 border border-dark-600 rounded-lg px-3 py-1.5">Sign in</a>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-gold-500 text-xs uppercase tracking-widest mb-4">For multi-unit operators · independent shops · everything in between</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
          Run your restaurants from one screen.<br className="hidden sm:block" />
          <span className="text-gold-400">Built by an operator. For operators.</span>
        </h1>
        <p className="text-dark-200 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          We read every dollar your restaurants move, find where it&apos;s leaking, and show our work on every number.
          One screen per role. One source of truth. Zero hand-waving.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href="/demo/void-hunter" className="bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-6 py-3">Try a quick win — free</a>
          <a href="#talk" className="border border-dark-600 hover:border-gold-500 text-white rounded-lg px-6 py-3">Talk to the founder</a>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-dark-700 rounded-2xl overflow-hidden border border-dark-700">
          {PROOF.map((s) => (
            <div key={s.l} className="bg-dark-800 px-4 py-6">
              <p className="text-gold-400 text-xl md:text-2xl font-bold tabular-nums">{s.v}</p>
              <p className="text-dark-400 text-[11px] uppercase tracking-wide mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-gold-500 text-xs uppercase tracking-widest mb-2 text-center">Three steps</h2>
        <p className="text-3xl font-bold text-center mb-10">From a free sample to your reconciled numbers in days, not quarters.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-dark-700 border border-dark-600 rounded-2xl p-7 flex flex-col">
              <p className="text-gold-500 text-2xl font-bold tabular-nums mb-3">{s.n}</p>
              <p className="text-white font-semibold text-lg mb-2">{s.title}</p>
              <p className="text-dark-300 leading-relaxed flex-1">{s.body}</p>
              <a href={s.href} className="mt-5 inline-block text-gold-400 hover:text-gold-300 text-sm font-semibold">{s.cta} →</a>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-gold-500 text-xs uppercase tracking-widest mb-2 text-center">Built for the people who run restaurants</h2>
        <p className="text-3xl font-bold text-center mb-10">One platform · three audiences · zero pretending the back office is the only one that matters.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {AUDIENCES.map((a) => (
            <div key={a.h} className="bg-dark-700 border border-dark-600 rounded-2xl p-7">
              <p className="text-gold-400 font-semibold text-lg mb-2">{a.h}</p>
              <p className="text-dark-300 leading-relaxed mb-4">{a.p}</p>
              <ul className="space-y-1.5">
                {a.examples.map((ex) => (
                  <li key={ex} className="text-white text-sm flex items-center gap-2">
                    <span className="text-gold-500">·</span> {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-b from-dark-700 to-dark-800 border border-gold-700/40 rounded-2xl p-10">
          <p className="text-gold-500 text-xs uppercase tracking-widest mb-3 text-center">The discipline is the product</p>
          <p className="text-2xl md:text-3xl font-bold text-center max-w-3xl mx-auto leading-snug mb-4">
            Every number ships tagged <span className="text-green-400">Verified</span>,
            <span className="text-gold-400"> Estimated</span>, or <span className="text-red-400">Unverified</span>.
          </p>
          <p className="text-dark-200 max-w-2xl mx-auto leading-relaxed text-center">
            We show our work. We name the source. When the model is wrong we walk the number back — like we did when we caught
            our own $8.3M recovery overstatement and corrected it down to $1.81M. That&apos;s the rule of the house.
          </p>
        </div>
      </section>

      <section id="talk" className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <p className="text-gold-500 text-xs uppercase tracking-widest mb-3">Talk to us</p>
          <h2 className="text-3xl font-bold mb-3">Get a working demo on your data</h2>
          <p className="text-dark-200">
            Drop your details — we onboard a small group of operators per cohort. Real data, real numbers,
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
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500"
            />
            <input
              type="text"
              placeholder="Restaurant / group name"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500"
            />
            <input
              type="number"
              min="1"
              placeholder="How many units?"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-gold-500 hover:bg-gold-400 text-dark-900 font-semibold rounded-lg px-4 py-3 disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending…' : 'Talk to us'}
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
