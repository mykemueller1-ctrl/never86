'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/track';

const BREAKDOWN = [
  ['Commission', '$787.55'],
  ['Promotions + marketing', '$887.80'],
  ['Error charges', '$49.02'],
  ['True marketplace cost', '$1,764.29'],
];

const OUTPUTS = [
  'Commission and merchant fees',
  'Restaurant-funded promotions and ads',
  'Refunds, error charges, credits, and adjustments',
  'True marketplace cost in dollars and percent',
  'Expected payout versus reported payout',
  'Unexplained variance and the next record needed',
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function AuditCampaignPage() {
  const params = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [platform, setPlatform] = useState('DoorDash');
  const [units, setUnits] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const attribution = useMemo(
    () => ({
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || '100_statement_audit',
      utmContent: params.get('utm_content') || undefined,
    }),
    [params]
  );

  useEffect(() => {
    trackEvent('audit_campaign_view', {
      pagePath: '/audit',
      agentName: 'Marketplace Audit',
      audience: 'restaurant_operator',
      meta: attribution,
    });
  }, [attribution]);

  async function submitAuditRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    trackEvent('audit_campaign_submit', {
      pagePath: '/audit',
      agentName: 'Marketplace Audit',
      audience: 'restaurant_operator',
      meta: { platform, ...attribution },
    });

    try {
      const response = await fetch('/api/audit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          restaurantName,
          platform,
          units,
          sourcePage: window.location.href,
          ...attribution,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to submit your audit request.');
      }

      setStatus('success');
      setMessage(data.message);
      trackEvent('audit_campaign_success', {
        pagePath: '/audit',
        agentName: 'Marketplace Audit',
        audience: 'restaurant_operator',
        meta: { platform, emailSent: data.emailSent, ...attribution },
      });
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Something went wrong.';
      setStatus('error');
      setMessage(text);
      trackEvent('audit_campaign_error', {
        pagePath: '/audit',
        agentName: 'Marketplace Audit',
        audience: 'restaurant_operator',
        meta: { platform, error: text, ...attribution },
      });
    }
  }

  const emailSubject = encodeURIComponent(
    `Marketplace audit — ${restaurantName || name || platform}`
  );

  return (
    <main className="min-h-screen bg-[#090909] text-white selection:bg-[#d4a017] selection:text-black">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Link href="/" className="text-xl font-black tracking-tight">
            N86 <span className="text-[#d4a017]">NEVER 86&apos;D</span>
          </Link>
          <div className="rounded-full border border-[#d4a017]/40 bg-[#d4a017]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#e5bb42]">
            100 Statement Audit
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(212,160,23,0.18),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="mb-5 text-sm font-black uppercase tracking-[0.24em] text-[#d4a017]">
              Restaurant owners — stop looking at one percentage.
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[82px]">
              YOUR DOORDASH COMMISSION IS NOT YOUR DOORDASH COST.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-white/72 md:text-2xl">
              Send one redacted marketplace statement. We&apos;ll show you where the money went — free.
            </p>

            <div className="mt-9 flex flex-wrap gap-3 text-sm font-bold">
              {['No portal password', 'No integration', 'No fake recovery claim'].map((item) => (
                <span key={item} className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-white/82">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-12 border-l-4 border-[#d4a017] pl-5">
              <p className="text-2xl font-black leading-tight md:text-3xl">
                If the math is clean, we say it&apos;s clean.
              </p>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
                If something does not reconcile, we show the variance, the source, and the next record needed. We do not label every mismatch theft and we do not invent savings.
              </p>
            </div>
          </div>

          <aside id="claim" className="rounded-3xl border border-[#d4a017]/35 bg-[#141414] p-6 shadow-2xl shadow-black/50 md:p-8">
            {status === 'success' ? (
              <div className="py-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d4a017]">Request received</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight">Now bring the file.</h2>
                <p className="mt-4 text-lg leading-relaxed text-white/72">{message}</p>
                <a
                  href={`mailto:mykemueller1@gmail.com?subject=${emailSubject}`}
                  onClick={() => trackEvent('audit_campaign_mailto_click', { meta: { platform, ...attribution } })}
                  className="mt-7 block rounded-xl bg-[#d4a017] px-5 py-4 text-center text-base font-black text-black transition hover:bg-[#e6b82e]"
                >
                  EMAIL MY STATEMENT →
                </a>
                <p className="mt-4 text-xs leading-relaxed text-white/45">
                  Redact customer names and account numbers. Keep the statement period, financial totals, fee lines, and payout details visible.
                </p>
              </div>
            ) : (
              <form onSubmit={submitAuditRequest} className="space-y-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d4a017]">Claim a free audit</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">Send the statement. Get the receipt.</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">We&apos;ll email you. Reply with one redacted statement.</p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/55">Your name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoComplete="name"
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#d4a017]"
                    placeholder="Myke Mueller"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/55">Work email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#d4a017]"
                    placeholder="you@restaurant.com"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/55">Restaurant</span>
                    <input
                      value={restaurantName}
                      onChange={(event) => setRestaurantName(event.target.value)}
                      required
                      autoComplete="organization"
                      className="w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#d4a017]"
                      placeholder="Restaurant name"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/55">Locations</span>
                    <input
                      inputMode="numeric"
                      value={units}
                      onChange={(event) => setUnits(event.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#d4a017]"
                      placeholder="1"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/55">Statement</span>
                  <select
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3.5 text-white outline-none transition focus:border-[#d4a017]"
                  >
                    <option>DoorDash</option>
                    <option value="Uber Eats">Uber Eats (early access)</option>
                    <option value="Grubhub">Grubhub (early access)</option>
                    <option value="ezCater">ezCater (early access)</option>
                    <option>Other</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-xl bg-[#d4a017] px-5 py-4 text-base font-black text-black transition hover:bg-[#e6b82e] disabled:cursor-wait disabled:opacity-60"
                >
                  {status === 'loading' ? 'LOCKING IN YOUR AUDIT…' : 'AUDIT MY STATEMENT FREE →'}
                </button>

                {status === 'error' && <p className="text-sm font-semibold text-red-400">{message}</p>}
                <p className="text-center text-[11px] leading-relaxed text-white/40">
                  No card. No commitment. Operational reconciliation only — not legal, tax, or accounting advice.
                </p>
              </form>
            )}
          </aside>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#111111]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#d4a017]">One real restaurant statement</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <h2 className="text-4xl font-black leading-tight tracking-[-0.035em] md:text-6xl">
                COMMISSION WAS $787.55.
                <br />
                <span className="text-[#d4a017]">THE REAL COST WAS $1,764.29.</span>
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/60">
                Verified example from Community Tap &amp; Pizza&apos;s January 2026 DoorDash statement. Eligible food sales were $8,207.63. The all-in marketplace cost was 21.5%.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {BREAKDOWN.map(([label, value], index) => (
                <div
                  key={label}
                  className={`rounded-2xl border p-5 ${index === BREAKDOWN.length - 1 ? 'border-[#d4a017]/60 bg-[#d4a017]/10' : 'border-white/10 bg-black/20'}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-white/45">{label}</p>
                  <p className={`mt-2 text-3xl font-black ${index === BREAKDOWN.length - 1 ? 'text-[#e6b82e]' : 'text-white'}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#d4a017]">What is proven today</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-[#d4a017]/35 bg-[#141414] p-6 md:p-8">
              <h2 className="text-3xl font-black tracking-tight">WE CAN ADDRESS THIS WORKFLOW NOW.</h2>
              <p className="mt-4 text-base leading-relaxed text-white/65">
                One redacted DoorDash statement can produce a source-stamped explanation of what happened, what the evidence supports, what is missing, and the next action. No integration is required for the first useful answer.
              </p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-[#141414] p-6 md:p-8">
              <h2 className="text-3xl font-black tracking-tight">WE HAVE NOT PROVEN SCALE YET.</h2>
              <p className="mt-4 text-base leading-relaxed text-white/65">
                DoorDash is the strongest current pilot. Uber Eats, Grubhub, and ezCater are early access. Repeat paid use, deterministic cross-platform coverage, and enterprise reliability still have to be earned.
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-3xl border border-white/12 bg-[#141414] p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d4a017]">Sanitized 12-period method proof</p>
            <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
              <div><strong className="block text-3xl">$103.6K</strong><span className="text-sm text-white/50">eligible food sales</span></div>
              <div><strong className="block text-3xl">8.7%</strong><span className="text-sm text-white/50">commission</span></div>
              <div><strong className="block text-3xl">17.0%</strong><span className="text-sm text-white/50">restaurant-funded ads and promotions</span></div>
              <div><strong className="block text-3xl text-[#d4a017]">27.2%</strong><span className="text-sm text-white/50">observed all-in marketplace cost</span></div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/50">
              All 12 finalized statements reconciled. This proves the cost-composition method on one anonymized store. It does not prove a contract violation, recoverable cash, guaranteed savings, or a market-wide benchmark.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#d4a017]">The trust test</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.035em] md:text-6xl">
                OUR AUDIT FOUND $0 MISSING.
                <br />
                <span className="text-white/45">GOOD.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
                DoorDash reported a $7,646.86 net total. Never 86&apos;d independently calculated $7,646.86. The payout math reconciled to the penny. A tool that always “finds money” is not an audit. It is marketing fiction.
              </p>
            </div>
            <div className="rounded-3xl border border-white/12 bg-[#141414] p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 py-4">
                <span className="text-white/55">DoorDash reported</span>
                <strong className="text-2xl">$7,646.86</strong>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-white/10 py-4">
                <span className="text-white/55">Never 86&apos;d calculated</span>
                <strong className="text-2xl">$7,646.86</strong>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <span className="font-bold text-[#d4a017]">Unexplained variance</span>
                <strong className="text-3xl text-[#d4a017]">$0.00</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#111111]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#d4a017]">What comes back</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.035em] md:text-5xl">
                NOT AN AI ESSAY.
                <br />
                AN OPERATOR RECEIPT.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/60">
                Every material number is sourced, calculated, or marked missing. You leave knowing what happened and what deserves review next.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {OUTPUTS.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d4a017] text-sm font-black text-black">
                    {index + 1}
                  </span>
                  <p className="font-bold leading-relaxed text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 text-center md:px-8 md:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#d4a017]">100 restaurant operators wanted</p>
          <h2 className="mt-5 text-5xl font-black leading-[0.98] tracking-[-0.05em] md:text-7xl">
            WHERE DID YOUR DELIVERY MONEY GO?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-white/60">
            Bring one redacted statement. We&apos;ll show the math. You decide what happens next.
          </p>
          <a
            href="#claim"
            onClick={() => trackEvent('audit_campaign_bottom_cta', { meta: attribution })}
            className="mt-9 inline-block rounded-xl bg-[#d4a017] px-7 py-4 text-lg font-black text-black transition hover:bg-[#e6b82e]"
          >
            CLAIM MY FREE AUDIT →
          </a>
          <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-white/45">
            Bring the file. Show the math. Keep the receipt.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs leading-relaxed text-white/35 md:px-8">
        Never 86&apos;d is independent and is not affiliated with or endorsed by DoorDash, Uber Eats, Grubhub, or ezCater. © 2026 Never86d Inc.
      </footer>
    </main>
  );
}
