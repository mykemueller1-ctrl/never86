'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthHonestyLine } from '@/components/AuthHonestyLine';
import { trackPublic } from '@/lib/publicAnalytics';
import {
  ACTIVATE_FAILURE_LOGOUT_PATH,
  decideActivateClientOutcome,
} from '@/lib/operatorActivateHttp';
import type { HonestyLabel } from '@/lib/oneSeatPublicWin';
import {
  EMAIL_BRAND_BLUE,
  MAX_FREE_SEAT_PASSWORD_LEN,
  MIN_FREE_SEAT_PASSWORD_LEN,
  OWNER_DESK_POST_AUTH_REDIRECT,
} from '@/lib/ownerDeskAuth';

type Status = 'loading' | 'error' | 'set-password' | 'done';

const FONT_STACK =
  "var(--font-display), Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const labelClass = 'block text-[14px] font-medium text-[#0f172a] mb-1.5';
const inputClass =
  'w-full rounded-lg border border-[#d0d5dd] bg-white px-3.5 py-2.5 text-[15px] text-[#0f172a] placeholder-[#98a2b3] shadow-sm transition focus:border-[#285be8] focus:outline-none focus:ring-4 focus:ring-[#285be8]/15';

export default function ActivateClient() {
  const params = useSearchParams();
  const token = useMemo(() => params.get('token')?.trim() || '', [params]);
  const started = useRef(false);
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Verifying your email…');
  const [redirect, setRedirect] = useState(OWNER_DESK_POST_AUTH_REDIRECT as string);
  const [password, setPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState('');
  const [honesty, setHonesty] = useState<HonestyLabel | null>(null);
  const [accountEmail, setAccountEmail] = useState('');

  function goToDesk() {
    window.location.replace(redirect);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setStatus('error');
      setMessage('This page needs the secure link from your email.');
      void fetch(ACTIVATE_FAILURE_LOGOUT_PATH, { method: 'POST' });
      return;
    }

    async function openOperator() {
      try {
        const res = await fetch('/api/onboard/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          redirect?: string;
          honesty?: 'Missing';
          code?: string;
        };
        const outcome = decideActivateClientOutcome({
          httpOk: res.ok,
          success: data.success,
          error: data.error,
          redirect: data.redirect,
          honesty: data.honesty === 'Missing' || data.code === 'operator_login_unavailable' ? 'Missing' : undefined,
        });
        if (outcome.kind === 'error') {
          setStatus('error');
          setHonesty(outcome.honesty === 'Missing' ? 'Missing' : null);
          setMessage(outcome.honesty === 'Missing' ? `${outcome.message} Honesty: Missing. The seat was not opened.` : outcome.message);
          void fetch(ACTIVATE_FAILURE_LOGOUT_PATH, { method: 'POST' });
          return;
        }
        setRedirect(outcome.href);
        setStatus('set-password');
        setMessage('Email verified. Choose a password — you’ll use it with this email to sign in.');
        // UI only: read the signed-in email (existing read-only endpoint) so password
        // managers save the new password under the right account.
        void fetch('/api/operator/stores', { credentials: 'same-origin' })
          .then((r) => (r.ok ? r.json() : null))
          .then((info: { email?: unknown } | null) => {
            if (info && typeof info.email === 'string') setAccountEmail(info.email);
          })
          .catch(() => undefined);
      } catch (err: unknown) {
        setStatus('error');
        setHonesty('Missing');
        setMessage(`${err instanceof Error ? err.message : 'Sign-in failed'} Honesty: Missing. The seat was not opened.`);
        void fetch(ACTIVATE_FAILURE_LOGOUT_PATH, { method: 'POST' });
      }
    }

    void openOperator();
  }, [token]);

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_FREE_SEAT_PASSWORD_LEN) {
      setPasswordStatus('error');
      setPasswordError(`Password must be at least ${MIN_FREE_SEAT_PASSWORD_LEN} characters.`);
      return;
    }
    if (password.length > MAX_FREE_SEAT_PASSWORD_LEN) {
      setPasswordStatus('error');
      setPasswordError(`Password must be at most ${MAX_FREE_SEAT_PASSWORD_LEN} characters.`);
      return;
    }
    setPasswordStatus('saving');
    setPasswordError('');
    try {
      const res = await fetch('/api/operator/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { success?: boolean; error?: string; honesty?: HonestyLabel };
      if (!res.ok || !data.success) {
        const missing = data.honesty === 'Missing' || res.status === 503;
        const error = data.error || 'Could not save your password.';
        if (missing) {
          const note = `${error} Honesty: Missing. The password was not saved.`;
          setHonesty('Missing');
          setPasswordStatus('error');
          setPasswordError(note);
          setMessage(note);
          return;
        }
        setHonesty(null);
        throw new Error(error);
      }
      setStatus('done');
      setMessage('Password saved. Opening your operator…');
      trackPublic('signup_complete', { path: '/activate' });
      goToDesk();
    } catch (err: unknown) {
      setPasswordStatus('error');
      setPasswordError(err instanceof Error ? err.message : 'Could not save your password.');
    }
  }

  const heading =
    honesty === 'Missing'
      ? 'That didn’t finish'
      : status === 'error'
        ? 'This link didn’t work'
        : status === 'done'
          ? 'Password saved'
          : status === 'loading'
            ? 'Checking your link…'
            : 'Set your password';

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
          <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#0f172a]">{heading}</h1>
          {honesty ? (
            <div className="mt-3">
              <AuthHonestyLine honesty={honesty} message={message} />
            </div>
          ) : (
            <p
              className={`mt-1.5 text-[15px] leading-6 ${status === 'error' ? 'text-[#b42318]' : 'text-[#475569]'}`}
              role={status === 'error' ? 'alert' : 'status'}
            >
              {message}
            </p>
          )}
          {status === 'loading' || status === 'done' ? (
            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2ff]">
              <div className="h-full w-2/3 animate-pulse rounded-full" style={{ background: EMAIL_BRAND_BLUE }} />
            </div>
          ) : null}
          {status === 'set-password' ? (
            <form onSubmit={onSetPassword} className="mt-6 space-y-4">
              {accountEmail ? (
                <div>
                  <label htmlFor="activate-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="activate-email"
                    name="username"
                    type="email"
                    autoComplete="username"
                    value={accountEmail}
                    readOnly
                    className={inputClass.replace('bg-white', 'bg-[#f9fafb]').replace('text-[#0f172a]', 'text-[#475569]')}
                  />
                </div>
              ) : null}
              <div>
                <label htmlFor="activate-password" className={labelClass}>
                  New password
                </label>
                <input
                  id="activate-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={MIN_FREE_SEAT_PASSWORD_LEN}
                  maxLength={MAX_FREE_SEAT_PASSWORD_LEN}
                  required
                  aria-describedby="activate-password-hint"
                  className={inputClass}
                />
                <p id="activate-password-hint" className="mt-1.5 text-[13px] text-[#64748b]">
                  At least {MIN_FREE_SEAT_PASSWORD_LEN} characters.
                </p>
              </div>
              <button
                type="submit"
                disabled={passwordStatus === 'saving'}
                className="w-full rounded-lg px-4 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[#285be8]/25 disabled:opacity-60"
                style={{ background: EMAIL_BRAND_BLUE }}
              >
                {passwordStatus === 'saving' ? 'Saving…' : 'Save password & open my operator'}
              </button>
              {passwordStatus === 'error' ? (
                <p className="text-[14px] leading-5 text-[#b42318]" role="alert">{passwordError}</p>
              ) : null}
            </form>
          ) : null}
          {status === 'error' ? (
            <div className="mt-6 space-y-3">
              <Link
                href="/login"
                className="block w-full rounded-lg px-4 py-2.5 text-center text-[15px] font-semibold text-white shadow-sm hover:brightness-95"
                style={{ background: EMAIL_BRAND_BLUE }}
              >
                Go to sign in
              </Link>
              <p className="text-center text-[14px] text-[#475569]">
                Need a password link?{' '}
                <Link href="/onboard" className="font-medium hover:underline" style={{ color: EMAIL_BRAND_BLUE }}>
                  Send it again
                </Link>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
