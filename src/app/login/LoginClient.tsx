'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthHonestyLine } from '@/components/AuthHonestyLine';
import {
  EMAIL_BRAND_BLUE,
  MAX_FREE_SEAT_PASSWORD_LEN,
  MIN_FREE_SEAT_PASSWORD_LEN,
  OWNER_DESK_POST_AUTH_REDIRECT,
} from '@/lib/ownerDeskAuth';
import type { HonestyLabel } from '@/lib/oneSeatPublicWin';
import { PortalHouseDisclosure } from '../portal/PortalHouseForm';

const FONT_STACK =
  "var(--font-display), Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const labelClass = 'block text-[14px] font-medium text-[#0f172a] mb-1.5';
const inputClass =
  'w-full rounded-lg border border-[#d0d5dd] bg-white px-3.5 py-2.5 text-[15px] text-[#0f172a] placeholder-[#98a2b3] shadow-sm transition focus:border-[#285be8] focus:outline-none focus:ring-4 focus:ring-[#285be8]/15';

type SeatChoice = { restaurantName: string };

export default function OperatorLoginPage({
  showHouseCode = false,
  returnTo = null,
}: {
  showHouseCode?: boolean;
  returnTo?: string | null;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [seats, setSeats] = useState<SeatChoice[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error' | 'pick'>('idle');
  const [message, setMessage] = useState('');
  const [honesty, setHonesty] = useState<HonestyLabel | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  function showClosed(data: { error?: string; honesty?: HonestyLabel; code?: string }, fallback: string) {
    const missing = data.honesty === 'Missing' || data.code === 'operator_login_unavailable' || data.code === 'activation_email_unavailable' || data.code === 'neon_unavailable';
    setHonesty(missing ? 'Missing' : null);
    setStatus('error');
    const error = data.error || fallback;
    setMessage(missing ? `${error} Honesty: Missing. Sign-in did not succeed.` : error);
  }

  async function onPasswordSubmit(restaurantName: string) {
    setStatus('loading');
    setMessage('');
    setHonesty(null);
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
        honesty?: HonestyLabel;
        seats?: SeatChoice[];
      };
      if (data.honesty === 'Missing' || data.code === 'operator_login_unavailable' || res.status === 503) {
        showClosed(data, "Operator login isn't switched on yet.");
        return;
      }
      if (data.code === 'pick_store') {
        setSeats(Array.isArray(data.seats) ? data.seats : []);
        setStatus('pick');
        setMessage('Signed in. Which store?');
        return;
      }
      if (data.code === 'unknown_store') {
        setSeats(Array.isArray(data.seats) ? data.seats : []);
        setStatus('error');
        setMessage(data.error || 'That store is not on this email.');
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error || 'Wrong email or password.');
      window.location.assign(returnTo || data.redirect || OWNER_DESK_POST_AUTH_REDIRECT);
    } catch (err: unknown) {
      setHonesty(null);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Wrong email or password.');
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setHonesty(null);
    try {
      const res = await fetch('/api/onboard/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'reset', sourcePage: '/login/reset' }),
      });
      const data = await res.json() as { success?: boolean; error?: string; message?: string; code?: string; honesty?: HonestyLabel };
      if (!res.ok || !data.success) {
        showClosed(data, 'Could not send the reset link.');
        return;
      }
      setHonesty(null);
      setStatus('sent');
      setMessage(data.message || 'Check your email for a set-password link.');
    } catch (err: unknown) {
      setHonesty('Missing');
      setStatus('error');
      setMessage(`${err instanceof Error ? err.message : 'Could not send the reset link.'} Honesty: Missing. Sign-in did not succeed.`);
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
    <main className="min-h-screen bg-[#f4f5f7] text-[#0f172a] antialiased" style={{ fontFamily: FONT_STACK }}>
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-5 py-12">
        <Link
          href="/"
          aria-label="Never86 home"
          className="mb-6 self-center text-[22px] font-bold leading-none tracking-[-0.02em] text-[#0f172a]"
        >
          Never<span style={{ color: EMAIL_BRAND_BLUE }}>86</span>
        </Link>

        <div className="rounded-xl border border-[#e5e7eb] bg-white px-6 py-8 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:px-8">
          <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#0f172a]">
            {resetOpen ? 'Get a password link' : 'Sign in'}
          </h1>
          <p className="mt-1.5 text-[15px] leading-6 text-[#475569]">
            {resetOpen
              ? 'Enter your account email and we’ll send you a link to set your password.'
              : 'Sign in with your Email + password.'}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className={labelClass}>
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            {resetOpen ? null : (
              <div>
                <label htmlFor="login-password" className={labelClass}>
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_FREE_SEAT_PASSWORD_LEN}
                  maxLength={MAX_FREE_SEAT_PASSWORD_LEN}
                  className={inputClass}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={status === 'loading' || status === 'sent'}
              className="w-full rounded-lg px-4 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[#285be8]/25 disabled:opacity-60"
              style={{ background: EMAIL_BRAND_BLUE }}
            >
              {resetOpen
                ? (status === 'loading' ? 'Sending…' : status === 'sent' ? 'Link sent' : 'Email me a set-password link')
                : (status === 'loading' ? 'Signing in…' : 'Sign in')}
            </button>
            <AuthHonestyLine
              honesty={honesty}
              message={message}
              className={`text-[14px] leading-5 ${status === 'error' ? 'text-[#b42318]' : status === 'pick' ? 'font-medium text-[#0f172a]' : 'text-[#067647]'}`}
            />
            {seats.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {seats.map((seat) => (
                  <button
                    key={seat.restaurantName}
                    type="button"
                    onClick={() => {
                      setStoreName(seat.restaurantName);
                      void onPasswordSubmit(seat.restaurantName);
                    }}
                    className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-1.5 text-[13px] font-medium text-[#0f172a] hover:border-[#285be8]"
                  >
                    {seat.restaurantName}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setResetOpen((open) => !open);
                  setStatus('idle');
                  setMessage('');
                  setHonesty(null);
                }}
                className="text-[14px] font-medium hover:underline"
                style={{ color: EMAIL_BRAND_BLUE }}
              >
                {resetOpen ? 'Back to sign in' : 'Forgot password? Email a set-password link'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-[14px] text-[#475569]">
          New to Never86?{' '}
          <Link href="/onboard" className="font-medium hover:underline" style={{ color: EMAIL_BRAND_BLUE }}>
            Create your account
          </Link>
        </p>
        {showHouseCode ? (
          <PortalHouseDisclosure />
        ) : (
          <p className="mt-2 text-center text-[14px] text-[#475569]">
            <Link href="/portal" className="hover:underline" style={{ color: EMAIL_BRAND_BLUE }}>
              Have a store house code?
            </Link>
          </p>
        )}
        {/* Google papers connect after sign-in on the owner seat; a missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET stays Missing there. */}
        <p className="mt-2 text-center text-[13px] text-[#64748b]">
          After you sign in, connect Gmail + Drive in{' '}
          <Link href="/operator#papers-settings" className="underline">
            settings
          </Link>
          .
        </p>
        <p className="mt-3 text-center text-[12px] leading-5 text-[#98a2b3]">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline">terms</Link> and{' '}
          <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    </main>
  );
}
