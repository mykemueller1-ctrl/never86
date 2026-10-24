'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthHonestyLine } from '@/components/AuthHonestyLine';
import { ActionShiftFooter, ActionShiftHeader } from '@/components/ActionShiftDoor';
import { PapersInboxConnect } from '@/components/PapersInboxConnect';
import { PapersReadiness } from '@/components/PapersReadiness';
import type { HonestyLabel } from '@/lib/oneSeatPublicWin';
import { trackEvent } from '@/lib/track';

type Status = 'idle' | 'loading' | 'sent' | 'error';

export default function OnboardPage() {
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [honesty, setHonesty] = useState<HonestyLabel | null>(null);

  useEffect(() => { trackEvent('onboard_view'); }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const restaurantName = storeName.trim().replace(/\s+/g, ' ');
    if (!restaurantName) {
      setStatus('error');
      setMessage('Enter your store name.');
      return;
    }
    setStatus('loading');
    setMessage('');
    setHonesty(null);
    trackEvent('onboard_submit', { meta: { path: 'email_store' } });
    try {
      const res = await fetch('/api/onboard/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, restaurantName, storeName: restaurantName, sourcePage: '/onboard' }),
      });
      const data = await res.json() as {
        success?: boolean;
        error?: string;
        message?: string;
        code?: string;
        honesty?: HonestyLabel;
      };
      if (!res.ok || !data.success) {
        const missing = data.honesty === 'Missing'
          || data.code === 'activation_email_unavailable'
          || data.code === 'neon_unavailable';
        setHonesty(missing ? 'Missing' : null);
        const error = data.error || 'Could not send the link.';
        setStatus('error');
        setMessage(missing ? `${error} Honesty: Missing. The seat was not opened.` : error);
        trackEvent('onboard_submit_error', { meta: { path: 'email_store', error } });
        return;
      }
      setHonesty(null);
      setStatus('sent');
      setMessage('Check your inbox for a link to set your password.');
      trackEvent('onboard_submit_success', { meta: { path: 'email_store' } });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Could not send the link.';
      setHonesty('Missing');
      setStatus('error');
      setMessage(`${error} Honesty: Missing. The seat was not opened.`);
      trackEvent('onboard_submit_error', { meta: { path: 'email_store', error } });
    }
  }

  return (
    <div className="as-home">
      <ActionShiftHeader />
      <main id="main" className="as-claim as-wrap">
        <div>
          <p className="as-kicker">FREE OWNER SEAT</p>
          <h1>
            Claim the seat
            <br />
            <span>for this restaurant.</span>
          </h1>
          <p className="as-lead">
            Work email and restaurant name. You&apos;ll set your password from the link we email you. After that, sign in to that one restaurant.
          </p>
          <p className="as-fine">One restaurant and one login. A second location stays closed until it is paid. No card.</p>
        </div>
        <div className="as-panel">
          <p className="as-kicker">TWO FIELDS</p>
          <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 600, letterSpacing: '-0.04em' }}>Work email and restaurant name.</h2>
          <form onSubmit={handleSubmit} className="as-stack" style={{ marginTop: 18 }}>
            <label htmlFor="onboard-email">
              <span className="as-label">Work email</span>
              <input
                id="onboard-email"
                type="email"
                autoComplete="email"
                placeholder="you@restaurant.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="as-field"
              />
            </label>
            <label htmlFor="onboard-restaurant">
              <span className="as-label">Restaurant name</span>
              <input
                id="onboard-restaurant"
                type="text"
                autoComplete="organization"
                placeholder="Your restaurant name"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                required
                minLength={1}
                maxLength={120}
                className="as-field"
              />
            </label>
            <button type="submit" disabled={status === 'loading' || status === 'sent'} className="as-button" style={{ opacity: status === 'loading' || status === 'sent' ? 0.5 : 1 }}>
              {status === 'loading' ? 'Sending…' : status === 'sent' ? 'Check your inbox' : 'Email me the setup link'}
            </button>
            <AuthHonestyLine
              honesty={honesty}
              message={message}
              className={status === 'error' ? 'as-error' : 'as-ok'}
            />
          </form>
          <p className="as-fine" style={{ marginTop: 16 }}>
            You&apos;ll set your password from the link we email you.
          </p>
          <p className="as-fine" style={{ marginTop: 8 }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--as-orange)', fontWeight: 600 }}>Sign in</Link>
          </p>
          {status === 'sent' ? (
            <div style={{ marginTop: 18 }}>
              <p className="as-fine">
                Next: Connect Google. Gmail and Drive stay read-only, and papers land on one review screen.
              </p>
              <PapersInboxConnect variant="claim" />
            </div>
          ) : (
            <div style={{ marginTop: 18 }}>
              <PapersReadiness heading="Google papers" />
            </div>
          )}
          <p className="as-fine" style={{ marginTop: 16 }}>
            We use this email for account access and essential product help. By continuing, you agree to our <Link href="/terms">terms</Link> and <Link href="/privacy">privacy policy</Link>.
          </p>
        </div>
      </main>
      <ActionShiftFooter />
    </div>
  );
}
