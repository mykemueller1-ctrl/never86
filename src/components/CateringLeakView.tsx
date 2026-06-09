import Link from 'next/link';
import { SourceTag } from '@/components/SourceTag';
import type { CateringLeak } from '@/lib/cateringLeak';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'red' | 'gold' | 'green' }) {
  const v = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-green-300' : tone === 'gold' ? 'text-warning-500' : 'text-ink-800';
  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-ink-500 text-xs uppercase tracking-wide">{label}</p>
        <SourceTag level="verified" />
      </div>
      <p className={`text-2xl font-bold leading-tight ${v}`}>{value}</p>
      {sub ? <p className="text-ink-500 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

import { DemoChrome } from '@/components/DemoChrome';

export function CateringLeakFrame({ sample, children }: { sample?: boolean; children: React.ReactNode }) {
  return (
    <DemoChrome audience="owner" sample={sample} title="Catering Leak" tagline="Per-store catering economics + invoice-vs-POS reconciliation gap. Where the orders ran but the receipts didn't.">
      {children}
    </DemoChrome>
  );
}

function SampleBanner() {
  return (
    <div className="bg-ink-100 border border-ink-200 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-ink-800 text-sm font-semibold mb-1">Sample data — this isn&apos;t a real restaurant.</p>
        <p className="text-ink-600 text-sm">Made-up numbers for a 5-unit demo. Wire your POS + invoice ingest to reconcile catering live.</p>
      </div>
      <Link href="/operators#talk" className="shrink-0 bg-ink-800 hover:bg-ink-900 text-white font-semibold rounded-full px-4 py-2 text-sm">
        Connect your data
      </Link>
    </div>
  );
}

export function CateringLeakBody({ data: d, sample }: { data: CateringLeak; sample?: boolean }) {
  return (
    <>
      {sample ? <SampleBanner /> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Network catering net" value={usd(d.networkCateringNet)} sub={`${d.networkCateringOrders} orders · ${usd(d.networkAvgTicket)} avg`} />
        <Kpi label="Catering vs in-store ticket" value={`${d.ticketMultiplier.toFixed(1)}×`} sub={`${usd(d.networkAvgTicket)} vs ${usd(d.inStoreAvgTicket)} per order`} tone="gold" />
        <Kpi label="Reconciliation gap" value={usd(d.reconciledGapDollars)} sub={`${pct(d.reconciledGapPct)} of catering net never matched the POS`} tone="red" />
        <Kpi label="Stores above 5% gap" value={`${d.storesFlagged} of ${d.stores.length}`} sub="needs invoice reconciliation" tone="gold" />
      </div>

      <div className="bg-ink-100 border border-ink-200 rounded-xl p-4 mb-8">
        <p className="text-ink-800 text-sm font-semibold mb-1">This flags patterns, not verdicts.</p>
        <p className="text-ink-600 text-sm">
          A reconciliation gap is the difference between what was invoiced and what the POS recorded. Some gaps are
          legitimate (paid by check after the fact, in-house deposit handling). Others are orders that ran but never
          rang. Pull the invoice list per flagged store and start there.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">By channel</h3>
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
                <th className="px-4 py-2 font-medium">Channel</th>
                <th className="px-4 py-2 font-medium text-right">Net</th>
                <th className="px-4 py-2 font-medium text-right">Orders</th>
                <th className="px-4 py-2 font-medium text-right">Effective fee</th>
              </tr>
            </thead>
            <tbody>
              {d.channels.map((c) => (
                <tr key={c.name} className="border-b border-ink-200/60 last:border-0">
                  <td className="px-4 py-2 text-ink-800">{c.name}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{usd(c.net)}</td>
                  <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{c.orders}</td>
                  <td className="px-4 py-2 text-right">
                    {c.feePct > 0 ? (
                      <span className={`tabular-nums ${c.feePct > 0.1 ? 'text-warning-500' : 'text-dark-200'}`}>{pct(c.feePct)}</span>
                    ) : (
                      <span className="text-green-300 tabular-nums">0%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-ink-800 text-xs uppercase tracking-wider font-semibold mb-3">Stores · catering net vs invoiced</h3>
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
                <th className="px-4 py-2 font-medium">Store</th>
                <th className="px-4 py-2 font-medium text-right">Net</th>
                <th className="px-4 py-2 font-medium text-right">Orders</th>
                <th className="px-4 py-2 font-medium text-right">Avg ticket</th>
                <th className="px-4 py-2 font-medium text-right">Invoiced</th>
                <th className="px-4 py-2 font-medium text-right">Gap</th>
              </tr>
            </thead>
            <tbody>
              {d.stores.map((s) => {
                const gapPct = s.reconciledGap / s.cateringNet;
                const barPos = Math.min(100, (s.cateringNet / 200_000) * 100);
                return (
                  <tr key={s.name} className="border-b border-ink-200/60 last:border-0">
                    <td className="px-4 py-2 text-ink-800">{s.name}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="flex items-center justify-end gap-3">
                        <span className="relative inline-block h-1.5 w-20 rounded bg-ink-200 overflow-hidden align-middle">
                          <span className="absolute left-0 top-0 h-full bg-gradient-to-r from-gold-700 to-gold-400" style={{ width: `${barPos}%` }} />
                        </span>
                        <span className="tabular-nums text-ink-800">{usd(s.cateringNet)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{s.cateringOrders}</td>
                    <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{usd(s.avgTicket)}</td>
                    <td className="px-4 py-2 text-right text-ink-700 tabular-nums">{usd(s.invoicedNet)}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`tabular-nums ${s.flagged ? 'text-warning-500' : 'text-dark-200'}`}>{usd(s.reconciledGap)}</span>
                      {s.flagged ? <span className="ml-2 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-500/10 text-warning-500 border border-amber-700/40">+{pct(gapPct)}</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card rounded-xl p-5">
        <p className="text-ink-800 text-xs uppercase tracking-widest mb-2">What to do next</p>
        <ul className="text-ink-600 text-sm space-y-1.5 list-disc list-inside">
          <li>Pull the invoice list for each flagged store and reconcile against POS catering tickets line-by-line.</li>
          <li>Shift volume off EzCater / Foodja (18% fee) into Toast Catering (2.9%) or in-house. Same revenue, dramatically better margin.</li>
          <li>Set a per-store catering deposit policy — eliminates the &quot;ran but never rang&quot; pattern at its source.</li>
        </ul>
      </div>
    </>
  );
}
