'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const inputClass =
  'w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors';

export function StaffLoginForm() {
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'blocked' | 'ok'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteHandle: handle, deliverySecret: secret }),
      });
      const data = await res.json();
      if (data.success === true && typeof data.redirect === 'string') {
        setStatus('ok');
        router.push(data.redirect);
        router.refresh();
        return;
      }
      setStatus('blocked');
      setError(typeof data.error === 'string' ? data.error : 'Staff login fails closed.');
    } catch {
      setStatus('blocked');
      setError('Staff login fails closed. Owner /login remains owner-only.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="compass-card space-y-3">
      <input
        type="text"
        autoComplete="username"
        placeholder="Seat handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        className={inputClass}
      />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Invite secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full disabled:opacity-50"
        style={{ background: '#0066ff' }}
      >
        {status === 'loading' ? 'Checking…' : 'Staff sign-in'}
      </button>
      {error ? <p className="text-[#ff453a] text-sm text-center">{error}</p> : null}
      <p className="text-center text-[13px]" style={{ color: '#6e6e73' }}>
        Fails closed without DATABASE_URL. Live only after Neon apply + STAFF_SEAT_LOGIN_ENABLED.
        Owner door:{' '}
        <Link href="/login" className="underline" style={{ textDecorationColor: '#0066ff' }}>
          /login
        </Link>
        . Desk:{' '}
        <Link href="/staff/desk" className="underline" style={{ textDecorationColor: '#0066ff' }}>
          /staff/desk
        </Link>
        .
      </p>
    </form>
  );
}
