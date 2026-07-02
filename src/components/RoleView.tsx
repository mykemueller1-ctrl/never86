import Link from 'next/link';
import { getCommandCenterData, type CommandCenterData } from '@/lib/commandCenter';
import { getVoidFindings, type VoidFindings } from '@/lib/voidFindings';
import { opsDbConfigured } from '@/lib/opsDb';
import { SourceTag } from './SourceTag';
import { VoidFindingsSection } from './VoidFindingsSection';
import { tagCounts, METRIC_REGISTRY, type TagLevel } from '@/lib/sourceTags';

export type Role = 'ceo' | 'cfo' | 'coo' | 'cto' | 'data';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const humanize = (s: string) => s.replace(/_/g, ' ');

const NAV: { role: Role; href: string; label: string }[] = [
  { role: 'ceo', href: '/command-center', label: 'CEO' },
  { role: 'cfo', href: '/command-center/cfo', label: 'CFO' },
  { role: 'coo', href: '/command-center/coo', label: 'COO' },
  { role: 'cto', href: '/command-center/cto', label: 'CTO' },
  { role: 'data', href: '/command-center/data', label: 'Data Lead' },
];

// Header copy is placeholder per the v2 spec — Bot 1 owns the voice pass.
const HEADERS: Record<Role, { title: string; sub: string }> = {
  ceo: { title: 'What needs your attention', sub: 'The whole network, ranked by what costs you money.' },
  cfo: { title: 'Margin position relative to public peers', sub: 'Food, labor and prime cost benchmarked against public-company filings.' },
  coo: { title: 'Operations and labor by unit', sub: 'Variance, voids and discounts across every store.' },
  cto: { title: 'System and source health', sub: 'Where every number comes from, and whether it’s fresh.' },
  data: { title: 'Every number, every source, every tag', sub: 'Verified, estimated, or unverified — with the export to check us yourself.' },
};

