'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Status = 'loading' | 'error' | 'done';

export default function ActivateClient() {
  const params = useSearchParams();
  const token = useMemo(() => params.get('token')?.trim() || '', [params]);
  const started = useRef(false);
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setStatus('error');
      setMessage('This page needs the secure link from your email.');
      return;
    }

    async function openOperator() {
      try {
        const res = await fetch('/api/onboard/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Sign-in failed');
        setStatus('done');
        setMessage('Email verified. Opening your operator…');
        window.location.replace(data.redirect || '/dashboard');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Sign-in failed');
      }
    }

    void openOperator();
  }, [token]);

  return (
    <main className="min-h-screen bg-[#0c1210] text-[#e8ebe6]">
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8fa898]">Never 86&apos;d · secure email sign-in</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-white">
          {status === 'error' ? 'That link did not open.' : 'You’re in.'}
        </h1>
        <p className="mt-4 text-[#b7c0b8] leading-relaxed" role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
        {status === 'loading' ? (
          <div className="mx-auto mt-8 h-2 w-32 overflow-hidden rounded-full bg-[#26312c]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#7eb6ff]" />
          </div>
        ) : null}
        {status === 'error' ? (
          <Link href="/login" className="mt-8 inline-flex rounded-full bg-[#e8ebe6] px-5 py-3 text-sm font-semibold text-[#0c1210]">
            Send me a new link →
          </Link>
        ) : null}
      </div>
    </main>
  );
}
