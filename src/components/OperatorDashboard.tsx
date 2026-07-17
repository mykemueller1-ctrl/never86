import Link from 'next/link';
import { getCommandCenterData, type CommandCenterData } from '@/lib/commandCenter';
import { buildCoachCards, type CoachCard } from '@/lib/coachCards';
import { opsDbConfigured } from '@/lib/opsDb';
import SignOutButton from './SignOutButton';

// The operator's home in the COMPASS brief design — the exact language of the
// demo docs (Weekly Brief / coaching cards): cream paper, serif display, mono
// source-stamps, thin blue-ruled KPI boxes, outlined VERIFIED / ESTIMATED
// stamps, black table bands, SRC footnote. A printed intelligence document,
// not an app.

const PAPER = '#f7f4ec';
const INK = '#141414';
const BLUE = '#2424cf';
const AMBER = '#b45309';
const RED = '#c0392b';
const MUTED = '#6b6b66';
const RULE = '#d8d3c5';

const usd = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const briefDate = (iso: string | null) =>
  iso ?? '—';

function Stamp({ level }: { level: 'verified' | 'estimated' }) {
  const c = level === 'verified' ? BLUE : AMBER;
  const label = level === 'verified' ? 'VERIFIED' : 'ESTIMATED - method stated';
  return (
    <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '0.08em', color: c, border: `1px solid ${c}`, padding: '2px 5px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: MUTED }}>{children}</p>
  );
}

function KpiBox({ label, value, level, valueColor }: { label: string; value: string; level: 'verified' | 'estimated'; valueColor?: string }) {
  return (
    <div style={{ border: `1px solid ${BLUE}`, background: 'transparent', padding: '14px 16px 12px' }}>
      <MonoLabel>{label}</MonoLabel>
      <p className="font-serif" style={{ fontSize: 30, lineHeight: 1.15, color: valueColor ?? INK, letterSpacing: '-0.01em', margin: '6px 0 10px' }}>{value}</p>
      <Stamp level={level} />
    </div>
  );
}

function SectionRule({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 flex-wrap" style={{ marginBottom: 6 }}>
      <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: INK }}>{left}</p>
      <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: MUTED }}>{right}</p>
    </div>
  );
}

function BriefCoachCard({ c, rank }: { c: CoachCard; rank: number }) {
  return (
    <div style={{ border: `1px solid ${RULE}`, borderLeft: `3px solid ${BLUE}`, background: '#fffdf7', padding: '16px 18px' }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono" style={{ fontSize: 11, color: MUTED }}>{String(rank).padStart(2, '0')}</span>
          <span className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: INK }}>OWNER: {c.owner}</span>
          <Stamp level={c.level} />
        </div>
        <p className="font-serif" style={{ fontSize: 20, color: INK, letterSpacing: '-0.01em' }}>
          {c.dollarsYr != null ? <>{usd(c.dollarsYr)}<span style={{ fontSize: 13, color: MUTED }}>/yr</span></> : <span style={{ color: MUTED, fontSize: 15 }}>opportunity</span>}
        </p>
      </div>
      <h3 className="font-serif" style={{ fontSize: 22, color: INK, letterSpacing: '-0.01em', marginTop: 8 }}>{c.title}</h3>
      <p style={{ fontSize: 13.5, color: '#3d3d38', lineHeight: 1.55, marginTop: 4 }}>{c.why}</p>
      <div className="flex items-start gap-3" style={{ marginTop: 10, borderTop: `1px solid ${RULE}`, paddingTop: 10 }}>
        <span className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: BLUE, whiteSpace: 'nowrap', marginTop: 2 }}>DO THIS →</span>
        <p style={{ fontSize: 13.5, color: INK, lineHeight: 1.55, fontWeight: 500 }}>{c.action}</p>
      </div>
    </div>
  );
}

