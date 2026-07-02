'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/track';
import { useState } from 'react';

const PILLARS = [
  { name: 'Shift Pulse',     tag: 'Tonight', body: "Tonight's shift in one screen. Covers vs forecast, station median, the goal, the streak.", href: '/demo/shift-pulse', status: 'live' as const },
  { name: 'Knowledge Brain', tag: 'Recipes', body: 'Recipes, specs, service rules, the answers your line asks every shift.', status: 'coming' as const },
  { name: 'Achievements',    tag: 'Streaks', body: 'Streaks that mean something. Voids under the line. Upsell records. Zero-comp shifts.', status: 'coming' as const },
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
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· people</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Product 02 · CTAP · coming</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/for" onClick={() => trackEvent('people_nav_click', { meta: { target: '/for', label: 'Seats' } })} className="compass-pill"><span className="avatar">S</span><span>Seats</span></Link>
            <Link href="/onboard" onClick={() => trackEvent('people_nav_click', { meta: { target: '/onboard', label: 'Onboard your store' } })} className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</Link>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-16">
        <p className="compass-eyebrow mb-6">— Product 02 · coming</p>
        <h1 className="compass-display text-5xl md:text-7xl lg:text-[88px] mb-10">
          The crew sees<br />
          <em>what the back office</em> sees.
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl mb-10">
          Built on a real restaurant. Fort Dodge, Iowa. 41 staff, 7 departments, every shift on one screen.
        </p>
        <a href="#notify" onClick={() => trackEvent('people_hero_cta_click', { meta: { target: '#notify', label: 'Get notified' } })} className="btn-primary" style={{ background: '#0066ff' }}>Get notified →</a>
      </section>

      <section className="border-t border-[#1f1f1f] py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="compass-eyebrow mb-4">— Three pillars</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            One floor. <em>Three signals.</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {PILLARS.map((p) =>
              p.status === 'live' && p.href ? (
                <Link key={p.name} href={p.href} className="compass-card hover:border-[#0066ff] transition-colors block group">
                  <div className="flex items-center justify-between">
                    <p className="compass-card-label">{p.tag}</p>
                    <span className="text-[11px] font-medium inline-flex items-center gap-1.5" style={{ color: '#34c759' }}>
                      <span className="compass-live-dot" style={{ marginRight: 0 }} />Live
                    </span>
                  </div>
                  <h3>{p.name}</h3>
                  <p className="compass-body text-[14px] mt-2 mb-5">{p.body}</p>
                  <p className="text-[14px] inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>Try it free <span aria-hidden>→</span></p>
                </Link>
              ) : (
                <div key={p.name} className="compass-card">
                  <div className="flex items-center justify-between">
                    <p className="compass-card-label">{p.tag}</p>
                    <span className="text-[11px] font-medium" style={{ color: '#6e6e73' }}>Coming</span>
                  </div>
                  <h3>{p.name}</h3>
                  <p className="compass-body text-[14px] mt-2">{p.body}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-20 md:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="compass-eyebrow mb-4">— The thesis</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            People-native AI. <em>Not back-office software</em> with a chat box.
          </h2>
          <p className="compass-body text-lg md:text-xl leading-relaxed">
            Every other restaurant tool was built for the office. We&apos;re building one for the floor — and giving the office a window into it.
          </p>
        </div>
      </section>

      <section id="notify" className="border-t border-[#1f1f1f] py-20 md:py-24 px-6">
        <div className="max-w-xl mx-auto">
          <p className="compass-eyebrow mb-4 text-center">— Get notified</p>
          <h2 className="compass-display text-4xl md:text-5xl mb-3 text-center">
            First <em>in line.</em>
          </h2>
          <p className="compass-body text-lg mb-10 text-center">We&apos;ll reach out when CTAP opens to a cohort.</p>
          {status === 'success' ? (
            <div className="compass-card text-center">
              <p className="font-serif text-2xl text-white mb-2">{message}</p>
              <p className="compass-body">You&apos;re first in line.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="compass-card space-y-3">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
                {status === 'loading' ? 'Sending…' : 'Get notified →'}
              </button>
              {status === 'error' && <p className="text-[#ff453a] text-sm text-center">{message}</p>}
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/for" onClick={() => trackEvent('people_footer_click', { meta: { target: '/for', label: 'Seats' } })} className="hover:text-white transition-colors">Seats</Link>
            <Link href="/reports/login" onClick={() => trackEvent('people_footer_click', { meta: { target: '/reports/login', label: 'Sign in' } })} className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
