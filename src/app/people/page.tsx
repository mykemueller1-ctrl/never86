'use client';

import Link from 'next/link';
import { useState } from 'react';

const PILLARS = [
  { name: 'Shift Pulse', body: 'Tonight\'s shift in one screen. Covers vs forecast, station median, the goal, the streak.', href: '/demo/shift-pulse', status: 'live' as const },
  { name: 'Knowledge Brain', body: 'Recipes, specs, service rules, the answers your line asks every shift.', status: 'coming' as const },
  { name: 'Achievements', body: 'Streaks that mean something. Voids under the line. Upsell records. Zero-comp shifts.', status: 'coming' as const },
];

export default function PeoplePage() {
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
        body: JSON.stringify({
          email,
          name,
          restaurantName,
          agentRequested: 'CTAP · People platform',
          sourcePage: '/people',
        }),
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

      {/* Hero */}
      <section className="pt-28 md:pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-5">Product 02 · coming</p>
          <h1 className="display text-5xl md:text-7xl lg:text-8xl mb-8">
            The crew sees<br />
            what the back office sees.
          </h1>
          <p className="text-ink-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Built on a real restaurant. Storm Lake, Iowa. 41 staff, 7 departments, every shift on one screen.
          </p>
          <a href="#notify" className="btn-primary">Get notified</a>
        </div>
      </section>

      {/* Three pillars */}
      <section className="py-20 md:py-28 px-6 bg-ink-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="display text-4xl md:text-6xl text-center mb-14">Three pillars.</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PILLARS.map((p) =>
              p.status === 'live' && p.href ? (
                <Link key={p.name} href={p.href} className="card group p-8 block hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="display text-2xl text-ink-800">{p.name}</p>
                    <span className="text-[11px] font-medium text-success-500 inline-flex items-center gap-1.5">
                      <span className="live-dot" style={{ width: '0.4rem', height: '0.4rem', boxShadow: '0 0 0 3px rgba(52,199,89,0.15)' }} />
                      Live
                    </span>
                  </div>
                  <p className="text-ink-600 leading-relaxed mb-5">{p.body}</p>
                  <p className="text-ink-800 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Try it free <span aria-hidden>→</span></p>
                </Link>
              ) : (
                <div key={p.name} className="card p-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="display text-2xl text-ink-800">{p.name}</p>
                    <span className="text-[11px] font-medium text-ink-500 inline-flex items-center gap-1.5">Coming</span>
                  </div>
                  <p className="text-ink-600 leading-relaxed">{p.body}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Why it's different */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-5">The thesis</p>
          <h2 className="display text-3xl md:text-5xl mb-6">
            People-native AI.<br />Not back-office software with a chat box.
          </h2>
          <p className="text-ink-600 text-lg md:text-xl leading-relaxed">
            Every other restaurant tool was built for the office. We&apos;re building one for the floor — and giving the office a window into it.
          </p>
        </div>
      </section>

      {/* Notify form */}
      <section id="notify" className="py-20 md:py-28 px-6 bg-ink-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="display text-4xl md:text-5xl mb-3">Get notified.</h2>
          <p className="text-ink-600 text-lg mb-10">We&apos;ll reach out when CTAP opens to a cohort.</p>
          {status === 'success' ? (
            <div className="card p-10">
              <p className="text-ink-800 text-xl font-semibold mb-2">{message}</p>
              <p className="text-ink-600">You&apos;re first in line.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-7 space-y-3 text-left">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors" />
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50">
                {status === 'loading' ? 'Sending…' : 'Get notified'}
              </button>
              {status === 'error' && <p className="text-danger-500 text-sm text-center">{message}</p>}
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-ink-200 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-ink-500 text-[12px]">
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
