import Link from 'next/link';
import { SourceTag } from '@/components/SourceTag';
import type { ThreePFees } from '@/lib/threePFees';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function Kpi({ label, value, sub, level }: { label: string; value: string; sub?: string; level: 'verified' | 'estimated' }) {
  return (
    <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
      <div className="flex items-center justify-between mb-1">
        <p className="text-dark-300 text-xs uppercase tracking-wide">{label}</p>
        <SourceTag level={level} />
      </div>
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      {sub ? <p className="text-dark-400 text-xs mt-1">{sub}</p> : null}
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
    <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-gold-300 text-sm font-semibold mb-1">Sample data — this isn&apos;t a real restaurant.</p>
        <p className="text-dark-200 text-sm">Made-up numbers for a 5-unit demo. Connect your POS to run this on your own stores.</p>
      </div>
      <Link href="/#waitlist" className="shrink-0 bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold rounded-lg px-4 py-2 text-sm">
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

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
        <p className="text-amber-300 text-sm font-semibold mb-1">The fee is an estimate — the revenue isn&apos;t.</p>
        <p className="text-dark-200 text-sm">
          We see your third-party revenue from Toast (Verified). The fee is that revenue times an assumed
          20–25% marketplace take. Your real take rate is on your DoorDash and Uber Eats statements — plug it
          in and these turn exact. First-party % is the lever: the more digital you own, the less of this bill you pay.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Fee exposure by store</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">3P rev / yr</th>
                <th className="px-4 py-2 font-medium text-right">Est. fees / yr</th>
                <th className="px-4 py-2 font-medium text-right">First-party %</th>
              </tr>
            </thead>
            <tbody>
              {d.stores.map((s) => (
                <tr key={s.name} className="border-b border-dark-600/60 last:border-0">
                  <td className="px-4 py-2 text-white">
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.flagged ? (
                        <span className="text-[10px] uppercase tracking-wide text-amber-300 bg-amber-500/15 rounded-full px-2 py-0.5">low first-party</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gold-300 tabular-nums">{usd(s.tpRevenueYr)}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(s.fees20)}–{usd(s.fees25)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${s.flagged ? 'text-amber-300 font-semibold' : 'text-white'}`}>
                    {s.firstPartyPct != null ? `${s.firstPartyPct}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-dark-400 text-xs mt-2">
          Ranked by fee exposure. A &ldquo;low first-party&rdquo; flag means under {d.firstPartyTarget}% of this store&apos;s digital runs on owned channels — the stores where shifting volume off the marketplaces saves the most.
        </p>
      </div>

      <div className="flex items-center gap-2 text-dark-400 text-xs">
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
