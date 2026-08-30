'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const inputClass =
  'w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors';

export function OneSeatClaimForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'blocked' | 'ok'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/staff/claim/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, provider: 'email' }),
      });
      const data = await res.json();
      if (data.success === true && typeof data.redirect === 'string') {
        setStatus('ok');
        router.push(data.redirect);
        return;
      }
      setStatus('blocked');
      setError(typeof data.error === 'string' ? data.error : 'Claim fails closed.');
    } catch {
      setStatus('blocked');
      setError('Claim fails closed. No mail sent.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="compass-card space-y-3">
      <input
        type="email"
        autoComplete="email"
        placeholder="Work email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full disabled:opacity-50"
        style={{ background: '#0066ff' }}
      >
        {status === 'loading' ? 'Checking…' : 'Request seat'}
      </button>
      {error ? <p className="text-[#ff453a] text-sm text-center">{error}</p> : null}
      <p className="text-center text-[13px]" style={{ color: '#6e6e73' }}>
        Google stays fail-closed without provider secrets. Phone and X are off.
        Staff invite door:{' '}
        <Link href="/staff/login" className="underline">/staff/login</Link>.
      </p>
    </form>
  );
}
