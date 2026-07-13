import Link from 'next/link';
import { getCommandCenterData, type CommandCenterData } from '@/lib/commandCenter';
import { buildCoachCards, type CoachCard } from '@/lib/coachCards';
import { opsDbConfigured } from '@/lib/opsDb';
import SignOutButton from './SignOutButton';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
// Compact money for the KPI tiles so large values never overflow their cell.
const usdCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `$${Math.round(v / 1000)}k`;
  return usd(v);
};
const prettyDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function Header({ name }: { name: string }) {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-6 flex items-center justify-between gap-4 flex-wrap">
      <Link href="/" className="flex items-center gap-3 group">
        <span className="compass-mark">N</span>
        <span className="font-serif text-[20px] text-white">
          Never 86&apos;d <span className="italic text-white/60">· {name}</span>
        </span>
      </Link>
      <SignOutButton />
    </div>
  );
}

function DarkCoachCard({ c, rank }: { c: CoachCard; rank: number }) {
  const tagColor = c.level === 'verified' ? '#34c759' : '#ff9500';
  const tagText = c.level === 'verified' ? 'VERIFIED' : 'ESTIMATED';
  return (
    <div className="compass-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold tabular-nums" style={{ background: '#0066ff', color: '#fff' }}>{rank}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#c7c7cc' }}>
            {c.owner} owns this
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded" style={{ background: `${tagColor}1a`, color: tagColor, border: `1px solid ${tagColor}40` }}>{tagText}</span>
        </div>
        <p className="font-serif text-xl text-white tabular-nums whitespace-nowrap" style={{ letterSpacing: '-0.02em' }}>
          {c.dollarsYr != null ? `${usd(c.dollarsYr)}` : 'upside'}<span className="text-[13px]" style={{ color: '#6e6e73' }}>{c.dollarsYr != null ? '/yr' : ''}</span>
        </p>
      </div>
      <h4 className="font-serif text-xl md:text-2xl text-white mt-3" style={{ letterSpacing: '-0.01em' }}>{c.title}</h4>
      <p className="compass-body text-[14px] mt-2" style={{ color: '#86868b' }}>{c.why}</p>
      <div className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.18)' }}>
        <span className="text-[11px] font-bold uppercase tracking-wider mt-0.5 whitespace-nowrap" style={{ color: '#0066ff' }}>Do this</span>
        <p className="text-white text-[14.5px] font-medium leading-relaxed">{c.action}</p>
      </div>
    </div>
  );
}

function EmptyState({ name }: { name: string }) {
  return (
    <section className="max-w-2xl mx-auto px-6 pt-16 md:pt-24 text-center">
      <p className="compass-eyebrow mb-4">— {name}</p>
      <h1 className="compass-display text-4xl md:text-6xl mb-5">Your numbers aren&apos;t in yet.</h1>
      <p className="compass-body text-lg mb-10" style={{ color: '#86868b' }}>
        Send one sales report and we&apos;ll show you your first leak in 30 seconds — which store,
        which shift, whose name, and what to do about it.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Drop your first report →</Link>
        <a href="mailto:myke@n86.app?subject=Connect%20my%20store" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#fff' }}>Connect my POS</a>
      </div>
    </section>
  );
}

export default async function OperatorDashboard({ operatorId, displayName }: { operatorId: number; displayName?: string }) {
  if (!opsDbConfigured()) {
    return (
      <main className="compass min-h-screen">
        <Header name="Dashboard" />
        <EmptyState name="Your restaurant" />
      </main>
    );
  }

  let d: CommandCenterData;
  try {
    d = await getCommandCenterData(operatorId, displayName);
  } catch {
    return (
      <main className="compass min-h-screen">
        <Header name="Dashboard" />
        <section className="max-w-2xl mx-auto px-6 pt-20 text-center">
          <h1 className="compass-display text-3xl md:text-5xl mb-4">We couldn&apos;t reach your numbers.</h1>
          <p className="compass-body" style={{ color: '#86868b' }}>Give it a second and refresh — if it keeps happening, email myke@n86.app.</p>
        </section>
      </main>
    );
  }

  return <OperatorDashboardView d={d} />;
}

