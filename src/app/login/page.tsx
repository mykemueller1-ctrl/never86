'use client';

import { useState } from 'react';
import Link from 'next/link';

const inputClass =
  'w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-3 text-ink-800 placeholder-[#a1a1a6] focus:outline-none focus:border-[#0066ff] transition-colors';

export default function OperatorLoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
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
            <p className="compass-eyebrow-dim mt-2">Payroll · Prices · Process</p>
          </span>
        </Link>
      </div>

      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28">
        <p className="compass-eyebrow mb-4">— One field. That&apos;s it.</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Open your operator.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          Enter your email. We&apos;ll send a private link that opens your restaurant workspace—no password and no sales call.
        </p>

        <form onSubmit={onSubmit} className="compass-card space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="you@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <button type="submit" disabled={status === 'loading' || status === 'sent'} className="btn-primary w-full disabled:opacity-50" style={{ background: '#0066ff' }}>
            {status === 'loading' ? 'Sending…' : status === 'sent' ? 'Link sent ✓' : 'Email me the secure link →'}
          </button>
          {message ? <p className={`text-sm text-center ${status === 'error' ? 'text-[#ff453a]' : 'text-[#248a3d]'}`}>{message}</p> : null}
          <p className="text-center text-[11px] leading-relaxed text-[#86868b]">
            Account email only. No marketing list. By continuing, you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
          </p>
        </form>

        <p className="compass-body text-[13px] mt-6" style={{ color: '#6e6e73' }}>
          New or returning operator—the same email link handles both.
        </p>
      </section>
    </main>
  );
}
