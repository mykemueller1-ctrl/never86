import Link from 'next/link';
import { SourceTag } from '@/components/SourceTag';
import type { VoidHunter } from '@/lib/voidHunter';
import { TrackedLink } from '@/components/TrackedLink';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-ink-500 text-xs uppercase tracking-wide">{label}</p>
        <SourceTag level="verified" />
      </div>
      <p className="text-2xl font-bold text-ink-800 leading-tight">{value}</p>
      {sub ? <p className="text-ink-500 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

import { DemoChrome } from '@/components/DemoChrome';

export function VoidHunterFrame({ sample, children }: { sample?: boolean; children: React.ReactNode }) {
  return (
    <DemoChrome audience="owner" sample={sample} title="Void Hunter" tagline="Where voids run hot — by store, then by name.">
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
      <TrackedLink href="/operators#talk" event="demo_connect_data_click" meta={{ agent: 'Void Hunter', target: '/operators#talk' }} className="shrink-0 bg-ink-800 hover:bg-ink-900 text-ink-800 font-semibold rounded-full px-4 py-2 text-sm">
        Connect your data
      </TrackedLink>
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

      <div className="bg-ink-100 border border-ink-200 rounded-xl p-4 mb-8">
        <p className="text-ink-800 text-sm font-semibold mb-1">This flags patterns, not verdicts.</p>
        <p className="text-ink-600 text-sm">
          A high void rate is a reason to read the void reasons — not proof of anything. Some rows are channel
          buckets, not a single person. Start at the top, pull the reasons, then decide.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">Stores above the line</h3>
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">Net</th>
                <th className="px-4 py-2 font-medium text-right">Voids</th>
                <th className="px-4 py-2 font-medium text-right">Void rate</th>
                <th className="px-4 py-2 font-medium text-right">Excess / yr</th>
              </tr>
            </thead>
            <tbody>
              {d.stores.map((s) => (
                <tr key={s.name} className="border-b border-ink-200/60 last:border-0">
                  <td className="px-4 py-2 text-ink-800">
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.flagged ? (
                        <span className="text-[10px] uppercase tracking-wide text-warning-500 bg-amber-500/15 rounded-full px-2 py-0.5">flag</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-warning-500 tabular-nums">{usd(s.net)}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{usd(s.voids)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${s.flagged ? 'text-warning-500 font-semibold' : 'text-ink-800'}`}>{pct(s.voidRate)}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{s.excessYr > 0 ? `${usd(s.excessYr)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-ink-500 text-xs mt-2">
          Excess / yr = void dollars above the peer-median rate for that store&apos;s net, annualized. A scale of the gap, not a recovery promise.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">Who to look at first</h3>
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">Void $</th>
                <th className="px-4 py-2 font-medium text-right">Items</th>
                <th className="px-4 py-2 font-medium text-right">Void rate</th>
              </tr>
            </thead>
            <tbody>
              {d.employees.map((e, i) => (
                <tr key={`${e.store}-${e.name}-${i}`} className="border-b border-ink-200/60 last:border-0">
                  <td className="px-4 py-2 text-ink-800">
                    <span className="flex items-center gap-2">
                      {e.name}
                      {e.flagged ? (
                        <span className="text-[10px] uppercase tracking-wide text-warning-500 bg-amber-500/15 rounded-full px-2 py-0.5">flag</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-dark-200">{e.store}</td>
                  <td className="px-4 py-2 text-right text-warning-500 tabular-nums">{usd(e.voidAmount)}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{e.voidedItems}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${e.flagged ? 'text-warning-500 font-semibold' : 'text-ink-800'}`}>{pct(e.voidRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-ink-500 text-xs mt-2">
          Top void dollars this period. A &ldquo;flag&rdquo; means a high rate <em>and</em> real dollars — but a name on a register can be a shared till. Read the reasons before you act.
        </p>
      </div>

      <div className="flex items-center gap-2 text-ink-500 text-xs">
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
