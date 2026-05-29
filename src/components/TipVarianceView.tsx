import Link from 'next/link';
import { SourceTag } from '@/components/SourceTag';
import type { TipVariance } from '@/lib/tipVariance';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'red' | 'gold' | 'green' }) {
  const v = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-green-300' : tone === 'gold' ? 'text-gold-300' : 'text-white';
  return (
    <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
      <div className="flex items-center justify-between mb-1">
        <p className="text-dark-300 text-xs uppercase tracking-wide">{label}</p>
        <SourceTag level="verified" />
      </div>
      <p className={`text-2xl font-bold leading-tight ${v}`}>{value}</p>
      {sub ? <p className="text-dark-400 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

export function TipVarianceFrame({ sample, children }: { sample?: boolean; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <p className="text-dark-300 text-xs uppercase tracking-widest mb-3">
          Never 86&apos;d · {sample ? 'Demo' : 'Quick Win'} · For managers
        </p>
        <h1 className="text-3xl font-bold text-gold-500 mb-1">Tip Variance</h1>
        <p className="text-dark-200 mb-8">Week-over-week tip movement. The leading indicator the POS misses — service slipping shows up here before sales slip.</p>
        {children}
      </div>
    </main>
  );
}

function SampleBanner() {
  return (
    <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-gold-300 text-sm font-semibold mb-1">Sample data — this isn&apos;t a real restaurant.</p>
        <p className="text-dark-200 text-sm">Made-up tip numbers for a 5-unit demo. Wire your POS tips export to run weekly variance live.</p>
      </div>
      <Link href="/operators#talk" className="shrink-0 bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold rounded-lg px-4 py-2 text-sm">
        Connect your data
      </Link>
    </div>
  );
}

export function TipVarianceBody({ data: d, sample }: { data: TipVariance; sample?: boolean }) {
  return (
    <>
      {sample ? <SampleBanner /> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Network tips" value={usd(d.networkTotalTips)} sub={d.weekLabel} />
        <Kpi label="Network avg / cover" value={`$${d.networkAvgPerCover.toFixed(2)}`} sub="weighted across all stores" />
        <Kpi
          label="Week-over-week"
          value={pct(d.networkVariancePct)}
          sub={d.networkVariancePct < -0.05 ? 'meaningful slip — pull the pattern' : d.networkVariancePct < 0 ? 'slight drift' : 'on pace'}
          tone={d.networkVariancePct < -0.05 ? 'red' : d.networkVariancePct < 0 ? 'gold' : 'green'}
        />
        <Kpi label="Stores flagged" value={`${d.storesFlagged} of ${d.stores.length}`} sub="more than 5% below last week" tone={d.storesFlagged > 0 ? 'gold' : 'green'} />
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
        <p className="text-amber-300 text-sm font-semibold mb-1">This flags patterns, not verdicts.</p>
        <p className="text-dark-200 text-sm">
          Tip variance is service signal — a slow week, weather, a closed corridor, a tip-pool change can all push the
          number. Read it against covers and against last year&apos;s same week before deciding anything personal.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Stores · tips vs last week</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">Total tips</th>
                <th className="px-4 py-2 font-medium text-right">Per cover</th>
                <th className="px-4 py-2 font-medium text-right">WoW</th>
              </tr>
            </thead>
            <tbody>
              {d.stores.map((s) => {
                const down = s.weekVariance < 0;
                const big = Math.abs(s.weekVariance) > 0.05;
                return (
                  <tr key={s.name} className="border-b border-dark-600/60 last:border-0">
                    <td className="px-4 py-2 text-white">{s.name}</td>
                    <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(s.totalTips)}</td>
                    <td className="px-4 py-2 text-right text-dark-200 tabular-nums">${s.perCoverAvg.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`tabular-nums ${down && big ? 'text-amber-300' : down ? 'text-dark-200' : 'text-green-300'}`}>{pct(s.weekVariance)}</span>
                      {s.flagged ? <span className="ml-2 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-700/40">flagged</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Top movers (up &amp; down)</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium text-right">This week</th>
                <th className="px-4 py-2 font-medium text-right">Last week</th>
                <th className="px-4 py-2 font-medium text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              {d.movers.map((m, i) => (
                <tr key={`${m.store}-${m.name}-${i}`} className="border-b border-dark-600/60 last:border-0">
                  <td className="px-4 py-2 text-white">{m.store}</td>
                  <td className="px-4 py-2 text-white">{m.name}</td>
                  <td className="px-4 py-2 text-dark-300 capitalize">{m.role}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(m.tipsThisWeek)}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(m.tipsLastWeek)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`tabular-nums ${m.deltaPct < -0.15 ? 'text-amber-300' : m.deltaPct > 0.1 ? 'text-green-300' : 'text-dark-200'}`}>{pct(m.deltaPct)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-dark-700 border border-dark-600 rounded-xl p-5">
        <p className="text-gold-500 text-xs uppercase tracking-widest mb-2">What this signals</p>
        <ul className="text-dark-200 text-sm space-y-1.5 list-disc list-inside">
          <li>Tip per cover slipping for two consecutive weeks at the same store usually means a section-assignment or staffing problem, not a service problem.</li>
          <li>A single employee dropping 25%+ while peers hold flat is a coaching conversation, not a discipline one.</li>
          <li>Bar tip slippage with FOH steady often points to bartender section coverage during peak — pull the schedule against the slip.</li>
        </ul>
      </div>
    </>
  );
}
