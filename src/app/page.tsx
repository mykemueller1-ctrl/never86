'use client';

import Link from 'next/link';
import { useState } from 'react';

const STATS = [
  { v: '$15.72M', l: 'reconciled' },
  { v: '545,677', l: 'orders read' },
  { v: '$1,043,797.69', l: 'to the cent' },
  { v: '16', l: 'stores live' },
];

const RECEIPTS = [
  { big: '$1,043,797.69', label: 'The canary' },
  { big: '$15.72M', label: 'The network' },
  { big: '$8.3M → $1.81M', label: 'The correction' },
];

const FREE_AGENTS = [
  { name: 'Void Hunter', href: '/demo/void-hunter', aud: 'Owner' },
  { name: '3P Fee Finder', href: '/demo/3p-fee-finder', aud: 'CFO' },
  { name: 'Labor Leak', href: '/demo/labor-leak', aud: 'COO' },
  { name: 'Tip Variance', href: '/demo/tip-variance', aud: 'Manager' },
  { name: 'Catering Leak', href: '/demo/catering-leak', aud: 'Owner' },
  { name: 'Shift Pulse', href: '/demo/shift-pulse', aud: 'Crew' },
];

const SEATS = [
  { h: 'CEO', href: '/for/ceo' },
  { h: 'CFO', href: '/for/cfo' },
  { h: 'COO', href: '/for/coo' },
  { h: 'CTO', href: '/for/cto' },
  { h: 'Owner', href: '/for/owner' },
  { h: 'Manager', href: '/for/manager' },
  { h: 'Crew', href: '/for/crew' },
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
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
          </Link>
          <nav className="flex items-center gap-1 text-[13px] text-ink-600">
            <Link href="/for" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden sm:inline">Pick your seat</Link>
            <Link href="/answers" className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04] hidden md:inline">Answers</Link>
            <Link href="/reports/login" className="px-3 py-1.5 rounded-full text-ink-800 hover:bg-black/[0.04] font-medium">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-20 md:pb-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="display text-6xl md:text-8xl lg:text-[104px] mb-8">
            Find the leak.<br />
            Name who owns it.<br />
            Keep the receipt.
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/for" className="btn-primary">Pick your seat</Link>
            <Link href="/demo/void-hunter" className="btn-secondary">Try a free agent</Link>
          </div>
        </div>
      </section>

      {/* Free agents */}
      <section className="py-16 md:py-24 px-6 bg-ink-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="display text-4xl md:text-6xl text-center mb-12">Try one. Right now.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FREE_AGENTS.map((a) => (
              <Link key={a.name} href={a.href} className="card group p-8 block hover:-translate-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-3">{a.aud}</p>
                <p className="text-ink-800 font-semibold text-2xl tracking-tighter mb-4">{a.name}</p>
                <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Try it free <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pick your seat */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="display text-4xl md:text-6xl text-center mb-12">Pick your seat.</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {SEATS.map((s) => (
              <Link key={s.h} href={s.href} className="card group p-6 block text-center hover:-translate-y-0.5">
                <p className="display text-2xl text-ink-800">{s.h}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Three receipts */}
      <section className="py-16 md:py-24 px-6 bg-ink-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {RECEIPTS.map((r) => (
              <div key={r.label} className="card p-10 text-center">
                <p className="font-mono tabular-nums display text-3xl md:text-4xl mb-3 text-ink-800">{r.big}</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Trust move — pure numbers */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="display text-6xl md:text-8xl font-mono tabular-nums mb-6">
            <span className="text-ink-400">$8.3M</span>
            <span className="text-ink-300 mx-3">→</span>
            <span className="text-ink-800">$1.81M</span>
          </p>
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest">The correction</p>
        </div>
      </section>

      {/* Talk to us */}
      <section id="offer" className="py-16 md:py-24 px-6 bg-ink-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="display text-4xl md:text-5xl mb-8">15 minutes.</h2>
          {status === 'success' ? (
            <div className="card p-10">
              <p className="text-ink-800 text-xl font-semibold mb-2">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-7 space-y-3 text-left">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="text" placeholder="Restaurant or group (optional)" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
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
            <span>Never 86&apos;d</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" className="hover:text-ink-800 transition-colors">Seats</Link>
            <Link href="/answers" className="hover:text-ink-800 transition-colors">Answers</Link>
            <Link href="/mcp" className="hover:text-ink-800 transition-colors">For AI</Link>
            <Link href="/press" className="hover:text-ink-800 transition-colors">Press</Link>
            <Link href="/reports/login" className="hover:text-ink-800 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