function Kpi({ label, value, level, sub }: { label: string; value: string; level: TagLevel; sub?: string }) {
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-gold-500 text-xs uppercase tracking-wider font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Pending({ label, source }: { label: string; source: string }) {
  return (
    <div className="bg-dark-700/60 border border-dark-600 rounded-xl p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-dark-400 text-xs mt-1">{source}</p>
      </div>
      <SourceTag level="unverified" title="Source not yet wired" />
    </div>
  );
}

function Shell({ role, children }: { role: Role; children: React.ReactNode }) {
  const h = HEADERS[role];
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <p className="text-dark-300 text-xs uppercase tracking-widest mb-3">Never 86&apos;d · Command Center</p>
        <nav className="flex flex-wrap gap-2 mb-8">
          {NAV.map((t) => (
            <Link
              key={t.role}
              href={t.href}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                t.role === role
                  ? 'bg-gold-500 text-dark-900 border-gold-500 font-semibold'
                  : 'bg-dark-700 text-dark-200 border-dark-600 hover:border-gold-500'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <h1 className="text-3xl font-bold text-gold-500 mb-1">{h.title}</h1>
        <p className="text-dark-200 mb-8">{h.sub}</p>
        {children}
      </div>
    </main>
  );
}

function StoreTable({ stores }: { stores: CommandCenterData['stores'] }) {
  const max = Math.max(1, ...stores.map((s) => s.net));
  return (
    <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-dark-600 text-dark-300">
            <th className="px-4 py-2 font-medium">Store</th>
            <th className="px-4 py-2 font-medium">Net sales</th>
            <th className="px-4 py-2 font-medium text-right">First-party %</th>
            <th className="px-4 py-2 font-medium text-right">3P</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((s) => {
            const lowFp = s.firstPartyPct != null && s.firstPartyPct < 50;
            const w = Math.max(4, Math.round((s.net / max) * 100));
            return (
              <tr key={s.name} className="border-b border-dark-600/60 last:border-0">
                <td className="px-4 py-2 text-white">
                  <span className="flex items-center gap-2">
                    {s.name}
                    {lowFp ? (
                      <span className="text-[10px] uppercase tracking-wide text-gold-300 bg-gold-500/15 rounded-full px-2 py-0.5">low 1P</span>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="flex items-center gap-3">
                    <span className="relative inline-block h-1.5 w-24 sm:w-32 rounded bg-white/5 overflow-hidden align-middle">
                      <span className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-gold-700 to-gold-500" style={{ width: `${w}%` }} />
                    </span>
                    <span className="text-gold-300 tabular-nums font-semibold">{usd(s.net)}</span>
                  </span>
                </td>
                <td className={`px-4 py-2 text-right tabular-nums ${lowFp ? 'text-gold-300 font-semibold' : 'text-white'}`}>
                  {s.firstPartyPct != null ? `${s.firstPartyPct}%` : '—'}
                </td>
                <td className="px-4 py-2 text-right text-dark-200 tabular-nums">{usd(s.thirdParty)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExceptionList({ exceptions }: { exceptions: CommandCenterData['exceptions'] }) {
  if (exceptions.length === 0) return <p className="text-dark-300 text-sm">No exceptions tripped this period.</p>;
  return (
    <div className="space-y-2">
      {exceptions.map((e, i) => (
        <div key={i} className="bg-dark-700 border border-dark-600 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wide text-dark-400">
                {e.severity} · {humanize(e.tier)}
              </span>
              <SourceTag level={e.basis === 'measured_leak' ? 'verified' : 'estimated'} />
            </div>
            <p className="text-white text-sm">
              {e.store} — {humanize(e.rule)} ({e.observed}% vs {e.benchmark}% network)
            </p>
          </div>
          <p className="text-gold-300 font-semibold tabular-nums whitespace-nowrap">
            {e.dollarsYr != null ? `${usd(e.dollarsYr)}/yr` : 'opportunity'}
          </p>
        </div>
      ))}
    </div>
  );
}

function NotConnected() {
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
      <p className="text-white font-semibold mb-2">Your live data isn&apos;t connected yet.</p>
      <p className="text-dark-300 text-sm">If you&apos;re seeing this, contact the team and we&apos;ll bring you online.</p>
    </div>
  );
}

export default async function RoleView({
  operatorId,
  role,
  displayName,
}: {
  operatorId: number;
  role: Role;
  displayName?: string;
}) {
  if (!opsDbConfigured()) return <Shell role={role}><NotConnected /></Shell>;

  let d: CommandCenterData;
  try {
    d = await getCommandCenterData(operatorId, displayName);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <Shell role={role}>
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-6">
          <p className="text-white font-semibold mb-2">Couldn’t reach your live data.</p>
          <p className="font-mono text-xs text-dark-400 break-all">{msg}</p>
        </div>
      </Shell>
    );
  }

  // Void Hunter findings — best-effort. If the analysis layer hasn't produced
  // rows for this operator, the section is skipped silently rather than
  // surfacing an empty card.
  let voidFindings: VoidFindings | null = null;
  try {
    const v = await getVoidFindings(operatorId);
    if (v.totalFindings > 0) voidFindings = v;
  } catch { /* skip section */ }

  const tc = tagCounts();

  if (role === 'cfo') {
    return (
      <Shell role="cfo">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Kpi label="Net sales" value={usd(d.networkNet)} level="verified" />
          <Kpi label="3P fees / yr" value={`${usd(d.threePFeesYr20)}–${usd(d.threePFeesYr25)}`} level="estimated" sub="20–25% assumed take rate" />
          <Kpi label="First-party % of digital" value={d.firstPartyPct != null ? `${d.firstPartyPct}%` : '—'} level="verified" sub="target 50%" />
        </div>
        <Section title="Margin vs public peers"><Pending label="SEC public-comp benchmark (food %, labor %, margin)" source="SEC EDGAR — seeding into /seed/external-data/sec_peers.json" /></Section>
        <Section title="Prime cost / food cost %"><Pending label="Prime cost, food cost %, labor %" source="Not connected — invoices & recipes not loaded for these stores" /></Section>
      </Shell>
    );
  }

  if (role === 'coo') {
    return (
      <Shell role="coo">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Kpi label="Stores loaded" value={`${d.storesLoaded} / ${d.totalStores}`} level="verified" />
          <Kpi label="Open exceptions" value={String(d.exceptions.length)} level="verified" />
          <Kpi label="Network net sales" value={usd(d.networkNet)} level="verified" />
        </div>
        <Section title="Operations & labor by unit"><ExceptionList exceptions={d.exceptions} /></Section>
        {voidFindings ? <VoidFindingsSection data={voidFindings} /> : null}
        <Section title="Area wage benchmark"><Pending label="Pay vs BLS market wage by role & metro" source="BLS OEWS — seeding into /seed/external-data/bls_wages.json" /></Section>
      </Shell>
    );
  }

  if (role === 'cto') {
    return (
      <Shell role="cto">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Kpi label="Toast last sync" value={prettyDate(d.lastIngest)} level="verified" />
          <Kpi label="Stores loaded" value={`${d.storesLoaded} / ${d.totalStores}`} level="verified" />
          <Kpi label="Open exceptions" value={String(d.exceptions.length)} level="verified" />
        </div>
        <Section title="Integration health">
          <div className="space-y-2">
            <div className="bg-dark-700 border border-dark-600 rounded-xl p-4 flex items-center justify-between">
              <p className="text-white text-sm">Toast — last sync {prettyDate(d.lastIngest)}</p><SourceTag level="verified" />
            </div>
            {['SEC EDGAR', 'BLS OEWS', 'FRED', 'NOAA', 'USDA FoodData'].map((s) => (
              <div key={s} className="bg-dark-700/60 border border-dark-600 rounded-xl p-4 flex items-center justify-between">
                <p className="text-dark-200 text-sm">{s} — integration pending</p><SourceTag level="unverified" />
              </div>
            ))}
          </div>
        </Section>
        <Section title="Source-tag breakdown">
          <p className="text-dark-200 text-sm">
            <span className="text-green-400 font-semibold">{tc.verified} Verified</span> ·{' '}
            <span className="text-gold-300 font-semibold">{tc.estimated} Estimated</span> ·{' '}
            <span className="text-dark-300 font-semibold">{tc.unverified} Unverified</span> &nbsp;(audit log: building)
          </p>
        </Section>
      </Shell>
    );
  }

  if (role === 'data') {
    return (
      <Shell role="data">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Kpi label="Verified" value={`${tc.verified} / ${tc.total}`} level="verified" sub={`${Math.round((100 * tc.verified) / tc.total)}%`} />
          <Kpi label="Estimated" value={`${tc.estimated} / ${tc.total}`} level="estimated" sub={`${Math.round((100 * tc.estimated) / tc.total)}%`} />
          <Kpi label="Unverified" value={`${tc.unverified} / ${tc.total}`} level="unverified" sub={`${Math.round((100 * tc.unverified) / tc.total)}%`} />
        </div>
        <Section title="Every metric, every source, every tag">
          <div className="bg-dark-700 rounded-xl border border-dark-600 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-dark-600 text-dark-300">
                  <th className="px-4 py-2 font-medium">Metric</th>
                  <th className="px-4 py-2 font-medium">Tag</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_REGISTRY.map((m) => (
                  <tr key={m.metric} className="border-b border-dark-600/60 last:border-0">
                    <td className="px-4 py-2 text-white">{m.metric}</td>
                    <td className="px-4 py-2"><SourceTag level={m.tag} /></td>
                    <td className="px-4 py-2 text-dark-300 text-xs">{m.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="Exports"><Pending label="CSV + Parquet export of the underlying tables" source="Building — pull the raw data into your own warehouse" /></Section>
      </Shell>
    );
  }

  // CEO (default)
  return (
    <Shell role="ceo">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Network net sales" value={usd(d.networkNet)} level="verified" />
        <Kpi label="Recovery surface / yr" value={usd(d.recoverySurfaceYr)} level="estimated" sub="COMPASS-anchored" />
        <Kpi label="First-party % of digital" value={d.firstPartyPct != null ? `${d.firstPartyPct}%` : '—'} level="verified" sub="target 50%" />
        <Kpi label="Open exceptions" value={String(d.exceptions.length)} level="verified" />
      </div>
      <Section title="What needs your attention"><ExceptionList exceptions={d.exceptions} /></Section>
      {voidFindings ? <VoidFindingsSection data={voidFindings} /> : null}
      <Section title="Stores by net sales"><StoreTable stores={d.stores} /></Section>
    </Shell>
  );
}
