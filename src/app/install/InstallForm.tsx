'use client';

import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/track';

export default function InstallForm() {
  const [fromShareToken, setFromShareToken] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [units, setUnits] = useState('');
  const [posType, setPosType] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Read ?from=<token> on mount — avoids the useSearchParams suspense boundary
  // that made the page render empty for server-side fetches.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    const tok = u.searchParams.get('from') ?? '';
    setFromShareToken(tok);
    trackEvent('install_view', { meta: { fromShareToken: tok || null } });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    trackEvent('install_submit', { meta: { posType, units: units || null, fromShareToken: fromShareToken || null } });
    setStatus('sending');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, name, restaurantName, units, posType,
          agentRequested: 'Operator App · install request',
          sourcePage: fromShareToken ? `/install · from /trial/run/${fromShareToken}` : '/install',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('sent');
        setMessage(data.message || 'Install request received.');
        trackEvent('install_submit_success', { meta: { posType, units: units || null, fromShareToken: fromShareToken || null } });
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setStatus('error');
      setMessage(msg);
      trackEvent('install_submit_error', { meta: { posType, units: units || null, fromShareToken: fromShareToken || null, error: msg } });
    }
  }

  if (status === 'sent') {
    return (
      <div className="compass-card text-center">
        <p className="font-serif text-2xl text-ink-800 mb-2">You&apos;re in.</p>
        <p className="compass-body">Myke will reach out within 24 hours from <span className="font-mono text-ink-800">myke@n86.app</span> with your operator-app invite.</p>
        {fromShareToken && <p className="compass-body text-[13px] mt-4" style={{ color: '#86868b' }}>Linked to /trial/run/{fromShareToken}</p>}
      </div>
    );
  }

  return (
    <>
      {fromShareToken && (
        <div className="compass-card mb-6" style={{ borderColor: '#0066ff' }}>
          <p className="compass-card-label" style={{ color: '#0066ff' }}>— Linked from your saved trial run</p>
          <p className="compass-body text-sm mt-3">
            Your trial result <span className="font-mono text-ink-800">/trial/run/{fromShareToken}</span> is attached to this install request. Myke will see both in one admin record.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="compass-card space-y-3">
        <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors" />
        <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required
          className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors" />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" min="1" placeholder="Units" value={units} onChange={(e) => setUnits(e.target.value)}
            className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors" />
          <select value={posType} onChange={(e) => setPosType(e.target.value)}
            className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 focus:outline-none focus:border-[#0066ff] transition-colors">
            <option value="">POS</option>
            <option>Toast</option><option>Square</option><option>Clover</option><option>PDQ</option>
            <option>Aloha</option><option>Lightspeed</option><option>Other</option>
          </select>
        </div>
        <button type="submit" disabled={status === 'sending'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
          {status === 'sending' ? 'Sending…' : 'Request install →'}
        </button>
        {status === 'error' && <p className="text-[#ff453a] text-sm text-center">{message}</p>}
        <p className="text-[11px] text-center" style={{ color: '#6e6e73' }}>
          White-glove onboarding for the first 10 operators. After that, self-serve install at never86.ai.
        </p>
      </form>
    </>
  );
}
