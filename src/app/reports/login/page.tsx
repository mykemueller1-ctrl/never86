'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ReportsLogin() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/reports-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        const next = new URLSearchParams(window.location.search).get('next');
        const fallback = data.defaultNext || '/command-center';
        const isSafe = (p: string | null): p is string =>
          !!p && (p.startsWith('/reports') || p.startsWith('/command-center') || p.startsWith('/tools') || p.startsWith('/admin'));
        window.location.href = isSafe(next) ? next : fallback;
        return;
      }
      setStatus('error');
      setMessage(data.error || 'Try again.');
    } catch {
      setStatus('error');
      setMessage('Something went wrong.');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-ink-50">
      <div className="max-w-sm w-full">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10 group">
          <span className="brand-monogram" style={{ width: '1.6rem', height: '1.6rem', fontSize: '0.6rem' }}>N86</span>
          <span className="font-semibold tracking-tighter text-ink-800 text-lg">Never 86&apos;d</span>
        </Link>

        <div className="card p-7">
          <h1 className="display text-3xl mb-1.5 text-center">Sign in</h1>
          <p className="text-ink-500 text-sm mb-6 text-center">Operator access only.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary w-full disabled:opacity-60"
            >
              {status === 'loading' ? 'Checking…' : 'Enter'}
            </button>
            {status === 'error' ? <p className="text-danger-500 text-sm text-center">{message}</p> : null}
          </form>
        </div>

        <p className="text-ink-500 text-[12px] mt-6 text-center">
          Not an operator yet? <Link href="/operators#talk" className="text-ink-800 font-medium hover:underline">Start here</Link>
        </p>
      </div>
    </main>
  );
}
