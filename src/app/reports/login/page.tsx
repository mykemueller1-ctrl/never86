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
        window.location.href = next && next.startsWith('/reports') ? next : '/reports/taco-bamba';
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
    <main className="min-h-screen bg-dark-800 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold text-gold-500 mb-2">Never 86&apos;d</h1>
        <p className="text-dark-300 text-sm mb-8">Operator reports — sign in to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-gold-500 transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-dark-900 font-semibold rounded-lg px-4 py-3 transition-colors"
          >
            {status === 'loading' ? 'Checking…' : 'Enter'}
          </button>
          {status === 'error' ? <p className="text-red-400 text-sm">{message}</p> : null}
        </form>
      </div>
    </main>
  );
}
