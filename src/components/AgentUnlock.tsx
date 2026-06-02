'use client';

import { useState } from 'react';

export function AgentUnlock({ agentName }: { agentName: string }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const sourcePage = typeof window !== 'undefined' ? window.location.pathname : undefined;
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          restaurantName,
          agentRequested: agentName,
          sourcePage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || `${agentName} is on its way.`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-success-500 mb-3">{agentName} · unlocked</p>
          <h2 className="display text-4xl md:text-5xl mb-5">{message}</h2>
          <p className="text-ink-600 text-lg leading-relaxed mb-6">
            Check your inbox. Myke will reach out personally within 24 hours to wire {agentName} to your data.
          </p>
          <a href="/operators#talk" className="btn-primary">Book 15 minutes now</a>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="display text-4xl md:text-5xl mb-3">Want {agentName} on your data?</h2>
        <p className="text-ink-600 text-lg mb-8">Drop your email. We&apos;ll wire it up.</p>
        <form onSubmit={handleSubmit} className="card p-7 space-y-3 text-left">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors"
          />
          <input
            type="text"
            placeholder="Restaurant or group"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="w-full bg-white border border-ink-300 rounded-xl px-4 py-3 text-ink-800 placeholder-ink-500 focus:outline-none focus:border-ink-800 transition-colors"
          />
          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50">
            {status === 'loading' ? 'Sending…' : `Unlock ${agentName} →`}
          </button>
          {status === 'error' && <p className="text-danger-500 text-sm text-center">{message}</p>}
        </form>
      </div>
    </section>
  );
}
