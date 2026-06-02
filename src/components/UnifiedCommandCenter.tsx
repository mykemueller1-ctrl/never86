import Link from 'next/link';
import { getCommandCenterData, type CommandCenterData } from '@/lib/commandCenter';
import { getVoidFindings, type VoidFindings } from '@/lib/voidFindings';
import { opsDbConfigured } from '@/lib/opsDb';
import { SourceTag } from './SourceTag';
import { VoidFindingsSection } from './VoidFindingsSection';
import { tagCounts, METRIC_REGISTRY, type TagLevel } from '@/lib/sourceTags';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const humanize = (s: string) => s.replace(/_/g, ' ');

const NAV = [
  { id: 'ceo', label: 'CEO' },
  { id: 'cfo', label: 'CFO' },
  { id: 'coo', label: 'COO' },
  { id: 'cto', label: 'CTO' },
  { id: 'data', label: 'Data' },
];

function Kpi({ label, value, level, sub }: { label: string; value: string; level: TagLevel; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-ink-500 text-xs uppercase tracking-wide font-medium">{label}</p>
        <SourceTag level={level} />
      </div>
      <p className="text-2xl font-bold text-ink-800 leading-tight tracking-tighter">{value}</p>
      {sub ? <p className="text-ink-500 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

function SectionHeader({ id, label, title }: { id: string; label: string; title: string }) {
  return (
    <div id={id} className="scroll-mt-20 mb-6">
      <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">{label}</p>
      <h2 className="display text-3xl md:text-5xl">{title}</h2>
    </div>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return <h3 className="text-ink-800 text-xs uppercase tracking-widest font-semibold mb-3">{children}</h3>;
}

function Pending({ label, source }: { label: string; source: string }) {
  return (
    <div className="card p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-ink-800 text-sm font-medium">{label}</p>
        <p className="text-ink-500 text-xs mt-1">{source}</p>
      </div>
      <SourceTag level="unverified" title="Source not yet wired" />
    </div>
  );
}

function StoreTable({ stores }: { stores: CommandCenterData['stores'] }) {
  if (stores.length === 0) {
    return <p className="text-ink-500 text-sm">No stores loaded yet.</p>;
  }
  const max = Math.max(1, ...stores.map((s) => s.net));
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-ink-500">
            <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Store</th>
            <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-right">Net sales</th>
            <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-right">First-party %</th>
            <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-right">Third-party</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((s) => {
            const w = Math.round((s.net / max) * 100);
            const lowFp = s.firstPartyPct != null && s.firstPartyPct < 50;
            return (
              <tr key={s.name} className="border-b border-ink-200/60 last:border-0">
                <td className="px-4 py-3 text-ink-800">{s.name}</td>
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-3">
                    <span className="relative inline-block h-1.5 w-24 sm:w-32 rounded bg-ink-200 overflow-hidden align-middle">
                      <span className="absolute inset-y-0 left-0 rounded bg-ink-800" style={{ width: `${w}%` }} />
                    </span>
                    <span className="text-ink-800 tabular-nums font-semibold">{usd(s.net)}</span>
                  </span>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${lowFp ? 'text-warning-500 font-semibold' : 'text-ink-800'}`}>
                  {s.firstPartyPct != null ? `${s.firstPartyPct}%` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-ink-600 tabular-nums">{usd(s.thirdParty)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExceptionList({ exceptions }: { exceptions: CommandCenterData['exceptions'] }) {
  if (exceptions.length === 0) return <p className="text-ink-500 text-sm">No exceptions tripped this period.</p>;
  return (
    <div className="space-y-2">
      {exceptions.map((e, i) => (
        <div key={i} className="card p-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wide text-ink-500 font-mono">
                {e.severity} · {humanize(e.tier)}
              </span>
              <SourceTag level={e.basis === 'measured_leak' ? 'verified' : 'estimated'} />
            </div>
            <p className="text-ink-800 text-sm">
              {e.store} — {humanize(e.rule)} ({e.observed}% vs {e.benchmark}% network)
            </p>
          </div>
          <p className="text-ink-800 font-semibold tabular-nums whitespace-nowrap">
            {e.dollarsYr != null ? `${usd(e.dollarsYr)}/yr` : 'opportunity'}
          </p>
        </div>
      ))}
    </div>
  );
}

function NotConnected() {
  return (
    <div className="card p-8 text-center">
      <p className="text-ink-800 font-semibold mb-2">Your live data isn&apos;t connected yet.</p>
      <p className="text-ink-500 text-sm">Reach out and we&apos;ll bring you online.</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
            <span className="text-ink-500 text-[12px] font-medium ml-1">· Command Center</span>
          </Link>
          <nav className="flex items-center gap-0.5 text-[13px] text-ink-600">
            {NAV.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="px-3 py-1.5 rounded-full hover:text-ink-800 hover:bg-black/[0.04]">{t.label}</a>
            ))}
            <Link href="/admin/never86" className="px-3 py-1.5 rounded-full text-ink-800 hover:bg-black/[0.04] font-medium ml-2">Admin</Link>
          </nav>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">{children}</div>
    </main>
  );
}

export default async function UnifiedCommandCenter({ operatorId, displayName }: { operatorId: number; displayName?: string }) {
  if (!opsDbConfigured()) return <Shell><NotConnected /></Shell>;

  let d: CommandCenterData;
  try {
    d = await getCommandCenterData(operatorId, displayName);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <Shell>
        <div className="card p-6">
          <p className="text-ink-800 font-semibold mb-2">Couldn&apos;t reach your live data.</p>
          <p className="font-mono text-xs text-ink-500 break-all">{msg}</p>
        </div>
      </Shell>
    );
  }

  let voidFindings: VoidFindings | null = null;
  try {
    const v = await getVoidFindings(operatorId);
    if (v.totalFindings > 0) voidFindings = v;
  } catch { /* skip */ }

  const tc = tagCounts();

  return (
    <Shell>
      {/* Hero summary line */}
      <div className="mb-12">
        <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">{d.operatorName ?? 'Network'} · last synced {prettyDate(d.lastIngest)}</p>
        <h1 className="display text-4xl md:text-6xl">One screen.</h1>
      </div>

      {/* CEO */}
      <section className="mb-16">
        <SectionHeader id="ceo" label="CEO" title="What needs your attention." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Kpi label="Network net sales" value={usd(d.networkNet)} level="verified" />
          <Kpi label="Recovery surface / yr" value={usd(d.recoverySurfaceYr)} level="estimated" sub="COMPASS-anchored" />
          <Kpi label="First-party %" value={d.firstPartyPct != null ? `${d.firstPartyPct}%` : '—'} level="verified" sub="target 50%" />
          <Kpi label="Open exceptions" value={String(d.exceptions.length)} level="verified" />
        </div>
        <Subhead>What needs your attention</Subhead>
        <div className="mb-6"><ExceptionList exceptions={d.exceptions} /></div>
        {voidFindings ? <VoidFindingsSection data={voidFindings} /> : null}
        <div className="mt-6">
          <Subhead>Stores by net sales</Subhead>
          <StoreTable stores={d.stores} />
        </div>
      </section>

      {/* CFO */}
      <section className="mb-16 pt-8 border-t border-ink-200">
        <SectionHeader id="cfo" label="CFO" title="Margin position." />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Kpi label="Net sales" value={usd(d.networkNet)} level="verified" />
          <Kpi label="3P fees / yr" value={`${usd(d.threePFeesYr20)}–${usd(d.threePFeesYr25)}`} level="estimated" sub="20–25% assumed take rate" />
          <Kpi label="First-party % of digital" value={d.firstPartyPct != null ? `${d.firstPartyPct}%` : '—'} level="verified" sub="target 50%" />
        </div>
        <Subhead>Margin vs public peers</Subhead>
        <div className="mb-6"><Pending label="SEC public-comp benchmark (food %, labor %, margin)" source="SEC EDGAR — integration pending" /></div>
        <Subhead>Prime cost / food cost %</Subhead>
        <Pending label="Prime cost, food cost %, labor %" source="Not connected — invoices & recipes not loaded" />
      </section>

      {/* COO */}
      <section className="mb-16 pt-8 border-t border-ink-200">
        <SectionHeader id="coo" label="COO" title="Operations by unit." />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Kpi label="Stores loaded" value={`${d.storesLoaded} / ${d.totalStores}`} level="verified" />
          <Kpi label="Open exceptions" value={String(d.exceptions.length)} level="verified" />
          <Kpi label="Network net sales" value={usd(d.networkNet)} level="verified" />
        </div>
        <Subhead>Operations &amp; labor by unit</Subhead>
        <div className="mb-6"><ExceptionList exceptions={d.exceptions} /></div>
        <Subhead>Area wage benchmark</Subhead>
        <Pending label="Pay vs BLS market wage by role &amp; metro" source="BLS OEWS — integration pending" />
      </section>

      {/* CTO */}
      <section className="mb-16 pt-8 border-t border-ink-200">
        <SectionHeader id="cto" label="CTO" title="System health." />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Kpi label="Toast last sync" value={prettyDate(d.lastIngest)} level="verified" />
          <Kpi label="Stores loaded" value={`${d.storesLoaded} / ${d.totalStores}`} level="verified" />
          <Kpi label="Open exceptions" value={String(d.exceptions.length)} level="verified" />
        </div>
        <Subhead>Integration health</Subhead>
        <div className="space-y-2 mb-6">
          <div className="card p-4 flex items-center justify-between">
            <p className="text-ink-800 text-sm">Toast — last sync {prettyDate(d.lastIngest)}</p><SourceTag level="verified" />
          </div>
          {['SEC EDGAR', 'BLS OEWS', 'FRED', 'NOAA', 'USDA FoodData'].map((s) => (
            <div key={s} className="card p-4 flex items-center justify-between">
              <p className="text-ink-600 text-sm">{s} — integration pending</p><SourceTag level="unverified" />
            </div>
          ))}
        </div>
        <Subhead>Source-tag breakdown</Subhead>
        <p className="text-ink-600 text-sm">
          <span className="text-success-500 font-semibold">{tc.verified} Verified</span> ·{' '}
          <span className="text-warning-500 font-semibold">{tc.estimated} Estimated</span> ·{' '}
          <span className="text-ink-500 font-semibold">{tc.unverified} Unverified</span>
        </p>
      </section>

      {/* Data Lead */}
      <section className="mb-16 pt-8 border-t border-ink-200">
        <SectionHeader id="data" label="Data" title="Every number, every source." />
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Kpi label="Verified" value={`${tc.verified} / ${tc.total}`} level="verified" sub={`${Math.round((100 * tc.verified) / tc.total)}%`} />
          <Kpi label="Estimated" value={`${tc.estimated} / ${tc.total}`} level="estimated" sub={`${Math.round((100 * tc.estimated) / tc.total)}%`} />
          <Kpi label="Unverified" value={`${tc.unverified} / ${tc.total}`} level="unverified" sub={`${Math.round((100 * tc.unverified) / tc.total)}%`} />
        </div>
        <Subhead>Every metric, every source, every tag</Subhead>
        <div className="card overflow-hidden mb-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
                <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Metric</th>
                <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Tag</th>
                <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Source</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_REGISTRY.map((m) => (
                <tr key={m.metric} className="border-b border-ink-200/60 last:border-0">
                  <td className="px-4 py-3 text-ink-800">{m.metric}</td>
                  <td className="px-4 py-3"><SourceTag level={m.tag} /></td>
                  <td className="px-4 py-3 text-ink-600 text-xs">{m.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Subhead>Exports</Subhead>
        <Pending label="CSV + Parquet export of the underlying tables" source="Building — pull the raw data into your own warehouse" />
      </section>
    </Shell>
  );
}
