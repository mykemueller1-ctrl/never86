'use client';

import { FormEvent, useEffect, useState } from 'react';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

type Tracking = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  referrer: string;
};

const initialTracking: Tracking = {
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
  referrer: '',
};

export default function AuditPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [platform, setPlatform] = useState<'DoorDash' | 'Uber Eats' | 'Grubhub' | 'Other'>('DoorDash');
  const [locationCount, setLocationCount] = useState('1');
  const [tracking, setTracking] = useState<Tracking>(initialTracking);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTracking({
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmContent: params.get('utm_content') || '',
      referrer: document.referrer || '',
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/audit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          restaurantName,
          platform,
          locationCount,
          ...tracking,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setStatus('success');
      setMessage(data.message);
    } catch (error: unknown) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    }
  }

  return (
    <main className="min-h-screen bg-dark-900 text-white">
      <header className="border-b border-dark-600 bg-dark-900/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <div>
            <p className="text-2xl font-black tracking-tight text-gold-500">Never 86&apos;d</p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-300">
              Marketplace Audit
            </p>
          </div>
          <a
            href="#claim"
            className="rounded-md bg-gold-500 px-4 py-2 text-sm font-black uppercase tracking-wide text-dark-900 transition hover:bg-gold-400"
          >
            Claim free audit
          </a>
        </div>
      </header>

      <section className="border-b border-dark-600 bg-dark-900">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:py-24">
          <div>
            <div className="mb-6 inline-flex border border-gold-700 bg-gold-900/40 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-gold-300">
              100 restaurant statement audits
            </div>
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.94] tracking-[-0.04em] md:text-7xl">
              Your DoorDash commission is not your DoorDash cost.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-dark-100 md:text-2xl">
              Send one redacted marketplace statement. We will show what you sold, what the platform took,
              what you funded, and whether the payout math holds.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#claim"
                className="rounded-md bg-gold-500 px-6 py-4 text-center text-base font-black uppercase tracking-wide text-dark-900 transition hover:bg-gold-400"
              >
                Send one statement — free
              </a>
              <div className="border border-dark-500 px-6 py-4 text-center text-sm font-bold uppercase tracking-wide text-dark-100">
                No login. No integration. No card.
              </div>
            </div>
          </div>

          <div className="border border-dark-500 bg-dark-800 p-6 shadow-2xl shadow-black/40 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gold-400">Real statement proof</p>
            <div className="mt-6 space-y-5">
              <div className="flex items-end justify-between gap-5 border-b border-dark-600 pb-4">
                <span className="text-sm font-bold uppercase tracking-wide text-dark-200">Commission</span>
                <span className="text-3xl font-black">$787.55</span>
              </div>
              <div className="flex items-end justify-between gap-5 border-b border-dark-600 pb-4">
                <span className="text-sm font-bold uppercase tracking-wide text-dark-200">True marketplace cost</span>
                <span className="text-4xl font-black text-gold-400">$1,764.29</span>
              </div>
              <div className="flex items-end justify-between gap-5 border-b border-dark-600 pb-4">
                <span className="text-sm font-bold uppercase tracking-wide text-dark-200">Effective cost</span>
                <span className="text-4xl font-black">21.5%</span>
              </div>
              <div className="flex items-end justify-between gap-5">
                <span className="text-sm font-bold uppercase tracking-wide text-dark-200">Payout variance</span>
                <span className="text-3xl font-black text-emerald-400">$0.00</span>
              </div>
            </div>
            <p className="mt-7 border-l-4 border-gold-500 pl-4 text-sm leading-relaxed text-dark-200">
              DoorDash&apos;s payout matched our calculation to the penny. We did not invent a recovery claim.
              That is the standard.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-dark-600 bg-dark-800">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gold-400">What the audit exposes</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black uppercase leading-tight md:text-5xl">
            Stop staring at one percentage. Follow every dollar.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden border border-dark-500 bg-dark-500 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Commission', 'The amount charged against eligible marketplace sales.'],
              ['Merchant fees', 'Processing, delivery, network, tablet, and related deductions.'],
              ['Promotions + ads', 'Restaurant-funded discounts and marketing spend that quietly stack up.'],
              ['Refunds + errors', 'Missing-item, incorrect-item, cancellation, and adjustment charges.'],
              ['Payout math', 'Expected net compared with the platform-reported payout.'],
              ['Missing evidence', 'The exact POS, bank, or contract record needed before making a claim.'],
            ].map(([title, body]) => (
              <div key={title} className="bg-dark-800 p-6 md:p-8">
                <h3 className="text-lg font-black uppercase text-white">{title}</h3>
                <p className="mt-3 leading-relaxed text-dark-200">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="claim" className="bg-dark-900">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[0.85fr_1.15fr] md:px-8 md:py-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gold-400">Claim one of the 100 audits</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-tight md:text-6xl">
              Bring the file. We will show the math.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-dark-100">
              Enter your information. We will email you immediately. Reply with one redacted DoorDash,
              Uber Eats, or Grubhub statement.
            </p>
            <div className="mt-8 space-y-3 text-sm font-semibold uppercase tracking-wide text-dark-200">
              <p>✓ Keep the financial totals and date range visible</p>
              <p>✓ Redact account numbers and customer information</p>
              <p>✓ No marketplace password required</p>
            </div>
          </div>

          <div className="border border-dark-500 bg-dark-800 p-6 md:p-8">
            {status === 'success' ? (
              <div className="flex min-h-[420px] flex-col justify-center">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-400">Audit request received</p>
                <h3 className="mt-4 text-4xl font-black uppercase leading-tight">Check your email.</h3>
                <p className="mt-5 text-lg leading-relaxed text-dark-100">{message}</p>
                <p className="mt-6 border-l-4 border-gold-500 pl-4 text-dark-200">
                  Reply to the email with the statement attached. We will not call anything missing until the evidence proves it.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-dark-200" htmlFor="name">
                    Your name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoComplete="name"
                    className="w-full rounded-md border border-dark-500 bg-dark-900 px-4 py-3 text-white outline-none transition focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-dark-200" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-md border border-dark-500 bg-dark-900 px-4 py-3 text-white outline-none transition focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-dark-200" htmlFor="restaurant">
                    Restaurant name
                  </label>
                  <input
                    id="restaurant"
                    value={restaurantName}
                    onChange={(event) => setRestaurantName(event.target.value)}
                    required
                    className="w-full rounded-md border border-dark-500 bg-dark-900 px-4 py-3 text-white outline-none transition focus:border-gold-500"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-dark-200" htmlFor="platform">
                      Platform
                    </label>
                    <select
                      id="platform"
                      value={platform}
                      onChange={(event) => setPlatform(event.target.value as typeof platform)}
                      className="w-full rounded-md border border-dark-500 bg-dark-900 px-4 py-3 text-white outline-none transition focus:border-gold-500"
                    >
                      <option>DoorDash</option>
                      <option>Uber Eats</option>
                      <option>Grubhub</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-dark-200" htmlFor="locations">
                      Locations
                    </label>
                    <input
                      id="locations"
                      value={locationCount}
                      onChange={(event) => setLocationCount(event.target.value)}
                      inputMode="numeric"
                      className="w-full rounded-md border border-dark-500 bg-dark-900 px-4 py-3 text-white outline-none transition focus:border-gold-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-md bg-gold-500 px-6 py-4 text-base font-black uppercase tracking-wide text-dark-900 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === 'loading' ? 'Saving your spot...' : 'Send me the free audit instructions'}
                </button>
                {status === 'error' && <p className="text-sm font-semibold text-red-400">{message}</p>}
                <p className="text-xs leading-relaxed text-dark-300">
                  Never 86&apos;d is independent and is not affiliated with or endorsed by DoorDash, Uber Eats, or Grubhub.
                  Operational reconciliation only; not legal, tax, or accounting advice.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-dark-600 bg-black px-5 py-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-gold-400">
          Bring the file. Show the math. Keep the receipt.
        </p>
      </footer>
    </main>
  );
}
