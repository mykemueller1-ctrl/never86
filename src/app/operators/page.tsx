'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/track';

const FREE_AGENTS = [
  { name: 'Void Hunter',    href: '/demo/void-hunter',    tag: 'Voids' },
  { name: '3P Fee Finder',  href: '/demo/3p-fee-finder',  tag: 'Delivery' },
  { name: 'Labor Leak',     href: '/demo/labor-leak',     tag: 'Labor' },
  { name: 'Tip Variance',   href: '/demo/tip-variance',   tag: 'Tips' },
  { name: 'Catering Leak',  href: '/demo/catering-leak',  tag: 'Catering' },
  { name: 'Shift Pulse',    href: '/demo/shift-pulse',    tag: 'Shift' },
];

export default function OperatorsLanding() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [units, setUnits] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => { trackEvent('operators_view'); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    trackEvent('operators_submit', { meta: { hasUnits: !!units } });
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, restaurantName, units, sourcePage: '/operators' }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || "You're on the list.");
        trackEvent('operators_submit_success', { meta: { hasUnits: !!units } });
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setStatus('error');
      setMessage(msg);
      trackEvent('operators_submit_error', { meta: { error: msg } });
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
                Never 86&apos;d <span className="italic text-white/70">for operators</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · 15 minutes</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/for" onClick={() => trackEvent('operators_nav_click', { meta: { target: '/for', label: 'Seats' } })} className="compass-pill"><span className="avatar">S</span><span>Seats</span></Link>
            <Link href="/onboard" onClick={() => trackEvent('operators_nav_click', { meta: { target: '/onboard', label: 'Onboard your store' } })} className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</Link>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-16">
        <p className="compass-eyebrow mb-6">— For operators</p>
        <h1 className="compass-display text-5xl md:text-7xl lg:text-[88px] mb-10">
          15 minutes. <em>One signal.</em><br />
          One <em>recovery.</em>
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link href="#talk" onClick={() => trackEvent('operators_hero_cta_click', { meta: { target: '#talk', label: 'Talk to us', variant: 'primary' } })} className="btn-primary" style={{ background: '#0066ff' }}>Talk to us →</Link>
          <Link href="/onboard" onClick={() => trackEvent('operators_hero_cta_click', { meta: { target: '/onboard', label: 'Onboard your store', variant: 'secondary' } })} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>Onboard your store</Link>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="compass-eyebrow mb-4">— Try a free agent</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            Try one. <em>Right now.</em>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREE_AGENTS.map((a) => (
              <Link key={a.name} href={a.href} className="compass-card hover:border-[#0066ff] transition-colors block group">
                <p className="compass-card-label">{a.tag}</p>
                <h3>{a.name}</h3>
                <p className="text-[14px] mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>Try it free <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="talk" className="border-t border-[#1f1f1f] py-20 md:py-24 px-6">
        <div className="max-w-xl mx-auto">
          <p className="compass-eyebrow mb-4 text-center">— Talk to us</p>
          <h2 className="compass-display text-4xl md:text-5xl mb-8 text-center">
            One call. <em>One signal.</em>
          </h2>
          {status === 'success' ? (
            <div className="compass-card text-center">
              <p className="font-serif text-2xl text-white">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="compass-card space-y-3">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <input type="number" min="1" placeholder="Units" value={units} onChange={(e) => setUnits(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
                {status === 'loading' ? 'Sending…' : 'Talk to us →'}
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
            <Link href="/for" onClick={() => trackEvent('operators_footer_click', { meta: { target: '/for', label: 'Seats' } })} className="hover:text-white transition-colors">Seats</Link>
            <Link href="/reports/login" onClick={() => trackEvent('operators_footer_click', { meta: { target: '/reports/login', label: 'Sign in' } })} className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
