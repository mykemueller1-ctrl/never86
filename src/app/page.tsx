'use client';

import Link from 'next/link';
import { useState } from 'react';

const FREE_AGENTS = [
  { name: 'Void Hunter', href: '/demo/void-hunter', tag: 'Voids' },
  { name: '3P Fee Finder', href: '/demo/3p-fee-finder', tag: 'Delivery' },
  { name: 'Labor Leak', href: '/demo/labor-leak', tag: 'Labor' },
  { name: 'Tip Variance', href: '/demo/tip-variance', tag: 'Tips' },
  { name: 'Catering Leak', href: '/demo/catering-leak', tag: 'Catering' },
  { name: 'Rate Card Audit', href: '/demo/rate-card-audit', tag: '3P Rates' },
  { name: 'Shift Pulse', href: '/demo/shift-pulse', tag: 'Shift' },
];

const SEATS = [
  { h: 'A', name: 'All',     tag: 'Overview',       href: '/for', active: true },
  { h: 'C', name: 'CEO',     tag: 'Network',        href: '/for/ceo' },
  { h: 'F', name: 'CFO',     tag: 'Books',          href: '/for/cfo' },
  { h: 'O', name: 'COO',     tag: 'Floor',          href: '/for/coo' },
  { h: 'T', name: 'CTO',     tag: 'Stack',          href: '/for/cto' },
  { h: 'W', name: 'Owner',   tag: 'Solo',           href: '/for/owner' },
  { h: 'M', name: 'Manager', tag: 'Shift',          href: '/for/manager' },
  { h: 'R', name: 'Crew',    tag: 'Drift',          href: '/for/crew' },
];

const SECTIONS = [
  { n: '01', label: 'Free Agents',    href: '#agents' },
  { n: '02', label: 'Pick Your Seat', href: '#seats' },
  { n: '03', label: 'The Correction', href: '/case/walked-the-number-back' },
  { n: '04', label: 'Onboard',        href: '/onboard' },
  { n: '05', label: 'Operators',      href: '/operators' },
  { n: '06', label: 'Answers',        href: '/answers' },
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
    <main className="compass min-h-screen">
      {/* Top brand row */}
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <span className="compass-mark">N</span>
            <div>
              <p className="font-serif text-[28px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">for operators</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">
                Operator OS · 7 free agents · built by operators
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[13px] text-white tabular-nums">$1.81M RECOVERED · 545,677 ORDERS</p>
            <p className="compass-eyebrow-dim mt-1">
              DMV · NASHVILLE · RALEIGH <span className="ml-3"><span className="compass-live-dot" />LIVE</span>
            </p>
          </div>
        </div>

        {/* Persona pill row */}
        <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
          {SEATS.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              className={`compass-pill ${s.active ? 'is-active' : ''}`}
            >
              <span className="avatar">{s.h}</span>
              <span>{s.name}</span>
              <span className="tag">{s.tag}</span>
            </Link>
          ))}
        </div>

        {/* Numbered section nav */}
        <nav className="compass-section-nav mt-6">
          {SECTIONS.map((s) => (
            <Link key={s.n} href={s.href}>
              <span className="num">{s.n}</span>
              <span>{s.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 md:pb-20">
        <p className="compass-eyebrow mb-6">
          — Operator OS · Network Operating Layer
        </p>
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">
          <div>
            <h1 className="compass-display text-5xl md:text-7xl lg:text-[88px] mb-10">
              Find the leak. <em>Name who</em><br />
              owns it. <em>Keep</em> the receipt.
            </h1>
            <p className="compass-body text-lg md:text-xl max-w-2xl">
              Seven agents read your sales, labor, voids, 3P fees, tips, catering, and shift sentiment.
              Every figure source-tagged. Every recovery owned by a name. The platform every operator wishes their POS gave them.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>
                60 minutes free · drop a CSV →
              </Link>
              <Link href="/pricing" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>
                See pricing
              </Link>
            </div>
          </div>

          {/* Right sidebar card */}
          <aside className="compass-card">
            <p className="compass-card-label">This view · primary audience</p>
            <h3>You · Operator</h3>
            <p className="compass-eyebrow mb-4" style={{ letterSpacing: '0.08em' }}>
              Owner · Signing authority · Sees every figure
            </p>
            <p className="compass-body text-[14.5px]">
              <span className="text-white font-semibold">What you own:</span> P&amp;L,
              vendor relationships, the next hire, the board narrative.
              This view is the 30-second daily read on all of it.
            </p>
          </aside>
        </div>

        {/* KPI strip — compass dark */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
          <div className="compass-kpi">
            <p className="compass-kpi-label">Recovered · network</p>
            <p className="compass-kpi-val">$<span>1.81</span><span className="unit">M</span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Orders reconciled</p>
            <p className="compass-kpi-val">545<span className="unit">,677</span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Free agents live</p>
            <p className="compass-kpi-val">7<span className="unit"></span></p>
          </div>
          <div className="compass-kpi">
            <p className="compass-kpi-label">Self-onboard</p>
            <p className="compass-kpi-val">15<span className="unit">min</span></p>
          </div>
        </div>
      </section>

      {/* Free agents */}
      <section id="agents" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 01 · Free agents</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-12">
            Try one. <em>Right now.</em>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREE_AGENTS.map((a) => (
              <Link key={a.name} href={a.href} className="compass-card hover:border-[#0066ff] transition-colors block group">
                <p className="compass-card-label">{a.tag}</p>
                <h3 className="!mt-3">{a.name}</h3>
                <p className="compass-body text-[14px] mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>
                  Try it free <span aria-hidden>→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pick your seat */}
      <section id="seats" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="compass-eyebrow mb-4">— 02 · Pick your seat</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-12">
            One platform. <em>Seven roles.</em>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {SEATS.slice(1).map((s) => (
              <Link key={s.name} href={s.href} className="compass-card hover:border-[#0066ff] transition-colors text-center block">
                <p className="compass-card-label">{s.tag}</p>
                <p className="font-serif text-2xl md:text-3xl mt-2 text-white">{s.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Talk to us */}
      <section id="offer" className="border-t border-[#1f1f1f] py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="compass-eyebrow mb-4 text-center">— 03 · 15 minutes</p>
          <h2 className="compass-display text-4xl md:text-6xl mb-10 text-center">
            One call. <em>One signal.</em>
          </h2>
          {status === 'success' ? (
            <div className="compass-card text-center">
              <p className="font-serif text-2xl text-white">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="compass-card space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors"
              />
              <input
                type="text"
                placeholder="Restaurant or group"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full disabled:opacity-50"
                style={{ background: '#0066ff' }}
              >
                {status === 'loading' ? 'Sending…' : 'Talk to us'}
              </button>
              {status === 'error' && <p className="text-[#ff453a] text-sm text-center">{message}</p>}
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for"     className="hover:text-white transition-colors">Seats</Link>
            <Link href="/people"  className="hover:text-white transition-colors">People</Link>
            <Link href="/onboard" className="hover:text-white transition-colors">Onboard</Link>
            <Link href="/reports/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
