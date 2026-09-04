import Link from 'next/link';
import type { PrimeCostBoard, PrimeCostDesk } from '@/lib/primeCostDesks';
import { PRIME_COST_HUB_PATH } from '@/lib/primeCostDesks';

export function PrimeCostCategoryDesk({ board, desk }: { board: PrimeCostBoard; desk: PrimeCostDesk }) {
  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-6">
          <Link href={PRIME_COST_HUB_PATH} className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>
              N86
            </span>
            <span className="text-[15px] font-semibold tracking-tighter">Never 86&apos;d</span>
            <span className="ml-1 text-[12px] font-medium text-ink-500">· {desk.title}</span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px] text-ink-600">
            <Link href={PRIME_COST_HUB_PATH} className="rounded-full px-3 py-1.5 hover:bg-black/[0.04]">
              All desks
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-ink-500">
          {board.tenantLabel} · {desk.category} · {desk.businessDate} · {desk.completeness}
        </p>
        <h1 className="display mb-3 text-4xl md:text-6xl">{desk.title} desk.</h1>
        <p className="mb-8 max-w-2xl text-ink-600">{desk.gate}</p>

        <section className="mb-10 grid gap-4 md:grid-cols-2">
          {desk.kpis.map((kpi) => (
            <div key={kpi.id} className="card p-5">
              <p className="text-xs uppercase tracking-wide text-ink-500">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold">{kpi.value == null ? '—' : kpi.value}</p>
              <p className="mt-2 text-sm text-ink-600">{kpi.note}</p>
            </div>
          ))}
        </section>

        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Still needed in Bamba memory</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-700">
            {desk.needs.map((need) => (
              <li key={need}>{need.replaceAll('-', ' ')}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
