'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Status = 'idle' | 'loading' | 'error' | 'done';

export default function ActivateClient() {
  const params = useSearchParams();
  const token = useMemo(() => params.get('token')?.trim() || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Missing activation token. Use the link from your email.');
      return;
    }
    if (password.length < 10) {
      setStatus('error');
      setMessage('Password must be at least 10 characters.');
      return;
    }
    if (password !== confirm) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/onboard/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Activation failed');
      }
      setStatus('done');
      window.location.href = data.redirect || '/dashboard';
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Activation failed');
    }
  }

  return (
    <main className="min-h-screen bg-[#0c1210] text-[#e8ebe6]">
      <div className="mx-auto max-w-lg px-5 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8fa898]">Free seat · one store · one login</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-white">Choose your password.</h1>
        <p className="mt-3 text-[#b7c0b8] leading-relaxed">
          We never email a starter password. After this, you land on an empty desk that asks only for
          yesterday&apos;s complete business-day close.
        </p>

        {!token ? (
          <div className="mt-8 rounded-xl border border-[#3a4540] bg-[#121a17] p-5 text-sm text-[#c9d2cb]">
            This page needs the link from your activation email.{' '}
            <Link href="/onboard" className="text-[#7eb6ff] underline">
              Request a new seat
            </Link>
            .
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#8fa898]">Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#3a4540] bg-[#121a17] px-4 py-3 text-white outline-none focus:border-[#7eb6ff]"
                minLength={10}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#8fa898]">Confirm</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-[#3a4540] bg-[#121a17] px-4 py-3 text-white outline-none focus:border-[#7eb6ff]"
                minLength={10}
                required
              />
            </label>
            {status === 'error' ? <p className="text-sm text-[#ff8f8f]">{message}</p> : null}
            <button
              type="submit"
              disabled={status === 'loading' || status === 'done'}
              className="w-full rounded-full bg-[#e8ebe6] px-5 py-3.5 text-sm font-semibold text-[#0c1210] disabled:opacity-60"
            >
              {status === 'loading' ? 'Activating…' : 'Activate my free seat →'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
