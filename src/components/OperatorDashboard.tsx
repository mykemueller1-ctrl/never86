import Link from 'next/link';
import { getCommandCenterData, type CommandCenterData } from '@/lib/commandCenter';
import { buildCoachCards } from '@/lib/coachCards';
import { opsDbConfigured } from '@/lib/opsDb';
import { CoachCards } from './CoachCards';
import { SourceTag } from './SourceTag';
import SignOutButton from './SignOutButton';

// The operator's home, in the executive-brief style built for the multi-unit
// CEO read (clean, calm, every figure carrying its verification pill) — not
// the dark marketing look. Reads like a brief: the week, verified → the next
// moves → the stores.

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const usdCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `$${Math.round(v / 1000)}k`;
  return usd(v);
};
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

function Shell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-ink-800" style={{ background: '#f5f5f7' }}>
      <header className="nav-shell sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>N86</span>
            <span className="font-semibold tracking-tighter text-ink-800 text-[15px]">Never 86&apos;d</span>
            <span className="text-ink-500 text-[12px] font-medium ml-1">· {name}</span>
          </Link>
          <SignOutButton />
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-20">{children}</div>
    </main>
  );
}

function Kpi({ label, value, level, sub }: { label: string; value: string; level: 'verified' | 'estimated'; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1 gap-2">
        <p className="text-ink-500 text-xs uppercase tracking-wide font-medium">{label}</p>
        <SourceTag level={level} />
      </div>
      <p className="text-2xl font-bold text-ink-800 leading-tight tracking-tighter">{value}</p>
      {sub ? <p className="text-ink-500 text-xs mt-1">{sub}</p> : null}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-ink-500 text-[12px] font-semibold uppercase tracking-widest mb-2">{children}</p>;
}

function EmptyState({ name }: { name: string }) {
  return (
    <div className="max-w-xl mx-auto text-center pt-12">
      <Eyebrow>{name}</Eyebrow>
      <h1 className="display text-4xl md:text-5xl mb-4">Your numbers aren&apos;t in yet.</h1>
      <p className="text-ink-600 text-[15px] leading-relaxed mb-8">
        Send one sales report and we&apos;ll show you your first leak in 30 seconds — which store,
        which shift, whose name, and what to do about it.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/trial" className="inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium text-white" style={{ background: '#1d1d1f' }}>
          Drop your first report →
        </Link>
        <a href="mailto:myke@n86.app?subject=Connect%20my%20store" className="inline-flex items-center rounded-full px-5 py-2.5 text-[14px] font-medium text-ink-800 border border-ink-300">
          Connect my POS
        </a>
      </div>
    </div>
  );
}

export default async function OperatorDashboard({ operatorId, displayName }: { operatorId: number; displayName?: string }) {
  if (!opsDbConfigured()) {
    return <Shell name="Dashboard"><EmptyState name="Your restaurant" /></Shell>;
  }
  let d: CommandCenterData;
  try {
    d = await getCommandCenterData(operatorId, displayName);
  } catch {
    return (
      <Shell name="Dashboard">
        <div className="card p-6 max-w-xl mx-auto text-center">
          <p className="text-ink-800 font-semibold mb-1">We couldn&apos;t reach your numbers.</p>
          <p className="text-ink-500 text-sm">Give it a second and refresh — if it keeps happening, email myke@n86.app.</p>
        </div>
      </Shell>
    );
  }
  return <OperatorDashboardView d={d} />;
}

// Pure render — data in, screen out. Kept separate so it can be previewed and
// tested with fixture data.
export function OperatorDashboardView({ d }: { d: CommandCenterData }) {
  const name = d.operatorName ?? 'Your restaurant';
  const hasData = d.networkNet > 0 || d.exceptions.length > 0;
  if (!hasData) return <Shell name={name}><EmptyState name={name} /></Shell>;

  const cards = buildCoachCards(d.exceptions);
  // Headline = the defensible number: verified measured leaks only.
  const nextMoves = cards.reduce((s, c) => s + (c.level === 'verified' && c.dollarsYr ? c.dollarsYr : 0), 0);
  const flagged = new Set(d.exceptions.map((e) => e.store));
  const maxNet = Math.max(1, ...d.stores.map((s) => s.net));

  return (
    <Shell name={name}>
      {/* The brief opening */}
      <div className="mb-10">
        <Eyebrow>{name} · {d.storesLoaded} of {d.totalStores} store{d.totalStores === 1 ? '' : 's'} · synced {prettyDate(d.lastIngest)}</Eyebrow>
        <h1 className="display text-4xl md:text-6xl">The week, verified.</h1>
        <p className="text-ink-600 text-[15px] mt-3 max-w-2xl leading-relaxed">
          {nextMoves > 0 ? (
            <><span className="font-semibold text-ink-800">{usd(nextMoves)}</span> in verified next moves — money we can trace,
            store by store, each with the person who owns it and the one thing to do next.</>
          ) : (
            'Your reads, ready — every figure carrying its source.'
          )}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Kpi label="Net sales" value={usdCompact(d.networkNet)} level="verified" />
        <Kpi label="Next moves" value={usdCompact(nextMoves)} level="verified" sub="measured leaks only" />
        <Kpi label="Things to fix" value={String(d.exceptions.length)} level="verified" />
        <Kpi label="Stores reporting" value={`${d.storesLoaded} / ${d.totalStores}`} level="verified" />
      </div>

      {/* Do this today */}
      <div className="mb-12">
        <Eyebrow>Do this today</Eyebrow>
        <CoachCards exceptions={d.exceptions} limit={5} />
      </div>

      {/* Stores */}
      {d.stores.length > 0 ? (
        <div>
          <Eyebrow>Stores by net sales</Eyebrow>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody>
                {[...d.stores].sort((a, b) => b.net - a.net).map((s) => {
                  const w = Math.round((s.net / maxNet) * 100);
                  return (
                    <tr key={s.name} className="border-b border-ink-200/60 last:border-0">
                      <td className="px-4 py-3 text-ink-800 whitespace-nowrap">
                        {s.name}
                        {flagged.has(s.name) ? (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-warning-500/10 text-warning-500">needs a look</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3" style={{ width: '45%' }}>
                        <span className="relative inline-block h-1.5 w-full rounded bg-ink-200 overflow-hidden align-middle">
                          <span className="absolute inset-y-0 left-0 rounded bg-ink-800" style={{ width: `${w}%` }} />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-ink-800 tabular-nums font-semibold whitespace-nowrap">{usd(s.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
