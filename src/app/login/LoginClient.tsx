'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MAX_FREE_SEAT_PASSWORD_LEN, MIN_FREE_SEAT_PASSWORD_LEN, OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';

const inputClass =
  'w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors';

type SeatChoice = { restaurantName: string };

export default function OperatorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [seats, setSeats] = useState<SeatChoice[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  async function onPasswordSubmit(restaurantName: string) {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/operator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          storeName: restaurantName,
          restaurantName,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        redirect?: string;
        code?: string;
        seats?: SeatChoice[];
      };
      if (data.code === 'pick_store' || data.code === 'unknown_store') {
        setSeats(Array.isArray(data.seats) ? data.seats : []);
        setStatus('error');
        setMessage(data.error || 'Pick the store for this sign-in.');
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error || 'Wrong email or password.');
      window.location.assign(data.redirect || OWNER_DESK_POST_AUTH_REDIRECT);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Wrong email or password.');
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/onboard/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'reset', sourcePage: '/login/reset' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not send the reset link.');
      setStatus('sent');
      setMessage(data.message || 'Check your email for a set-password link.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Could not send the reset link.');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (resetOpen) {
      await onReset(e);
      return;
    }
    await onPasswordSubmit(storeName.trim().replace(/\s+/g, ' '));
  }

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">
              Never 86&apos;d <span className="italic text-ink-600">· operator login</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">One email + one password · every store</p>
          </span>
        </Link>
      </div>

      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28">
        <p className="compass-eyebrow mb-4">— Same login for every store on this email.</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Open your operator.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          {resetOpen
            ? 'We email a set-password link. After you set it, come back here with email + password.'
            : 'Email + password. One account opens every store on this email. Switch stores on the desk — no second login email.'}
        </p>

        <form onSubmit={onSubmit} className="compass-card space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="you@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          {resetOpen ? null : (
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_FREE_SEAT_PASSWORD_LEN}
              maxLength={MAX_FREE_SEAT_PASSWORD_LEN}
              className={inputClass}
            />
          )}
          <button type="submit" disabled={status === 'loading' || status === 'sent'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
            {resetOpen
              ? (status === 'loading' ? 'Sending…' : status === 'sent' ? 'Link sent ✓' : 'Email me a set-password link →')
              : (status === 'loading' ? 'Signing in…' : 'Sign in →')}
          </button>
          {message ? <p className={`text-sm text-center ${status === 'error' ? 'text-[#ff453a]' : 'text-[#248a3d]'}`}>{message}</p> : null}
          {seats.length > 1 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {seats.map((seat) => (
                <button
                  key={seat.restaurantName}
                  type="button"
                  onClick={() => {
                    setStoreName(seat.restaurantName);
                    void onPasswordSubmit(seat.restaurantName);
                  }}
                  className="rounded-full px-3 py-1 text-[12px] font-medium text-white"
                  style={{ background: '#0066ff' }}
                >
                  {seat.restaurantName}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setResetOpen((open) => !open);
              setStatus('idle');
              setMessage('');
            }}
            className="w-full text-center text-[13px] text-[#6e6e73] underline underline-offset-2"
          >
            {resetOpen ? 'Back to email + password' : 'Forgot password? Email a set-password link'}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-[#86868b]">
            Account email only — access plus essential product help. No marketing list. By continuing, you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
          </p>
        </form>

        <p className="compass-body text-[13px] mt-6" style={{ color: '#6e6e73' }}>
          Magic link is set-password / reset only. Daily door is email + password.
        </p>
        <p className="compass-body text-[13px] mt-4" style={{ color: '#6e6e73' }}>
          New here?{' '}
          <Link href="/onboard" className="underline" style={{ color: '#0066ff' }}>
            Claim the free owner seat
          </Link>
          {' '}
          with email + store name. House-code seats stay at{' '}
          <Link href="/portal" className="underline" style={{ color: '#0066ff' }}>
            /portal
          </Link>
          {' '}
          and fail-closed until a code is issued. No PIN, no staff name.
        </p>
      </section>
    </main>
  );
}
