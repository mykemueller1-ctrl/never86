import Link from 'next/link';
import { SourceTag } from '@/components/SourceTag';
import type { VoidHunter } from '@/lib/voidHunter';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-dark-700 rounded-xl p-5 border border-dark-600">
      <div className="flex items-center justify-between mb-1">
        <p className="text-dark-300 text-xs uppercase tracking-wide">{label}</p>
        <SourceTag level="verified" />
      </div>
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      {sub ? <p className="text-dark-400 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

export function VoidHunterFrame({ sample, children }: { sample?: boolean; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <p className="text-dark-300 text-xs uppercase tracking-widest mb-3">
          Never 86&apos;d · {sample ? 'Demo' : 'Quick Win'}
        </p>
        <h1 className="text-3xl font-bold text-gold-500 mb-1">Void Hunter</h1>
        <p className="text-dark-200 mb-8">Where voids run hot — by store, then by name.</p>
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
        <p className="text-dark-200 text-sm">Made-up numbers for a 5-unit demo. Connect your POS to run this on your own stores.</p>
      </div>
      <Link href="/#waitlist" className="shrink-0 bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold rounded-lg px-4 py-2 text-sm">
        Connect your data
      </Link>
    </div>
  );
}

export function VoidHunterBody({ data: d, sample }: { data: VoidHunter; sample?: boolean }) {
  return (
    <>
      {sample ? <SampleBanner /> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Network voids" value={usd(d.networkVoids)} sub={`${pct(d.networkVoidRate)} of net`} />
        <Kpi label="Network void rate" value={pct(d.networkVoidRate)} sub={`${usd(d.networkNet)} net sales`} />
        <Kpi label="Median store rate" value={pct(d.medianStoreVoidRate)} sub="peer baseline" />
        <Kpi label="Stores above the line" value={String(d.storesFlagged)} sub="more than 1.5× median" />
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
        <p className="text-amber-300 text-sm font-semibold mb-1">This flags patterns, not verdicts.</p>
        <p className="text-dark-200 text-sm">
          A high void rate is a reason to read the void reasons — not proof of anything. Some rows are channel
          buckets, not a single person. Start at the top, pull the reasons, then decide.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Stores above the line</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">Net</th>
                <th className="px-4 py-2 font-medium text-right">Voids</th>
                <th className="px-4 py-2 font-medium text-right">Void rate</th>
                <th className="px-4 py-2 font-medium text-right">Excess / yr</th>
              </tr>
            </thead>
            <tbody>
              {d.stores.map((s) => (
                <tr key={s.name} className="border-b border-dark-600/60 last:border-0">
                  <td className="px-4 py-2 text-white">
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.flagged ? (
                        <span className="text-[10px] uppercase tracking-wide text-amber-300 bg-amber-500/15 rounded-full px-2 py-0.5">flag</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gold-300 tabular-nums">{usd(s.net)}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(s.voids)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${s.flagged ? 'text-amber-300 font-semibold' : 'text-white'}`}>{pct(s.voidRate)}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{s.excessYr > 0 ? `${usd(s.excessYr)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-dark-400 text-xs mt-2">
          Excess / yr = void dollars above the peer-median rate for that store&apos;s net, annualized. A scale of the gap, not a recovery promise.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">Who to look at first</h3>
        <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-600 text-dark-300">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">Void $</th>
                <th className="px-4 py-2 font-medium text-right">Items</th>
                <th className="px-4 py-2 font-medium text-right">Void rate</th>
              </tr>
            </thead>
            <tbody>
              {d.employees.map((e, i) => (
                <tr key={`${e.store}-${e.name}-${i}`} className="border-b border-dark-600/60 last:border-0">
                  <td className="px-4 py-2 text-white">
                    <span className="flex items-center gap-2">
                      {e.name}
                      {e.flagged ? (
                        <span className="text-[10px] uppercase tracking-wide text-amber-300 bg-amber-500/15 rounded-full px-2 py-0.5">flag</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-dark-200">{e.store}</td>
                  <td className="px-4 py-2 text-right text-gold-300 tabular-nums">{usd(e.voidAmount)}</td>
                  <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{e.voidedItems}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${e.flagged ? 'text-amber-300 font-semibold' : 'text-white'}`}>{pct(e.voidRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-dark-400 text-xs mt-2">
          Top void dollars this period. A &ldquo;flag&rdquo; means a high rate <em>and</em> real dollars — but a name on a register can be a shared till. Read the reasons before you act.
        </p>
      </div>

      <div className="flex items-center gap-2 text-dark-400 text-xs">
        <SourceTag level={sample ? 'unverified' : 'verified'} />
        <span>
          {sample
            ? 'Sample dataset · illustrative only'
            : `From your POS · latest period · last refresh ${prettyDate(d.lastIngest)}`}
        </span>
      </div>
    </>
  );
}
