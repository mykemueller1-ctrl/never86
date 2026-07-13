'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const inputClass =
  'w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/operator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(typeof data.redirect === 'string' ? data.redirect : next);
        router.refresh();
      } else {
        setStatus('error');
        setError(data.error || 'Wrong email or password.');
      }
    } catch {
      setStatus('error');
      setError('Something went wrong. Try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="compass-card space-y-3">
      <input
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={inputClass}
      />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className={inputClass}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full disabled:opacity-50"
        style={{ background: '#0066ff' }}
      >
        {status === 'loading' ? 'Signing in…' : 'Sign in →'}
      </button>
      {status === 'error' && <p className="text-[#ff453a] text-sm text-center">{error}</p>}
    </form>
  );
}

export default function OperatorLoginPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-white">
              Never 86&apos;d <span className="italic text-white/70">· sign in</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">Your restaurant. Your numbers.</p>
          </span>
        </Link>
      </div>

      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28">
        <p className="compass-eyebrow mb-4">— Operator sign in</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Welcome back.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          Sign in to see your stores&apos; numbers — only yours, nobody else&apos;s.
        </p>

        <Suspense fallback={<div className="compass-card h-48" />}>
          <LoginForm />
        </Suspense>

        <p className="compass-body text-[13px] mt-6" style={{ color: '#6e6e73' }}>
          Don&apos;t have a login yet?{' '}
          <a href="mailto:myke@n86.app?subject=Operator%20login" className="underline" style={{ textDecorationColor: '#0066ff' }}>
            Email Myke
          </a>{' '}
          and we&apos;ll set you up.
        </p>
      </section>
    </main>
  );
}
