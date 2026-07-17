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
      <section className="py-16 md:py-20 px-6 border-t border-[#e8e8ed]">
        <div className="max-w-xl mx-auto text-center">
          <p className="compass-eyebrow mb-3">{agentName} · unlocked</p>
          <h2 className="compass-display text-4xl md:text-5xl mb-5">{message}</h2>
          <p className="compass-body text-lg leading-relaxed mb-6">
            Check your inbox. Myke will reach out personally within 24 hours to wire {agentName} to your data.
          </p>
          <a href="/onboard" className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</a>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 px-6 border-t border-[#e8e8ed]">
      <div className="max-w-xl mx-auto text-center">
        <p className="compass-eyebrow mb-4">— Unlock this agent</p>
        <h2 className="compass-display text-4xl md:text-5xl mb-3">
          Want {agentName} <em>on your data?</em>
        </h2>
        <p className="compass-body text-lg mb-8">Drop your email. We&apos;ll wire it up.</p>
        <form onSubmit={handleSubmit} className="compass-card text-left space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors"
          />
          <input
            type="text"
            placeholder="Restaurant or group"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors"
          />
          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
            {status === 'loading' ? 'Sending…' : `Unlock ${agentName} →`}
          </button>
          {status === 'error' && <p className="text-[#ff453a] text-sm text-center">{message}</p>}
        </form>
      </div>
    </section>
  );
}
