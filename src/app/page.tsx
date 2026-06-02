'use client';

import Link from 'next/link';
import { useState } from 'react';

const STATS = [
  { v: '$15.72M', l: 'reconciled' },
  { v: '545,677', l: 'orders read' },
  { v: '$1,043,797.69', l: 'canary, to the cent' },
  { v: '16', l: 'stores live' },
];

const RECEIPTS = [
  { big: '$1,043,797.69', label: 'The canary', body: 'One store. One quarter. Matched to the penny against the POS. No rounding, no hand-waving.' },
  { big: '$15.72M', label: 'The network', body: 'A full 16-unit chef-led group, reconciled to the cent across 545,677 orders.' },
  { big: '$8.3M → $1.81M', label: 'The correction', body: 'We caught our own inflated recovery number and walked it back. The honest figure is the one we ship.' },
];

const FREE_AGENTS = [
  { name: 'Void Hunter', line: 'Voids vs each store\'s own peer median, by name.', href: '/demo/void-hunter', aud: 'Owner' },
  { name: '3P Fee Finder', line: 'Contract vs blended-effective rate, per partner, per store.', href: '/demo/3p-fee-finder', aud: 'CFO' },
  { name: 'Labor Leak', line: 'Overtime drift, ghost shifts, schedule-vs-clocked gaps.', href: '/demo/labor-leak', aud: 'COO' },
  { name: 'Tip Variance', line: 'Week-over-week tip movement — the leading indicator.', href: '/demo/tip-variance', aud: 'Manager' },
  { name: 'Catering Leak', line: 'Per-store catering economics + invoice-vs-POS gap.', href: '/demo/catering-leak', aud: 'Owner' },
  { name: 'Shift Pulse', line: 'Tonight\'s shift in one screen. Goal. Streak.', href: '/demo/shift-pulse', aud: 'Crew' },
];

const C_SUITE = [
  { h: 'CEO', href: '/for/ceo', line: 'Network reconciled. Board-ready figures, source-tagged.' },
  { h: 'CFO', href: '/for/cfo', line: 'Books that close to the penny — without the death march.' },
  { h: 'COO', href: '/for/coo', line: 'Labor leak before payroll posts. Voids, named.' },
  { h: 'CTO', href: '/for/cto', line: 'Sit outside your stack. Reconcile across it.' },
];

const FRONTLINE = [
  { h: 'Owner', href: '/for/owner', line: 'Independent operator, 1 to 5 units. The leak, named.' },
  { h: 'Manager', href: '/for/manager', line: 'Tonight\'s shift in one screen. Labor before payroll.' },
  { h: 'Crew', href: '/for/crew', line: 'Your shift. Your goal. Your streak.' },
];