function Shell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen" style={{ background: PAPER, color: INK }}>
      <header style={{ borderBottom: `1px solid ${INK}` }}>
        <div className="max-w-5xl mx-auto px-6 h-11 flex items-center justify-between gap-4">
          <Link href="/" className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.12em', color: INK }}>
            / NEVER 86&apos;D — COMMAND CENTER — {name}
          </Link>
          <SignOutButton />
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-16">{children}</div>
    </main>
  );
}

function EmptyState({ name }: { name: string }) {
  return (
    <div className="max-w-xl mx-auto pt-10">
      <MonoLabel>/ {name} — NO DATA ON FILE YET</MonoLabel>
      <h1 className="font-serif" style={{ fontSize: 44, letterSpacing: '-0.015em', margin: '10px 0 6px' }}>Your numbers aren&apos;t in yet.</h1>
      <p className="font-serif italic" style={{ fontSize: 19, color: BLUE, marginBottom: 18 }}>Send one report - we&apos;ll show you the first leak, with receipts.</p>
      <p style={{ fontSize: 14, color: '#3d3d38', lineHeight: 1.6, marginBottom: 22 }}>
        Which store, which shift, whose name, and what to do about it — in 30 seconds.
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link href="/trial" className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.08em', border: `1px solid ${INK}`, background: INK, color: PAPER, padding: '10px 16px' }}>Drop your first report →</Link>
        <a href="mailto:myke@n86.app?subject=Connect%20my%20store" className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.08em', border: `1px solid ${INK}`, color: INK, padding: '10px 16px' }}>Connect my POS</a>
      </div>
    </div>
  );
}

export default async function OperatorDashboard({ operatorId, displayName }: { operatorId: number; displayName?: string }) {
  if (!opsDbConfigured()) {
    return <Shell name="DASHBOARD"><EmptyState name="YOUR RESTAURANT" /></Shell>;
  }
  let d: CommandCenterData;
  try {
    d = await getCommandCenterData(operatorId, displayName);
  } catch {
    return (
      <Shell name="DASHBOARD">
        <div style={{ border: `1px solid ${RULE}`, background: '#fffdf7', padding: 24, maxWidth: 560 }}>
          <p className="font-serif" style={{ fontSize: 22 }}>We couldn&apos;t reach your numbers.</p>
          <p style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>Give it a second and refresh — if it keeps happening, email myke@n86.app.</p>
        </div>
      </Shell>
    );
  }
  return <OperatorDashboardView d={d} />;
}

