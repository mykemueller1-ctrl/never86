'use client';

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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(212,154,14,0.18), transparent 65%), radial-gradient(40% 40% at 50% 100%, rgba(226,92,18,0.12), transparent 65%)' }} />
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

      <div className="relative max-w-sm w-full text-center">
        <a href="/" className="inline-flex items-center gap-2.5 mb-10 group">
          <span className="brand-monogram">N86</span>
          <span className="font-display font-semibold tracking-tight text-dark-50 text-lg group-hover:text-gold-300 transition-colors">Never 86&apos;d</span>
        </a>

        <div className="glass-card rounded-2xl p-7 shadow-card">
          <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Welcome back.</h1>
          <p className="text-dark-300 text-sm mb-6">Sign in to continue.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full bg-dark-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-dark-300 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/15 transition-all"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 disabled:opacity-60 text-dark-900 font-semibold rounded-lg px-4 py-3 transition-all shadow-gold-glow"
            >
              {status === 'loading' ? 'Checking…' : 'Enter'}
            </button>
            {status === 'error' ? <p className="text-red-300 text-sm">{message}</p> : null}
          </form>
        </div>

        <p className="text-dark-300 text-xs mt-6">
          Not an operator yet? <a href="/operators" className="text-gold-300 hover:text-gold-200 transition-colors">Start here</a>
        </p>
      </div>
    </main>
  );
}
