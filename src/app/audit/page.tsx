'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MarketplaceAuditFooter, MarketplaceAuditHeader } from '@/components/MarketplaceAuditShell';
import { MarketplaceCostSnapshot } from '@/components/MarketplaceCostSnapshot';
import { trackEvent } from '@/lib/track';
import { TOP_THREE_P_GUIDES } from '@/lib/threePDiscovery';

const BREAKDOWN = [
  ['Commission', '$787.55'],
  ['Merchant fees', '$39.92'],
  ['Promotions + marketing', '$887.80'],
  ['Error charges', '$49.02'],
  ['Observed marketplace cost', '$1,764.29'],
];

const OUTPUTS = [
  'Commission and merchant fees',
  'Restaurant-funded promotions and ads',
  'Refunds, error charges, credits, and adjustments',
  'Observed marketplace cost in dollars and percent',
  'Expected payout versus reported payout',
  'Unexplained variance and the next record needed',
];

type Status = 'idle' | 'loading' | 'success' | 'error';

const inputClass = 'w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-3.5 text-[#1d1d1f] outline-none transition placeholder:text-[#b4b4b8] focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/10';

export default function AuditCampaignPage() {
  const params = useSearchParams();
  const intent = params.get('intent') || 'true-cost';
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
        body: JSON.stringify({ name, email, restaurantName, platform, units, sourcePage: window.location.href, ...attribution }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to submit your audit request.');
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

  const emailSubject = encodeURIComponent(`Marketplace audit — ${restaurantName || name || platform}`);

  return (
    <main className="compass min-h-screen">
      <MarketplaceAuditHeader />

      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-16 md:py-24">
        <div className="n86-hero-glow" aria-hidden />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <p className="compass-eyebrow mb-6">— Restaurant delivery · one statement first</p>
            <h1 className="compass-display max-w-4xl text-5xl md:text-7xl lg:text-[82px]">
              Your DoorDash commission is not your <em>DoorDash cost.</em>
            </h1>
            <p className="compass-body mt-7 max-w-2xl text-xl md:text-2xl">
              See the statement math before you share a file. If you want the deeper review, send one redacted statement and get a source-stamped operator receipt.
            </p>
            <p className="compass-body mt-5 max-w-2xl text-base">
              Built from firsthand operating experience inside a 28-location, private-equity-backed restaurant group—because the tools were not good enough for the operator questions that mattered.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {['No portal password', 'No integration', 'No invented savings'].map((item) => <span key={item} className="compass-pill">{item}</span>)}
            </div>
            <div className="mt-10 max-w-2xl border-l-2 border-[#0066ff] pl-5">
              <p className="font-serif text-2xl text-[#1d1d1f] md:text-3xl">If the math is clean, we say it is clean.</p>
              <p className="compass-body mt-3 text-base md:text-lg">If something does not reconcile, we show the variance, the source, and the next record needed. A mismatch is not automatically an overcharge or contract violation.</p>
            </div>
          </div>

          <aside id="claim" className="compass-card p-6 md:p-8">
            {status === 'success' ? (
              <div className="py-5">
                <p className="compass-eyebrow">— Request received</p>
                <h2 className="compass-display mt-4 text-4xl">Now bring the file.</h2>
                <p className="compass-body mt-4 text-lg">{message}</p>
                <a href={`mailto:mykemueller1@gmail.com?subject=${emailSubject}`} onClick={() => trackEvent('audit_campaign_mailto_click', { meta: { platform, ...attribution } })} className="btn-primary mt-7 w-full" style={{ background: '#0066ff' }}>Email my statement →</a>
                <p className="mt-4 text-xs leading-relaxed text-[#86868b]">Never send portal credentials. Redact private guest, bank, card, tax, and credential data while keeping the statement dates, financial rows, and payout references visible.</p>
              </div>
            ) : (
              <form onSubmit={submitAuditRequest} className="space-y-4">
                <div>
                  <p className="compass-eyebrow">— Two ways to start</p>
                  <h2 className="compass-display mt-3 text-4xl">Start with the answer.</h2>
                  <a href="#true-cost-snapshot" onClick={() => trackEvent('audit_campaign_snapshot_click', { meta: { platform, intent, ...attribution } })} className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-[#b8d2ff] bg-[#f2f7ff] px-4 py-4 transition hover:border-[#0066ff]">
                    <span><strong className="block text-base text-[#1d1d1f]">Use the free 3P cost snapshot</strong><span className="mt-1 block text-xs leading-relaxed text-[#515154]">No login and no email. Enter the statement totals and see the math now.</span></span>
                    <span className="shrink-0 text-xl text-[#0066ff]">→</span>
                  </a>
                  <div className="my-5 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-[#e8e8ed]" /><span className="compass-card-label">or get a human-reviewed receipt</span><span className="h-px flex-1 bg-[#e8e8ed]" /></div>
                </div>
                <label className="block"><span className="compass-card-label mb-2 block">Your name</span><input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className={inputClass} placeholder="Myke Mueller" /></label>
                <label className="block"><span className="compass-card-label mb-2 block">Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className={inputClass} placeholder="you@restaurant.com" /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="compass-card-label mb-2 block">Restaurant</span><input value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} required autoComplete="organization" className={inputClass} placeholder="Restaurant name" /></label>
                  <label className="block"><span className="compass-card-label mb-2 block">Locations</span><input inputMode="numeric" value={units} onChange={(event) => setUnits(event.target.value)} className={inputClass} placeholder="1" /></label>
                </div>
                <label className="block"><span className="compass-card-label mb-2 block">Marketplace</span><select value={platform} onChange={(event) => setPlatform(event.target.value)} className={inputClass}><option>DoorDash</option><option value="Uber Eats">Uber Eats (early access)</option><option value="Grubhub">Grubhub (early access)</option><option value="ezCater">ezCater (early access)</option><option>Other</option></select></label>
                <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:cursor-wait disabled:opacity-60" style={{ background: '#0066ff' }}>{status === 'loading' ? 'Sending your request…' : 'Get my free audit →'}</button>
                {status === 'error' ? <p className="text-sm font-semibold text-red-600">{message}</p> : null}
                <p className="text-center text-[11px] leading-relaxed text-[#86868b]">No card. Never send passwords. Redact guest names and contact details, bank/account/routing numbers, card data, tax IDs, credentials, and unrelated identifiers.</p>
              </form>
            )}
          </aside>
        </div>
      </section>

      <MarketplaceCostSnapshot intent={intent} pagePath="/audit" />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <p className="compass-eyebrow">— One real restaurant statement</p>
        <div className="mt-6 grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <h2 className="compass-display text-4xl md:text-6xl">Commission was $787.55. <em>Observed cost was $1,764.29.</em></h2>
            <p className="compass-body mt-5 max-w-xl text-lg">Verified example from Community Tap &amp; Pizza&apos;s January 2026 DoorDash statement. Eligible food sales were $8,207.63. The observed marketplace cost was 21.5%.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {BREAKDOWN.map(([label, value], index) => (
              <div key={label} className={`compass-card ${index === BREAKDOWN.length - 1 ? 'sm:col-span-2 border-[#b8d2ff] bg-[#f2f7ff]' : ''}`}>
                <p className="compass-card-label" style={index === BREAKDOWN.length - 1 ? { color: '#0066ff' } : undefined}>{label}</p>
                <p className={`mt-2 text-3xl font-semibold ${index === BREAKDOWN.length - 1 ? 'text-[#0066ff]' : 'text-[#1d1d1f]'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <p className="compass-eyebrow">— What is proven today</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="compass-card border-[#b8d2ff] bg-[#f2f7ff] p-6 md:p-8"><h2 className="font-serif text-3xl text-[#1d1d1f]">We can address this workflow now.</h2><p className="compass-body mt-4">One redacted DoorDash statement can produce a source-stamped explanation of what happened, what the evidence supports, what is missing, and the next action. No integration is required for the first useful answer.</p></div>
            <div className="compass-card p-6 md:p-8"><h2 className="font-serif text-3xl text-[#1d1d1f]">We have not proven scale yet.</h2><p className="compass-body mt-4">DoorDash is the strongest current pilot. Uber Eats, Grubhub, and ezCater are early access. Repeat paid use, deterministic cross-platform coverage, and enterprise reliability still have to be earned.</p></div>
          </div>
          <div className="compass-card mt-4 p-6 md:p-8">
            <p className="compass-card-label" style={{ color: '#0066ff' }}>Sanitized 12-period method proof</p>
            <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
              <div><strong className="block text-3xl text-[#1d1d1f]">$103.6K</strong><span className="text-sm text-[#86868b]">eligible food sales</span></div>
              <div><strong className="block text-3xl text-[#1d1d1f]">8.7%</strong><span className="text-sm text-[#86868b]">commission</span></div>
              <div><strong className="block text-3xl text-[#1d1d1f]">17.0%</strong><span className="text-sm text-[#86868b]">restaurant-funded ads and promotions</span></div>
              <div><strong className="block text-3xl text-[#0066ff]">27.2%</strong><span className="text-sm text-[#86868b]">observed marketplace cost</span></div>
            </div>
            <p className="compass-body mt-5 text-sm">All 12 finalized statements reconciled. This proves the cost-composition method on one anonymized store. It does not prove a contract violation, recoverable cash, guaranteed savings, or a market-wide benchmark.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div><p className="compass-eyebrow">— The trust test</p><h2 className="compass-display mt-5 text-4xl md:text-6xl">Our audit found $0 missing. <em>Good.</em></h2><p className="compass-body mt-5 max-w-2xl text-lg">DoorDash reported a $7,646.86 net total. Never86&apos;d independently calculated $7,646.86. The payout math reconciled to the penny. A tool that always “finds money” is not an audit.</p></div>
          <div className="compass-card p-6 md:p-8">
            {[['DoorDash reported', '$7,646.86'], ["Never86'd calculated", '$7,646.86'], ['Unexplained variance', '$0.00']].map(([label, value], index) => (
              <div key={label} className={`flex items-center justify-between gap-4 py-4 ${index < 2 ? 'border-b border-[#e8e8ed]' : ''}`}><span className={index === 2 ? 'font-semibold text-[#0066ff]' : 'text-[#6e6e73]'}>{label}</span><strong className={`text-2xl ${index === 2 ? 'text-[#0066ff]' : 'text-[#1d1d1f]'}`}>{value}</strong></div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="compass-eyebrow">— What comes back</p><h2 className="compass-display mt-5 text-4xl md:text-5xl">Not an AI essay. <em>An operator receipt.</em></h2><p className="compass-body mt-5 text-lg">Every material number is sourced, calculated, or marked missing. You leave knowing what happened and what deserves review next.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {OUTPUTS.map((item, index) => <div key={item} className="compass-card flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0066ff] text-sm font-semibold text-white">{index + 1}</span><p className="font-medium leading-relaxed text-[#515154]">{item}</p></div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="compass-eyebrow">— Operator evidence desk</p>
              <h2 className="compass-display mt-5 text-4xl md:text-6xl">Check the method before you send a file.</h2>
              <p className="compass-body mt-5 text-lg">Use the same statement, payout, contract, and bank rules Never86&apos;d applies. Every guide states what the evidence can prove and where it stops.</p>
            </div>
            <Link href="/delivery-marketplace-reconciliation" className="btn-primary" style={{ background: '#0066ff' }}>Open all 52 guides →</Link>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOP_THREE_P_GUIDES.map((guide) => (
              <Link key={guide.href} href={guide.href} className="compass-card font-semibold leading-snug text-[#515154] transition hover:border-[#0066ff] hover:text-[#1d1d1f]">
                {guide.title} <span className="text-[#0066ff]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
        <p className="compass-eyebrow">— 100 restaurant operators wanted</p>
        <h2 className="compass-display mt-5 text-5xl md:text-7xl">Where did your delivery money go?</h2>
        <p className="compass-body mx-auto mt-6 max-w-2xl text-xl">Bring one redacted statement. We&apos;ll show the math. You decide what happens next.</p>
        <a href="#claim" onClick={() => trackEvent('audit_campaign_bottom_cta', { meta: attribution })} className="btn-primary mt-9" style={{ background: '#0066ff' }}>Get my free audit →</a>
        <p className="compass-eyebrow-dim mt-8">Bring the file · show the math · keep the receipt</p>
      </section>

      <MarketplaceAuditFooter />
    </main>
  );
}