// Pure render — data in, screen out (no I/O). Kept separate so it can be
// previewed / tested with fixture data.
export function OperatorDashboardView({ d }: { d: CommandCenterData }) {
  const name = d.operatorName ?? 'Your restaurant';
  const hasData = d.networkNet > 0 || d.exceptions.length > 0;

  if (!hasData) {
    return (
      <main className="compass min-h-screen">
        <Header name={name} />
        <EmptyState name={name} />
      </main>
    );
  }

  const cards = buildCoachCards(d.exceptions);
  // The defensible "next moves" number: the measured leaks we can stand behind,
  // not an un-audited recovery-surface projection.
  const nextMoves = cards.reduce((sum, c) => sum + (c.level === 'verified' && c.dollarsYr ? c.dollarsYr : 0), 0);
  const flaggedStores = new Set(d.exceptions.map((e) => e.store));

  return (
    <main className="compass min-h-screen">
      <Header name={name} />

      {/* Hero — the daily hook */}
      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-8">
        <p className="compass-eyebrow-dim mb-3">
          {name} · {d.storesLoaded} of {d.totalStores} store{d.totalStores === 1 ? '' : 's'} · synced {prettyDate(d.lastIngest)}
        </p>
        <h1 className="compass-display text-4xl md:text-6xl">
          {nextMoves > 0 ? <><em style={{ color: '#0066ff' }}>{usd(nextMoves)}</em> in next moves.</> : 'Your reads, ready.'}
        </h1>
        <p className="compass-body text-lg mt-4 max-w-2xl" style={{ color: '#86868b' }}>
          Money we can trace, store by store — each one with the person who owns it and the one thing to do next.
        </p>
      </section>

      {/* KPI strip — clean, four numbers, no filler */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="compass-kpi"><p className="compass-kpi-label">Net sales</p><p className="compass-kpi-val" style={{ overflowWrap: 'anywhere' }}>{usdCompact(d.networkNet)}</p></div>
          <div className="compass-kpi"><p className="compass-kpi-label">Next moves · verified</p><p className="compass-kpi-val" style={{ overflowWrap: 'anywhere' }}>{usdCompact(nextMoves)}</p></div>
          <div className="compass-kpi"><p className="compass-kpi-label">Things to fix</p><p className="compass-kpi-val">{d.exceptions.length}</p></div>
          <div className="compass-kpi"><p className="compass-kpi-label">Stores</p><p className="compass-kpi-val">{d.storesLoaded}<span className="unit">/{d.totalStores}</span></p></div>
        </div>
      </section>

      {/* Do this today */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <p className="compass-eyebrow mb-5">— Do this today</p>
        {cards.length > 0 ? (
          <div className="space-y-3">
            {cards.slice(0, 5).map((c, i) => <DarkCoachCard key={`${c.store}-${c.rule}`} c={c} rank={i + 1} />)}
          </div>
        ) : (
          <div className="compass-card"><p className="text-white font-semibold">Nothing above the line right now.</p><p className="compass-body text-[14px] mt-1" style={{ color: '#86868b' }}>No store is off its benchmark this period. We&apos;ll flag the first that drifts.</p></div>
        )}
      </section>

      {/* Stores */}
      {d.stores.length > 0 ? (
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <p className="compass-eyebrow mb-5">— Your stores</p>
          <div className="compass-card" style={{ padding: 0 }}>
            <table className="w-full text-[14px]">
              <tbody>
                {[...d.stores].sort((a, b) => b.net - a.net).map((s) => {
                  const flagged = flaggedStores.has(s.name);
                  return (
                    <tr key={s.name} style={{ borderTop: '1px solid #1f1f1f' }}>
                      <td className="px-5 py-3.5 text-white font-medium">
                        {s.name}
                        {flagged ? <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,149,0,0.14)', color: '#ff9500' }}>NEEDS A LOOK</span> : null}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums" style={{ color: '#c7c7cc' }}>{usd(s.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
