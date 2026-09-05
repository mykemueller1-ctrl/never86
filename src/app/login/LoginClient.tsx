'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';

const inputClass =
  'w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors';

export default function OperatorLoginPage() {
  const [mode, setMode] = useState<'link' | 'password'>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    if (mode === 'password') {
      try {
        const res = await fetch('/api/operator/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Wrong email or password.');
        window.location.href = data.redirect || OWNER_DESK_POST_AUTH_REDIRECT;
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Wrong email or password.');
      }
      return;
    }
    try {
      const res = await fetch('/api/onboard/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sourcePage: '/login' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not send the link.');
      setStatus('sent');
      setMessage(data.message || 'Check your email for a secure sign-in link.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Could not send the link.');
    }
  }

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">
              Never 86&apos;d <span className="italic text-ink-600">· operator login</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">Community Tap seat 1 · email + password or magic link</p>
          </span>
        </Link>
      </div>

      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28">
        <p className="compass-eyebrow mb-4">— One field. That&apos;s it.</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Open your operator.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          {mode === 'password'
            ? 'Sign in with the password you set once, or switch to a fresh email link below.'
            : (
              <>Community Tap seat 1 opens with <span className="font-mono">communitypizza2026@gmail.com</span>. Same magic link for return visits, or sign in with a password once you set one.</>
            )}
        </p>

        <div className="flex gap-2 mb-3 text-[13px]">
          <button
            type="button"
            onClick={() => { setMode('link'); setStatus('idle'); setMessage(''); }}
            className={`flex-1 rounded-full px-3 py-2 font-medium ${mode === 'link' ? 'text-white' : 'text-ink-600 bg-[#f2f2f4]'}`}
            style={mode === 'link' ? { background: '#0066ff' } : undefined}
          >
            Email link
          </button>
          <button
            type="button"
            onClick={() => { setMode('password'); setStatus('idle'); setMessage(''); }}
            className={`flex-1 rounded-full px-3 py-2 font-medium ${mode === 'password' ? 'text-white' : 'text-ink-600 bg-[#f2f2f4]'}`}
            style={mode === 'password' ? { background: '#0066ff' } : undefined}
          >
            Email + password
          </button>
        </div>

        <form onSubmit={onSubmit} className="compass-card space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="communitypizza2026@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          {mode === 'password' ? (
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          ) : null}
          <button type="submit" disabled={status === 'loading' || status === 'sent'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
            {mode === 'password'
              ? (status === 'loading' ? 'Signing in…' : 'Sign in →')
              : (status === 'loading' ? 'Sending…' : status === 'sent' ? 'Link sent ✓' : 'Email me the secure link →')}
          </button>
          {message ? <p className={`text-sm text-center ${status === 'error' ? 'text-[#ff453a]' : 'text-[#248a3d]'}`}>{message}</p> : null}
          <p className="text-center text-[11px] leading-relaxed text-[#86868b]">
            Account email only. No marketing list. By continuing, you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
          </p>
        </form>

        <p className="compass-body text-[13px] mt-6" style={{ color: '#6e6e73' }}>
          New or returning operator—the same email link handles both. Set a password once from your operator to skip the email link next time.
        </p>
        <p className="compass-body text-[13px] mt-4" style={{ color: '#6e6e73' }}>
          New here?{' '}
          <Link href="/onboard" className="underline" style={{ color: '#0066ff' }}>
            Claim the free owner seat
          </Link>
          {' '}
          with email. Seat 1 is Community Tap — use the shop email already on file. House-code seats stay at{' '}
          <Link href="/portal" className="underline" style={{ color: '#0066ff' }}>
            /portal
          </Link>
          {' '}
          and fail-closed until a code is issued. No PIN, no staff name.
        </p>
      </section>
    </main>
  );
}