const STACK = [
  { name: 'Command Center', desc: 'Role-based view — CEO, CFO, COO, CTO. One screen, ranked by what costs you money.' },
  { name: 'Six free agents', desc: 'Void Hunter, 3P Fee Finder, Labor Leak, Shift Pulse, Catering Leak, Tip Variance — try without a login.' },
  { name: 'Morning brief', desc: 'A short email with yesterday\'s numbers, the drift, and the one thing to fix today.' },
  { name: 'Source-tag discipline', desc: 'Every number tagged Verified, Estimated, or Unverified. Ask us why.' },
  { name: 'Outside your stack', desc: 'We don\'t replace Toast, R365, 7shifts, or Thanx. We sit on top and reconcile.' },
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
        setMessage(data.message || "You're on the list.");
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <main className="min-h-screen text-ink-800">
      {/* Sticky nav — Apple shell */}
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/for" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">Pick your seat</Link>
            <Link href="/operators" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden md:inline">Operators</Link>
            <Link href="/answers" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden md:inline">Answers</Link>
            <Link href="/press" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden lg:inline">Press</Link>
            <Link href="/reports/login" className="px-3 py-1.5 rounded-full text-ink-800 hover:bg-black/[0.04] font-medium">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero — Apple keynote */}
      <section className="pt-20 md:pt-28 pb-16 md:pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-ink-100 border border-ink-200 px-3 py-1 mb-8">
            <span className="live-dot" />
            <span className="text-[12px] font-medium text-ink-600 tracking-tight">Live · $15.72M reconciled across 545,677 orders</span>
          </div>
          <h1 className="display text-5xl md:text-7xl lg:text-[88px] mb-7">
            Find the leak.<br />
            Name who owns it.<br />
            Keep the receipt.
          </h1>
          <p className="text-ink-600 text-xl md:text-2xl max-w-2xl mx-auto leading-snug mb-4 tracking-tight">
            Restaurant financial intelligence, built by an operator. For operators.
          </p>
          <p className="text-ink-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Every number ships tagged <span className="text-success-500 font-semibold">Verified</span>,
            <span className="text-warning-500 font-semibold"> Estimated</span>, or
            <span className="text-danger-500 font-semibold"> Unverified</span>. Ask us why.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/for" className="btn-primary">Pick your seat →</Link>
            <Link href="/demo/void-hunter" className="btn-secondary">⚡ Try a free agent</Link>
          </div>
          <p className="text-[12px] text-ink-500 mt-6">No login. No card. 60 seconds to a real screen.</p>
        </div>
      </section>

      {/* Free agents grid — primary "try us out" surface */}
      <section className="py-16 md:py-24 px-6 bg-ink-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-3">Free agents</p>
            <h2 className="display text-4xl md:text-5xl mb-4">Try one. Right now.</h2>
            <p className="text-ink-600 text-lg max-w-xl mx-auto">Six live tools. Sample data. No signup, no card, no salesperson.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FREE_AGENTS.map((a) => (
              <Link key={a.name} href={a.href} className="card group p-7 block hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">For {a.aud}</p>
                  <span className="text-[11px] font-medium text-success-500 inline-flex items-center gap-1.5">
                    <span className="live-dot" style={{ width: '0.4rem', height: '0.4rem', boxShadow: '0 0 0 3px rgba(52,199,89,0.15)' }} />
                    Live
                  </span>
                </div>
                <p className="text-ink-800 font-semibold text-xl tracking-tighter mb-2">{a.name}</p>
                <p className="text-ink-600 leading-relaxed mb-5">{a.line}</p>
                <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Try it free <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pick your seat */}
      <section className="py-16 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-3">Pick your seat</p>
            <h2 className="display text-4xl md:text-5xl mb-4">Built for the seat you sit in.</h2>
            <p className="text-ink-600 text-lg max-w-2xl mx-auto">Each role sees the screen they actually need. Each page comes with three free agents to try right now.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {C_SUITE.map((s) => (
              <Link key={s.h} href={s.href} className="card group p-7 block hover:-translate-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-2">For the</p>
                <p className="display text-3xl text-ink-800 mb-3">{s.h}</p>
                <p className="text-ink-600 text-[15px] leading-relaxed mb-5">{s.line}</p>
                <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">See your view <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FRONTLINE.map((s) => (
              <Link key={s.h} href={s.href} className="card group p-7 block hover:-translate-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-2">For the</p>
                <p className="display text-3xl text-ink-800 mb-3">{s.h}</p>
                <p className="text-ink-600 text-[15px] leading-relaxed mb-5">{s.line}</p>
                <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">See your view <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Three receipts */}
      <section className="py-16 md:py-28 px-6 bg-ink-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-3">Three receipts</p>
            <h2 className="display text-4xl md:text-5xl mb-4">No slides. No promises.</h2>
            <p className="text-ink-600 text-lg">Three numbers we can defend line by line.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {RECEIPTS.map((r) => (
              <div key={r.label} className="card p-8">
                <p className="font-mono tabular-nums display text-3xl md:text-4xl mb-3 text-ink-800">{r.big}</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-3">{r.label}</p>
                <p className="text-ink-600 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-200 rounded-2xl overflow-hidden border border-ink-200">
            {STATS.map((s) => (
              <div key={s.l} className="bg-white px-6 py-8 text-center">
                <p className="font-mono tabular-nums text-2xl md:text-3xl font-bold text-ink-800 tracking-tighter">{s.v}</p>
                <p className="text-ink-500 text-[11px] uppercase tracking-widest font-medium mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust move */}
      <section className="py-16 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-5">Last quarter we said $8.3M. The honest number was $1.81M.</p>
          <p className="display text-5xl md:text-7xl font-mono tabular-nums mb-7">
            <span className="text-ink-400">$8.3M</span>
            <span className="text-ink-300 mx-3">→</span>
            <span className="text-ink-800">$1.81M</span>
          </p>
          <p className="text-ink-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Every other vendor brags about accuracy gains. We do the opposite — we publish the corrections.
            When our model overstated the recovery surface, we walked it back to the figure we can defend to the penny.
            <Link href="/answers/walked-the-number-back" className="link-accent ml-1.5">Here&apos;s how we caught it.</Link>
          </p>
        </div>
      </section>

      {/* Stack overview */}
      <section className="py-16 md:py-24 px-6 bg-ink-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-3">The platform</p>
            <h2 className="display text-4xl md:text-5xl mb-4">Everything in one place.</h2>
          </div>
          <div className="card divide-y divide-ink-200">
            {STACK.map((row) => (
              <div key={row.name} className="p-7 first:rounded-t-[18px] last:rounded-b-[18px]">
                <p className="text-ink-800 font-semibold text-lg tracking-tighter">{row.name}</p>
                <p className="text-ink-600 mt-1.5 leading-relaxed">{row.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Talk to us */}
      <section id="offer" className="py-16 md:py-28 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-3">Talk to us</p>
          <h2 className="display text-4xl md:text-5xl mb-4">15 minutes. Receipts.</h2>
          <p className="text-ink-600 text-lg mb-10">
            We onboard a small group of multi-unit operators per cohort. Real data, real numbers, a direct line to the founder.
          </p>
          {status === 'success' ? (
            <div className="card p-10">
              <p className="text-ink-800 text-xl font-semibold mb-2">{message}</p>
              <p className="text-ink-600">Check your email — we sent you a welcome note.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-7 space-y-3 text-left">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="text" placeholder="Restaurant or group name (optional)" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50">
                {status === 'loading' ? 'Sending…' : 'Request access'}
              </button>
              {status === 'error' && <p className="text-danger-500 text-sm text-center">{message}</p>}
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-ink-500 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by an operator, for operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" className="hover:text-ink-800 transition-colors">Pick your seat</Link>
            <Link href="/answers" className="hover:text-ink-800 transition-colors">Answers</Link>
            <Link href="/operators" className="hover:text-ink-800 transition-colors">Operators</Link>
            <Link href="/press" className="hover:text-ink-800 transition-colors">Press</Link>
            <Link href="/reports/login" className="hover:text-ink-800 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
