import Link from 'next/link';
import type { PrimeCostBoard, PrimeCostDesk } from '@/lib/primeCostDesks';

const usd = (value: number | null) => {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

function formatKpi(desk: PrimeCostDesk): string {
  const kpi = desk.kpis[0];
  if (!kpi || kpi.value == null) return '—';
  if (kpi.format === 'usd') return usd(kpi.value);
  if (kpi.format === 'pct') return `${(kpi.value * 100).toFixed(1)}%`;
  return String(kpi.value);
}

export function PrimeCostDeskHub({ board }: { board: PrimeCostBoard }) {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/command-center" className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>
              N86
            </span>
            <span className="text-[15px] font-semibold tracking-tighter">Never 86&apos;d</span>
            <span className="ml-1 text-[12px] font-medium text-ink-500">· Prime cost</span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px] text-ink-600">
            <Link href="/command-center" className="rounded-full px-3 py-1.5 hover:bg-black/[0.04]">
              Command Center
            </Link>
            <Link href="/command-center/sales-labor" className="rounded-full px-3 py-1.5 hover:bg-black/[0.04]">
              Sales · Labor
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-ink-500">
          {board.tenantLabel} · Lane {board.lane} · {board.businessDate}
        </p>
        <h1 className="display mb-3 text-4xl md:text-6xl">Prime cost desks.</h1>
        <p className="mb-4 max-w-2xl text-ink-600">{board.isolation}</p>
        <p className="mb-10 max-w-2xl text-sm text-ink-600">{board.primeCostPct.note}</p>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {board.desks.map((desk) => (
            <Link key={desk.category} href={desk.href} className="card block p-5 hover:border-ink-400">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                {desk.completeness} · {desk.kpis[0]?.evidence}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{desk.title}</h2>
              <p className="mt-3 text-2xl font-bold tabular-nums">{formatKpi(desk)}</p>
              <p className="mt-2 text-sm text-ink-600">{desk.gate}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
