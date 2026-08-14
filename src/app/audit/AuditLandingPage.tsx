'use client';

import { FormEvent, useState } from 'react';

type Attribution = {
  source: string;
  medium: string;
  campaign: string;
};

type Status = 'idle' | 'loading' | 'success' | 'error';

const proofRows = [
  ['Commission', '$787.55'],
  ['Promotions + marketing', '$887.80'],
  ['Error charges', '$49.02'],
  ['Total marketplace cost', '$1,764.29'],
  ['Effective cost', '21.5%'],
];

export default function AuditLandingPage({ attribution }: { attribution: Attribution }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    restaurantName: '',
    platform: 'DoorDash',
    website: '',
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/audit-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...attribution }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'We could not save your request.');
      }

      setStatus('success');
      setMessage(data.message);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    }
  }

  return (
    <main className="min-h-screen bg-dark-900 text-white">
      <section className="border-b border-dark-600 bg-dark-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <div className="text-xl font-black tracking-tight text-gold-500">Never 86&apos;d</div>
          <div className="rounded-full border border-gold-700 bg-gold-900/40 px-3 py-1 text-xs font-bold tracking-widest text-gold-300">
            100 STATEMENT AUDIT
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-dark-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,160,23,0.16),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:py-24">
          <div>
            <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-gold-400">
              Restaurant owners are looking at the wrong number.
            </p>
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Your DoorDash commission is not your DoorDash cost.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-dark-100 md:text-xl">
              Send one redacted marketplace statement. Never 86&apos;d will show what you sold, what the platform took, what you funded, and whether the payout math holds.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-dark-100">
              <span className="rounded-full border border-dark-500 bg-dark-800 px-4 py-2">No portal password</span>
              <span className="rounded-full border border-dark-500 bg-dark-800 px-4 py-2">No integration</span>
              <span className="rounded-full border border-dark-500 bg-dark-800 px-4 py-2">No fake recovery claim</span>
            </div>

            <div className="mt-10 rounded-2xl border border-dark-500 bg-dark-800/90 p-5 md:p-6">
              <div className="flex items-center justify-between border-b border-dark-500 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-dark-300">One real statement</p>
                  <p className="mt-1 text-xl font-black">Commission looked manageable.</p>
                </div>
                <p className="text-3xl font-black text-gold-400">$787.55</p>
              </div>
              <div className="space-y-3 pt-4">
                {proofRows.slice(1).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-6">
                    <span className="text-dark-200">{label}</span>
                    <span className={label === 'Total marketplace cost' || label === 'Effective cost' ? 'font-black text-gold-400' : 'font-bold'}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-dark-500 pt-4 text-sm leading-relaxed text-dark-300">
                DoorDash reported a $7,646.86 net total. Never 86&apos;d independently calculated $7,646.86. The payout math reconciled to the penny—so we said it reconciled.
              </p>
            </div>
          </div>

          <div id="claim-audit" className="self-start rounded-3xl border border-gold-700 bg-dark-800 p-6 shadow-2xl shadow-black/40 md:sticky md:top-6 md:p-8">
            {status === 'success' ? (
              <div className="py-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-gold-400">You&apos;re in.</p>
                <h2 className="mt-4 text-3xl font-black leading-tight">Check your email.</h2>
                <p className="mt-4 text-lg leading-relaxed text-dark-100">{message}</p>
                <div className="mt-7 rounded-xl border border-dark-500 bg-dark-700 p-5 text-sm leading-relaxed text-dark-200">
                  Redact customer names and account numbers. Keep the dates, sales totals, fee lines, promotions, error charges, payout IDs, and net payout visible.
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-gold-400">First 100 audits: free</p>
                <h2 className="mt-3 text-3xl font-black leading-tight">Claim your statement audit.</h2>
                <p className="mt-3 leading-relaxed text-dark-200">
                  Enter your information. We&apos;ll email the exact instructions. Reply with one redacted statement.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(event) => setForm({ ...form, website: event.target.value })}
                    />
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">Your name</span>
                    <input
                      type="text"
                      autoComplete="name"
                      maxLength={120}
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      className="w-full rounded-xl border border-dark-500 bg-dark-700 px-4 py-3.5 text-white outline-none transition focus:border-gold-500"
                      placeholder="Myke Mueller"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">Email</span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      maxLength={254}
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      className="w-full rounded-xl border border-dark-500 bg-dark-700 px-4 py-3.5 text-white outline-none transition focus:border-gold-500"
                      placeholder="you@restaurant.com"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">Restaurant</span>
                    <input
                      type="text"
                      autoComplete="organization"
                      maxLength={160}
                      value={form.restaurantName}
                      onChange={(event) => setForm({ ...form, restaurantName: event.target.value })}
                      className="w-full rounded-xl border border-dark-500 bg-dark-700 px-4 py-3.5 text-white outline-none transition focus:border-gold-500"
                      placeholder="Restaurant name"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">Marketplace</span>
                    <select
                      value={form.platform}
                      onChange={(event) => setForm({ ...form, platform: event.target.value })}
                      className="w-full rounded-xl border border-dark-500 bg-dark-700 px-4 py-3.5 text-white outline-none transition focus:border-gold-500"
                    >
                      <option>DoorDash</option>
                      <option>Uber Eats</option>
                      <option>Grubhub</option>
                      <option>Multiple</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full rounded-xl bg-gold-500 px-5 py-4 text-base font-black uppercase tracking-wide text-dark-900 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Locking in your audit...' : 'Send me the audit instructions'}
                  </button>

                  {status === 'error' && <p className="text-sm font-semibold text-red-400">{message}</p>}
                </form>

                <p className="mt-5 text-xs leading-relaxed text-dark-400">
                  Never 86&apos;d is independent and is not affiliated with or endorsed by DoorDash, Uber Eats, or Grubhub. Operational reconciliation only; not legal, tax, or accounting advice.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-dark-600 bg-dark-800">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-gold-400">What you get</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-tight md:text-5xl">
            Not another dashboard. One operator-ready answer.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Bring the file', 'One redacted DoorDash, Uber Eats, or Grubhub statement. No credentials.'],
              ['02', 'Show the math', 'Commission, fees, promotions, marketing, errors, true cost, and payout reconciliation.'],
              ['03', 'Keep the receipt', 'Verified figures, calculated figures, missing evidence, and the next move separated clearly.'],
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-2xl border border-dark-500 bg-dark-700 p-6">
                <p className="text-sm font-black text-gold-400">{number}</p>
                <h3 className="mt-8 text-2xl font-black uppercase">{title}</h3>
                <p className="mt-3 leading-relaxed text-dark-200">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gold-500 text-dark-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-5 py-12 md:flex-row md:items-center md:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em]">Restaurant owner?</p>
            <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">Stop guessing. Send the statement.</h2>
          </div>
          <a
            href="#claim-audit"
            className="rounded-xl bg-dark-900 px-7 py-4 text-base font-black uppercase tracking-wide text-white transition hover:bg-dark-700"
          >
            Claim my free audit
          </a>
        </div>
      </section>

      <footer className="bg-dark-900 px-5 py-8 text-center text-sm text-dark-400">
        Never 86&apos;d · Bring the file. Show the math. Keep the receipt.
      </footer>
    </main>
  );
}
