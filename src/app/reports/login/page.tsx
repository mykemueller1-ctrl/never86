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
    <main className="compass min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <Link href="/" className="flex items-center justify-center gap-3 mb-10 group">
          <span className="compass-mark">N</span>
          <span className="font-serif text-[22px] text-white">
            Never 86&apos;d <span className="italic text-white/70">· sign in</span>
          </span>
        </Link>

        <div className="compass-card">
          <p className="compass-eyebrow text-center mb-3">— Operator portal</p>
          <h1 className="compass-display text-3xl mb-6 text-center">
            <em>Sign in.</em>
          </h1>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary w-full disabled:opacity-60"
              style={{ background: '#0066ff' }}
            >
              {status === 'loading' ? 'Checking…' : 'Enter →'}
            </button>
            {status === 'error' ? <p className="text-[#ff453a] text-sm text-center">{message}</p> : null}
          </form>
        </div>

        <p className="text-[#6e6e73] text-[12px] mt-6 text-center">
          Not an operator yet? <Link href="/onboard" className="text-white font-medium hover:underline">Onboard your store</Link>
        </p>
      </div>
    </main>
  );
}
