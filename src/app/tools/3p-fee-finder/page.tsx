import { getThreePFees, type ThreePFees } from '@/lib/threePFees';
import { opsDbConfigured } from '@/lib/opsDb';
import { SourceTag } from '@/components/SourceTag';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "3P Fee Finder | Never 86'd" };

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

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <p className="text-dark-300 text-xs uppercase tracking-widest mb-3">Never 86&apos;d · Quick Win</p>
        <h1 className="text-3xl font-bold text-gold-500 mb-1">3P Fee Finder</h1>
        <p className="text-dark-200 mb-8">What the marketplaces take off the top — by store.</p>
        {children}
      </div>
    </main>
  );
}

export default async function ThreePFeeFinderPage() {
  if (!opsDbConfigured()) {
    return (
      <Frame>
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <p className="text-white font-semibold mb-2">Not connected to the ops database yet.</p>
          <p className="text-dark-300 text-sm">
            Set <code className="text-gold-300">OPS_DATABASE_URL</code> in Vercel, then redeploy.
          </p>
        </div>
      </Frame>
    );
  }

  let d: ThreePFees;
  try {
    d = await getThreePFees(3);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <Frame>
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <p className="text-white font-semibold mb-2">Couldn&apos;t reach the ops database.</p>
          <p className="font-mono text-xs text-dark-400 break-all">{msg}</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
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
        <SourceTag level="verified" />
        <span>3P revenue: toast_dining_options · fees: estimated · Toast last sync {prettyDate(d.lastIngest)}</span>
      </div>
    </Frame>
  );
}
