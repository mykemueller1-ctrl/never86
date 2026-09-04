'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/track';

type Status = 'idle' | 'loading' | 'sent' | 'error';

const PILLARS = [
  { title: 'Payroll', line: 'See labor creep before payroll closes.' },
  { title: 'Prices', line: 'Read every invoice line and catch SKU drift.' },
  { title: 'Process', line: 'Turn floor chaos into one next move.' },
] as const;

export default function OnboardPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => { trackEvent('onboard_view'); }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    trackEvent('onboard_submit', { meta: { path: 'email_only' } });
    try {
      const res = await fetch('/api/onboard/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sourcePage: '/onboard' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not send the link.');
      setStatus('sent');
      setMessage(data.message || 'Check your email for a secure sign-in link.');
      trackEvent('onboard_submit_success', { meta: { path: 'email_only' } });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Could not send the link.';
      setStatus('error');
      setMessage(error);
      trackEvent('onboard_submit_error', { meta: { path: 'email_only', error } });
    }
  }

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· 1–3 unit owner seat</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Seat 1 free · seats 2–3 paid later · not Command Center</p>
            </span>
          </Link>
          <Link href="/login" className="compass-pill"><span className="avatar">↗</span><span>Sign in</span></Link>
        </div>
      </div>

      <section className="px-6 pb-16 pt-14 md:pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <p className="compass-eyebrow mb-5">— 1–3 unit ICP · Payroll · Prices · Process</p>
              <h1 className="compass-display text-5xl md:text-7xl mb-5">
                Claim the <em>owner seat.</em>
              </h1>
              <p className="compass-body max-w-2xl text-lg md:text-xl leading-relaxed">
                Built for independent operators running one to three locations. Seat 1 belongs to the owner and is free for one store. Add seat 2 or seat 3 when a GM or station lead needs the same proof. Multi-unit Command Center stays a separate build.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {PILLARS.map((pillar) => (
                  <div className="compass-card" key={pillar.title}>
                    <p className="compass-card-label">{pillar.title}</p>
                    <p className="compass-body mt-2 text-sm leading-snug">{pillar.line}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="compass-card lg:sticky lg:top-8">
              <p className="compass-card-label" style={{ color: '#0066ff' }}>Free owner seat</p>
              <h2 className="mt-3 font-serif text-3xl text-[#1d1d1f]">Email. Click. You&apos;re in.</h2>
              <p className="compass-body mt-3 text-sm">No card. No password. Seat 1 is the owner seat for one store. Seats 2 and 3 stay locked until you expand.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@restaurant.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-3 text-ink-800 placeholder-[#a1a1a6] outline-none transition-colors focus:border-[#0066ff]"
                />
                <button type="submit" disabled={status === 'loading' || status === 'sent'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
                  {status === 'loading' ? 'Sending…' : status === 'sent' ? 'Check your email ✓' : 'Open Never 86’d →'}
                </button>
                {message ? <p className={`text-center text-sm ${status === 'error' ? 'text-[#ff453a]' : 'text-[#248a3d]'}`}>{message}</p> : null}
              </form>
              <p className="mt-4 text-[11px] leading-relaxed text-[#86868b]">
                We use this email only for account access and essential product messages. No marketing list. By continuing, you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
              </p>
              <div className="mt-6 border-t border-[#e8e8ed] pt-5">
                <Link href="/llm-shells" className="font-semibold text-[#0066ff] hover:underline">
                  Prefer ChatGPT? Open Never 86&apos;d there →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
