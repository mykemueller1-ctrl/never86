'use client';

import Link from 'next/link';
import { useState } from 'react';

const FREE_AGENTS = [
  { name: 'Void Hunter', href: '/demo/void-hunter' },
  { name: '3P Fee Finder', href: '/demo/3p-fee-finder' },
  { name: 'Labor Leak', href: '/demo/labor-leak' },
  { name: 'Tip Variance', href: '/demo/tip-variance' },
  { name: 'Catering Leak', href: '/demo/catering-leak' },
  { name: 'Shift Pulse', href: '/demo/shift-pulse' },
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
            <Link href="/reports/login" className="px-3 py-1.5 rounded-full text-ink-800 hover:bg-black/[0.04] font-medium">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="pt-24 md:pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="display text-5xl md:text-7xl lg:text-8xl mb-8">For operators.</h1>
          <Link href="#talk" className="btn-primary">Talk to us</Link>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 bg-ink-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="display text-3xl md:text-5xl text-center mb-12">Try one. Right now.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FREE_AGENTS.map((a) => (
              <Link key={a.name} href={a.href} className="card group p-8 block text-center hover:-translate-y-0.5">
                <p className="display text-2xl text-ink-800 mb-3">{a.name}</p>
                <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Try it free <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="talk" className="py-16 md:py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="display text-4xl md:text-5xl mb-8">15 minutes.</h2>
          {status === 'success' ? (
            <div className="card p-10">
              <p className="text-ink-800 text-xl font-semibold">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-7 space-y-3 text-left">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="number" min="1" placeholder="Units" value={units} onChange={(e) => setUnits(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50">
                {status === 'loading' ? 'Sending…' : 'Talk to us'}
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
            <Link href="/reports/login" className="hover:text-ink-800 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
