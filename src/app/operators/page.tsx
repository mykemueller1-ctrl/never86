'use client';

import { useState } from 'react';

const STEPS = [
  {
    n: '01',
    title: 'Sample the work, free',
    body: 'Try Void Hunter, Labor Leak, or Shift Pulse on sample data — see exactly what the platform finds on your real numbers. No login, no card.',
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
    tone: 'gold' as const,
    p: "The leak, named. Who owns it. What to do tomorrow. No more $0 monthly reports that nobody opens.",
    examples: ['Void Hunter', '3P Fee Finder', 'Catering Leak', 'Trade-Area scorecard per store'],
  },
  {
    h: 'Managers',
    tone: 'copper' as const,
    p: "Tonight's shift in one screen. Labor leaks before payroll closes. Per-station void medians as the floor.",
    examples: ['Labor Leak', 'Tip Variance', 'EOD reconciler', 'Per-location scorecard'],
  },
  {
    h: 'Front-line crew',
    tone: 'mixed' as const,
    p: 'A daily standup that actually helps. Your station median, your shift goal, the one thing to fix tonight — and the ranking that says you did it.',
    examples: ['Shift Pulse', 'Knowledge Brain', 'Achievement streaks', 'Frontline coach'],
  },
];

const PROOF = [
  { v: '$15.72M', l: 'reconciled · chef-led 16-unit group', hot: true },
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
    <main className="min-h-screen text-dark-50">
      <header className="border-b border-white/5 sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5 group">
            <span className="brand-monogram">N86</span>
            <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
          </a>
          <div className="flex items-center gap-2 text-sm">
            <a href="/" className="text-dark-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.03]">Home</a>
            <a href="/reports/login" className="text-dark-50 border border-white/10 hover:border-gold-500/60 hover:bg-gold-500/5 rounded-lg px-3 py-1.5 transition-colors">Sign in</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-50 pointer-events-none" />
        <div className="hero-orb animate-floatSlow" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 mb-8">
            <span className="live-dot" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-mono text-dark-100">For multi-unit operators · independent shops · everything in between</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] mb-6 text-white">
            Run your restaurants<br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-300 via-gold-400 to-copper-400">from one screen.</span>
          </h1>
          <p className="text-dark-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            We read every dollar your restaurants move, find where it&apos;s leaking, and show our work on every number.
            One screen per role. One source of truth. Zero hand-waving.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <a href="/demo/void-hunter" className="bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-dark-900 font-semibold rounded-lg px-7 py-3.5 shadow-gold-glow transition-all hover:scale-[1.02]">
              Try a quick win — free
            </a>
            <a href="#talk" className="border border-white/12 hover:border-gold-400/60 text-dark-50 hover:text-white rounded-lg px-7 py-3.5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              Talk to the founder
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/8 max-w-3xl mx-auto">
            {PROOF.map((s) => (
              <div key={s.l} className="relative bg-dark-800 px-5 py-6">
                {s.hot ? <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" /> : null}
                <p className={`font-mono tabular-nums text-xl md:text-2xl font-bold leading-tight ${s.hot ? 'text-gold-300' : 'text-dark-50'}`}>{s.v}</p>
                <p className="text-dark-300 text-[10px] uppercase tracking-[0.18em] mt-2 font-mono">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three steps */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Three steps</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From a free sample to your reconciled numbers in days, not quarters.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="elevated-card rounded-2xl p-7 flex flex-col">
              <p className="font-mono tabular-nums text-gold-400 text-3xl font-bold mb-4">{s.n}</p>
              <p className="text-white font-semibold text-lg mb-2 tracking-tight">{s.title}</p>
              <p className="text-dark-200 leading-relaxed flex-1">{s.body}</p>
              <a href={s.href} className="mt-6 inline-flex items-center gap-1 text-gold-300 hover:text-gold-200 text-sm font-semibold">{s.cta} <span aria-hidden>→</span></a>
            </div>
          ))}
        </div>
      </section>

      {/* Three audiences */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Built for the people who run restaurants</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One platform · three audiences · zero pretending the back office is the only one that matters.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {AUDIENCES.map((a) => (
            <div key={a.h} className="elevated-card rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-block w-1.5 h-6 rounded-full ${a.tone === 'copper' ? 'bg-copper-400' : a.tone === 'mixed' ? 'bg-gradient-to-b from-gold-400 to-copper-400' : 'bg-gold-400'}`} />
                <p className="text-xl font-semibold text-white tracking-tight">{a.h}</p>
              </div>
              <p className="text-dark-200 leading-relaxed mb-5">{a.p}</p>
              <ul className="space-y-1.5">
                {a.examples.map((ex) => (
                  <li key={ex} className="text-dark-50 text-sm flex items-center gap-2">
                    <span className="text-gold-400">·</span> {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Trust move */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-gold-700/40 bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 p-10 md:p-14">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,154,14,0.18), transparent 60%)' }} />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(226,92,18,0.15), transparent 60%)' }} />
          <p className="relative text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-5 text-center">The discipline is the product</p>
          <p className="relative text-3xl md:text-5xl font-bold text-center max-w-3xl mx-auto leading-tight mb-5 tracking-tight">
            Every number ships tagged{' '}
            <span className="text-green-300">Verified</span>,
            <span className="text-gold-300"> Estimated</span>, or{' '}
            <span className="text-red-300">Unverified</span>.
          </p>
          <p className="relative text-dark-200 max-w-2xl mx-auto leading-relaxed text-center">
            We show our work. We name the source. When the model is wrong we walk the number back — like we did when we caught
            our own $8.3M recovery overstatement and corrected it down to $1.81M. That&apos;s the rule of the house.
          </p>
        </div>
      </section>

      {/* Talk to us */}
      <section id="talk" className="max-w-2xl mx-auto px-6 py-24">
        <div className="text-center mb-10">
          <p className="text-gold-400 text-[10px] uppercase tracking-[0.25em] font-mono mb-3">Talk to us</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Get a working demo on your data.</h2>
          <p className="text-dark-200">
            Drop your details — we onboard a small group of operators per cohort. Real data, real numbers,
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
            <input type="text" placeholder="Restaurant / group name" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-dark-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-dark-300 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/15 transition-all" />
            <input type="number" min="1" placeholder="How many units?" value={units} onChange={(e) => setUnits(e.target.value)} className="w-full bg-dark-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-dark-300 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/15 transition-all" />
            <button type="submit" disabled={status === 'loading'} className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-dark-900 font-semibold rounded-lg px-4 py-3.5 transition-all disabled:opacity-50 shadow-gold-glow">
              {status === 'loading' ? 'Sending…' : 'Talk to us'}
            </button>
            {status === 'error' && <p className="text-red-300 text-sm">{message}</p>}
          </form>
        )}
      </section>

      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-dark-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.55rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <a href="/reports/login" className="hover:text-gold-300 transition-colors">Operator sign-in</a>
        </div>
      </footer>
    </main>
  );
}