// Pure render — data in, brief out. Separated for fixture preview + testing.
export function OperatorDashboardView({ d }: { d: CommandCenterData }) {
  const name = (d.operatorName ?? 'Your restaurant').toUpperCase();
  const hasData = d.networkNet > 0 || d.exceptions.length > 0;
  if (!hasData) return <Shell name={name}><EmptyState name={name} /></Shell>;

  const cards = buildCoachCards(d.exceptions);
  const nextMoves = cards.reduce((s, c) => s + (c.level === 'verified' && c.dollarsYr ? c.dollarsYr : 0), 0);
  const flagged = new Set(d.exceptions.map((e) => e.store));
  const stores = [...d.stores].sort((a, b) => b.net - a.net);

  return (
    <Shell name={name}>
      {/* Brief opening */}
      <MonoLabel>
        / DAILY BRIEF — {name} — SYNCED {briefDate(d.lastIngest)} — EVERY NUMBER SOURCE-STAMPED
      </MonoLabel>
      <h1 className="font-serif" style={{ fontSize: 56, lineHeight: 1.02, letterSpacing: '-0.02em', margin: '14px 0 6px' }}>
        The week, verified.
      </h1>
      <p className="font-serif italic" style={{ fontSize: 22, color: BLUE, marginBottom: 26 }}>
        Sales, voids, discounts, catering - with receipts.
      </p>

      {/* KPI boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        <KpiBox label={`NET SALES — ${d.storesLoaded} STORE${d.storesLoaded === 1 ? '' : 'S'}`} value={usd(d.networkNet)} level="verified" />
        <KpiBox label="NEXT MOVES — MEASURED" value={usd(nextMoves)} level="verified" valueColor={BLUE} />
        <KpiBox label="THINGS TO FIX" value={String(d.exceptions.length)} level="verified" />
        <KpiBox label="STORES REPORTING" value={`${d.storesLoaded}/${d.totalStores}`} level="verified" />
      </div>
      <p className="font-mono" style={{ fontSize: 9.5, color: MUTED, lineHeight: 1.6, marginBottom: 40 }}>
        Where a number is modeled, the method is stated next to it. Nothing rounded up.
      </p>

      {/* 01 — Do this today */}
      <SectionRule left={`01 — DO THIS TODAY — ${Math.min(cards.length, 5)} MOVES`} right={`COMPASS — ${d.totalStores}-UNIT — NEVER 86'D`} />
      <h2 className="font-serif" style={{ fontSize: 30, letterSpacing: '-0.015em', borderBottom: `2px solid ${INK}`, paddingBottom: 8, marginBottom: 14 }}>
        Your next moves, ranked.
      </h2>
      <div className="space-y-3" style={{ marginBottom: 8 }}>
        {cards.slice(0, 5).map((c, i) => <BriefCoachCard key={`${c.store}-${c.rule}`} c={c} rank={i + 1} />)}
      </div>
      {cards.length > 5 ? (
        <p className="font-mono" style={{ fontSize: 10, color: MUTED, marginBottom: 40 }}>+ {cards.length - 5} MORE ON FILE</p>
      ) : <div style={{ marginBottom: 40 }} />}

      {/* 02 — Stores */}
      <SectionRule left="02 — STORES BY NET SALES" right="ACTUAL — THIS PERIOD" />
      <h2 className="font-serif" style={{ fontSize: 30, letterSpacing: '-0.015em', borderBottom: `2px solid ${INK}`, paddingBottom: 8, marginBottom: 0 }}>
        Store by store.
      </h2>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: INK }}>
            <th className="font-mono uppercase text-left" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: PAPER, padding: '7px 10px' }}>Restaurant</th>
            <th className="font-mono uppercase text-right" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: PAPER, padding: '7px 10px' }}>Net sales</th>
            <th className="font-mono uppercase text-right" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: PAPER, padding: '7px 10px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((s) => (
            <tr key={s.name} style={{ borderBottom: `1px solid ${RULE}` }}>
              <td className="font-serif" style={{ fontSize: 15, padding: '8px 10px', color: INK }}>{s.name}</td>
              <td className="font-mono text-right tabular-nums" style={{ fontSize: 12.5, padding: '8px 10px', color: INK }}>{usd(s.net)}</td>
              <td className="text-right" style={{ padding: '8px 10px' }}>
                {flagged.has(s.name)
                  ? <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '0.08em', color: RED, border: `1px solid ${RED}`, padding: '2px 5px' }}>NEEDS A LOOK</span>
                  : <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '0.08em', color: MUTED }}>INSIDE</span>}
              </td>
            </tr>
          ))}
          <tr style={{ background: INK }}>
            <td className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: PAPER, padding: '8px 10px' }}>GROUP</td>
            <td className="font-mono text-right tabular-nums" style={{ fontSize: 12.5, color: PAPER, padding: '8px 10px' }}>{usd(d.networkNet)}</td>
            <td />
          </tr>
        </tbody>
      </table>

      {/* SRC footnote */}
      <p className="font-mono" style={{ fontSize: 9, color: MUTED, lineHeight: 1.7, marginTop: 34, borderTop: `1px solid ${RULE}`, paddingTop: 10 }}>
        SRC — POS pulls, cross-checked to the penny — every figure traceable to a stored document — leaks measured against your own stores&apos; median, not an industry benchmark — nothing rounded up.
      </p>
    </Shell>
  );
}
