'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';

type Status = 'loading' | 'error' | 'set-password' | 'done';

const MIN_PASSWORD_LEN = 8;

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

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setStatus('error');
      setMessage('This page needs the secure link from your email.');
      return;
    }

    async function openOperator() {
      try {
        const res = await fetch('/api/onboard/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Sign-in failed');
        setRedirect(data.redirect || OWNER_DESK_POST_AUTH_REDIRECT);
        setStatus('set-password');
        setMessage('Email verified. Set a password so you don\u2019t need a fresh email link next time.');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Sign-in failed');
      }
    }

    void openOperator();
  }, [token]);

  function goToDesk() {
    window.location.replace(redirect);
  }

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LEN) {
      setPasswordStatus('error');
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
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
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not save your password.');
      setStatus('done');
      setMessage('Password saved. Opening your operator\u2026');
      goToDesk();
    } catch (err: unknown) {
      setPasswordStatus('error');
      setPasswordError(err instanceof Error ? err.message : 'Could not save your password.');
    }
  }

  return (
    <main className="min-h-screen bg-[#0c1210] text-[#e8ebe6]">
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8fa898]">Never 86&apos;d · secure email sign-in</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-white">
          {status === 'error' ? 'That link did not open.' : 'You’re in.'}
        </h1>
        <p className="mt-4 text-[#b7c0b8] leading-relaxed" role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
        {status === 'loading' ? (
          <div className="mx-auto mt-8 h-2 w-32 overflow-hidden rounded-full bg-[#26312c]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#7eb6ff]" />
          </div>
        ) : null}
        {status === 'set-password' ? (
          <form onSubmit={onSetPassword} className="mt-8 space-y-3 text-left">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Choose a password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_PASSWORD_LEN}
              required
              className="w-full rounded-xl border border-[#26312c] bg-[#101815] px-4 py-3 text-white placeholder-[#6e7d72] outline-none focus:border-[#0066ff]"
            />
            <button
              type="submit"
              disabled={passwordStatus === 'saving'}
              className="w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#0066ff' }}
            >
              {passwordStatus === 'saving' ? 'Saving…' : 'Save password & open my operator →'}
            </button>
            {passwordStatus === 'error' ? (
              <p className="text-sm text-[#ff453a]" role="alert">{passwordError}</p>
            ) : null}
            <button
              type="button"
              onClick={goToDesk}
              className="w-full text-center text-[13px] text-[#8fa898] underline underline-offset-2"
            >
              Skip for now — keep using email links
            </button>
          </form>
        ) : null}
        {status === 'error' ? (
          <Link href="/login" className="mt-8 inline-flex rounded-full bg-[#e8ebe6] px-5 py-3 text-sm font-semibold text-[#0c1210]">
            Send me a new link →
          </Link>
        ) : null}
      </div>
    </main>
  );
}
