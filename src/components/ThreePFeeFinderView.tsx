import Link from 'next/link';
import { SourceTag } from '@/components/SourceTag';
import type { ThreePFees, PartnerRateCard } from '@/lib/threePFees';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(v * 100 < 10 ? 1 : 0)}%`;
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function blendedEffective(p: PartnerRateCard): number {
  if (p.premiumRate != null && p.premiumShareEstimate != null) {
    return p.contractDelivery * (1 - p.premiumShareEstimate) + p.premiumRate * p.premiumShareEstimate;
  }
  return p.contractDelivery;
}

function Kpi({ label, value, sub, level }: { label: string; value: string; sub?: string; level: 'verified' | 'estimated' }) {
  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-ink-500 text-xs uppercase tracking-wide">{label}</p>
        <SourceTag level={level} />
      </div>
      <p className="text-2xl font-bold text-ink-800 leading-tight">{value}</p>
      {sub ? <p className="text-ink-500 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

import { DemoChrome } from '@/components/DemoChrome';

export function ThreePFeeFinderFrame({ sample, children }: { sample?: boolean; children: React.ReactNode }) {
  return (
    <DemoChrome audience="owner" sample={sample} title="3P Fee Finder" tagline="What the marketplaces take off the top — by store. First-party % as the lever.">
      {children}
    </DemoChrome>
  );
}

function SampleBanner() {
  return (
    <div className="bg-ink-100 border border-ink-200 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-ink-800 text-sm font-semibold mb-1">Sample data — this isn&apos;t a real restaurant.</p>
        <p className="text-ink-600 text-sm">Made-up numbers for a 5-unit demo. Connect your POS to run this on your own stores.</p>
      </div>
      <Link href="/operators#talk" className="shrink-0 bg-ink-800 hover:bg-ink-900 text-ink-800 font-semibold rounded-full px-4 py-2 text-sm">
        Connect your data
      </Link>
    </div>
  );
}

export function ThreePFeeFinderBody({ data: d, sample }: { data: ThreePFees; sample?: boolean }) {
  return (
    <>
      {sample ? <SampleBanner /> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="3P revenue / yr" value={usd(d.networkTpRevenueYr)} level="verified" sub="annualized from Toast" />
        <Kpi label="Est. fees / yr" value={`${usd(d.networkFees20)}–${usd(d.networkFees25)}`} level="estimated" sub="20–25% assumed take" />
        <Kpi label="First-party % of digital" value={d.networkFirstPartyPct != null ? `${d.networkFirstPartyPct}%` : '—'} level="verified" sub={`target ${d.firstPartyTarget}%`} />
        <Kpi label="Stores below target" value={String(d.storesBelowTarget)} level="verified" sub={`under ${d.firstPartyTarget}% first-party`} />
      </div>

      <div className="bg-ink-100 border border-ink-200 rounded-xl p-4 mb-8">
        <p className="text-ink-800 text-sm font-semibold mb-1">The fee is an estimate — the revenue isn&apos;t.</p>
        <p className="text-ink-600 text-sm">
          We see your third-party revenue from Toast (Verified). The fee is that revenue times an assumed
          20–25% marketplace take. Your real take rate is on your DoorDash and Uber Eats statements — plug it
          in and these turn exact. First-party % is the lever: the more digital you own, the less of this bill you pay.
        </p>
      </div>

      {d.partnerRates && d.partnerRates.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">By partner · contract vs blended effective</h3>
          <div className="card rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-ink-500">
                  <th className="px-4 py-2 font-medium">Partner</th>
                  <th className="px-4 py-2 font-medium text-right">Delivery</th>
                  <th className="px-4 py-2 font-medium text-right">Pickup</th>
                  <th className="px-4 py-2 font-medium text-right">Premium</th>
                  <th className="px-4 py-2 font-medium text-right">Blended effective</th>
                </tr>
              </thead>
              <tbody>
                {d.partnerRates.map((p) => {
                  const eff = blendedEffective(p);
                  const drift = eff - p.contractDelivery;
                  return (
                    <tr key={p.partner} className="border-b border-ink-200/60 last:border-0">
                      <td className="px-4 py-2 text-ink-800">
                        <span className="flex items-center gap-2">
                          {p.partner}
                          <SourceTag level={p.source} />
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-dark-50 tabular-nums">{pct(p.contractDelivery)}</td>
                      <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{p.contractPickup != null ? pct(p.contractPickup) : '—'}</td>
                      <td className="px-4 py-2 text-right text-ink-700 tabular-nums">
                        {p.premiumLabel && p.premiumRate != null
                          ? `${p.premiumLabel} ${pct(p.premiumRate)}${p.premiumShareEstimate != null ? ` · ~${Math.round(p.premiumShareEstimate * 100)}% of orders` : ''}`
                          : '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`tabular-nums font-semibold ${drift > 0 ? 'text-warning-500' : 'text-green-300'}`}>{pct(eff)}</span>
                        {drift > 0 ? <span className="ml-2 text-[10px] font-mono uppercase tracking-wider rounded-full px-2 py-0.5 bg-amber-500/10 text-warning-500 border border-amber-700/40">+{(drift * 100).toFixed(1)}pp</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-ink-500 text-xs mt-2 leading-relaxed">
            Blended effective = (delivery × non-premium share) + (premium × premium share). For DoorDash, a 10% contract blends to ~11.2% if DashPass is ~30% of orders. The drift chip shows how many percentage points above contract the blended rate sits.
          </p>
        </div>
      ) : null}

      {d.renegotiationLever ? (
        <div className="mb-8 rounded-2xl border border-ink-200 bg-ink-50 p-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-warning-500 text-[10px] uppercase tracking-[0.22em] font-mono">The lever · {d.renegotiationLever.precedentLabel}</p>
            <SourceTag level="estimated" />
          </div>
          <p className="text-3xl md:text-4xl font-bold font-mono tabular-nums text-ink-800 mb-1">{usd(d.renegotiationLever.annualSavingsEstimate)}<span className="text-ink-500 text-base font-normal"> / year</span></p>
          <p className="text-ink-600 text-sm mb-3">{usd(d.renegotiationLever.fourWeekSavingsEstimate)} / 4 weeks at this volume</p>
          <p className="text-ink-600 text-sm leading-relaxed">{d.renegotiationLever.basis}</p>
        </div>
      ) : null}

      <div className="mb-8">
        <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">Fee exposure by store</h3>
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">3P rev / yr</th>
                <th className="px-4 py-2 font-medium text-right">Est. fees / yr</th>
                <th className="px-4 py-2 font-medium text-right">First-party %</th>
              </tr>
            </thead>
            <tbody>
              {d.stores.map((s) => (
                <tr key={s.name} className="border-b border-ink-200/60 last:border-0">
                  <td className="px-4 py-2 text-ink-800">
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.flagged ? (
                        <span className="text-[10px] uppercase tracking-wide text-warning-500 bg-amber-500/15 rounded-full px-2 py-0.5">low first-party</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-warning-500 tabular-nums">{usd(s.tpRevenueYr)}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{usd(s.fees20)}–{usd(s.fees25)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${s.flagged ? 'text-warning-500 font-semibold' : 'text-ink-800'}`}>
                    {s.firstPartyPct != null ? `${s.firstPartyPct}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-ink-500 text-xs mt-2">
          Ranked by fee exposure. A &ldquo;low first-party&rdquo; flag means under {d.firstPartyTarget}% of this store&apos;s digital runs on owned channels — the stores where shifting volume off the marketplaces saves the most.
        </p>
      </div>

      <div className="flex items-center gap-2 text-ink-500 text-xs">
        <SourceTag level={sample ? 'unverified' : 'verified'} />
        <span>
          {sample
            ? 'Sample dataset · illustrative only'
            : `3P revenue: from your POS · fees: estimated (assumed take rate) · last refresh ${prettyDate(d.lastIngest)}`}
        </span>
      </div>
    </>
  );
}
