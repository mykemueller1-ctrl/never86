'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { EvidenceStatus, SalesLaborDesk, SalesLaborPeriod } from '@/lib/bambaSalesLabor';
import type { SalesLaborSystemMiss } from '@/lib/bambaSalesLabor/types';

const usd = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const pct = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(2)}%`;
};

const PERIOD_LABEL: Record<SalesLaborPeriod, string> = {
  daily: 'Daily',
  wtd: 'WTD',
  ptd: 'PTD',
};

function evidenceClass(status: EvidenceStatus): string {
  if (status === 'verified') return 'border-emerald-400/40 bg-emerald-50 text-emerald-800';
  if (status === 'estimated') return 'border-amber-400/40 bg-amber-50 text-amber-800';
  if (status === 'open') return 'border-sky-400/40 bg-sky-50 text-sky-800';
  return 'border-ink-200 bg-ink-100 text-ink-600';
}

function EvidencePill({ status }: { status: EvidenceStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${evidenceClass(status)}`}>
      {status}
    </span>
  );
}

function Kpi({
  label,
  value,
  evidence,
  sub,
}: {
  label: string;
  value: string;
  evidence: EvidenceStatus;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
        <EvidencePill status={evidence} />
      </div>
      <p className="text-2xl font-bold leading-tight tracking-tighter text-ink-800">{value}</p>
      {sub ? <p className="mt-1 text-xs text-ink-500">{sub}</p> : null}
    </div>
  );
}

function completenessClass(status: SalesLaborDesk['completeness']): string {
  if (status === 'done') return 'border-emerald-300 bg-emerald-50 text-emerald-800';
  if (status === 'incomplete') return 'border-amber-300 bg-amber-50 text-amber-900';
  return 'border-sky-300 bg-sky-50 text-sky-900';
}

export function SalesLaborDesk({ desk }: { desk: SalesLaborDesk }) {
  const [period, setPeriod] = useState<SalesLaborPeriod>('daily');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedMissId, setSelectedMissId] = useState<string | null>(desk.misses[0]?.id ?? null);
  const view = desk.periods[period];
  const system = view.system;
  const selectedMiss = desk.misses.find((miss) => miss.id === selectedMissId) ?? null;
  const selectedPath = desk.drillPaths.find((path) => path.missId === selectedMissId) ?? null;
  const drillIds = useMemo(
    () => ['comps-servers', 'staff-meals', 'training-meals', 'void-ranking', 'daypart', 'ticket-times', 'p-mix'] as const,
    [],
  );
  const regions = view.regions.map((row) => row.region);
  const visibleStores = view.stores.filter((row) => regionFilter === 'all' || row.region === regionFilter);
  const periodOpen = view.status === 'open';

  function openMiss(miss: SalesLaborSystemMiss) {
    setPeriod('daily');
    setRegionFilter(miss.region);
    setSelectedMissId(miss.id);
  }

  function openStoreLine(store: string, kind: SalesLaborSystemMiss['kind']) {
    const match = desk.misses.find((miss) => miss.store === store && miss.kind === kind);
    if (match) {
      openMiss(match);
      return;
    }
    const fallback = desk.misses.find((miss) => miss.store === store);
    if (fallback) openMiss(fallback);
  }

  return (
    <main className="min-h-screen text-ink-800">
      <header className="nav-shell sticky top-0 z-40">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/command-center" className="group flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.55rem' }}>
              N86
            </span>
            <span className="text-[15px] font-semibold tracking-tighter">Never 86&apos;d</span>
            <span className="ml-1 text-[12px] font-medium text-ink-500">· Sales · Labor</span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px] text-ink-600">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${completenessClass(desk.completeness)}`}>
              {desk.completeness}
            </span>
            <Link href="/command-center" className="rounded-full px-3 py-1.5 hover:bg-black/[0.04]">
              Command Center
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-ink-500">
          {desk.tenantLabel} · Lane {desk.lane} · {desk.businessDate} · {desk.memory.provider} · {desk.memory.mcp}
        </p>
        <h1 className="display mb-3 text-4xl md:text-6xl">Sales · Labor desk.</h1>
        <p className="mb-6 max-w-2xl text-ink-600">{desk.isolation}</p>

        <div className="mb-8 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-ink-200 bg-white px-3 py-1 text-ink-600">
            Graphiti group {desk.memory.groupId} · {desk.memory.factCount} facts
          </span>
          <span className="rounded-full border border-ink-200 bg-white px-3 py-1 text-ink-600">
            {desk.swarm.jobCount} jobs × {desk.swarm.storeCount} stores
          </span>
          <span className="rounded-full border border-ink-200 bg-white px-3 py-1 text-ink-600">
            {desk.roster.filter((row) => row.inDailyPull).length} stores in this Daily pull
          </span>
        </div>

        {desk.completeness === 'incomplete' ? (
          <div className="card mb-8 border-amber-300 bg-amber-50 p-5" data-testid="desk-completeness">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Incomplete — not done</p>
            <p className="mt-2 text-sm text-ink-700">
              {desk.swarm.killedJobIds.length} swarm job{desk.swarm.killedJobIds.length === 1 ? '' : 's'} stopped mid-run.
              The desk stays Open/incomplete until every job finishes. Incomplete week stays Open.
            </p>
          </div>
        ) : (
          <div className="sr-only" data-testid="desk-completeness">
            {desk.completeness}
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Sales labor period">
          {desk.periodOrder.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={period === id}
              onClick={() => setPeriod(id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                period === id
                  ? 'border-ink-800 bg-ink-800 text-white'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
              }`}
            >
              {PERIOD_LABEL[id]}
              <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">{desk.periods[id].status}</span>
            </button>
          ))}
        </div>

        <p className="mb-6 text-sm text-ink-600">
          {view.reason} <EvidencePill status={view.status} />
        </p>

        {periodOpen ? (
          <div className="card mb-8 border-sky-300 bg-sky-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">Incomplete week stays Open</p>
            <p className="mt-2 text-sm text-ink-700">
              {PERIOD_LABEL[period]} is not a verified rollup. Only {desk.businessDate} is loaded in Bamba tenant memory.
              Dollars stay blank until the week is complete.
            </p>
          </div>
        ) : null}

        <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="CY sales" value={usd(system.cySales.value)} evidence={system.cySales.evidence} />
          <Kpi label="PY sales" value={usd(system.pySales.value)} evidence={system.pySales.evidence} />
          <Kpi label="FCST sales" value={usd(system.fcstSales.value)} evidence={system.fcstSales.evidence} />
          <Kpi label="Checks" value={system.checks.value == null ? '—' : String(system.checks.value)} evidence={system.checks.evidence} />
          <Kpi label="Catering" value={usd(system.catering.value)} evidence={system.catering.evidence} />
          <Kpi label="Avg check" value={usd(system.avgCheck.value)} evidence={system.avgCheck.evidence} />
          <Kpi label="Comps" value={usd(system.comps.value)} evidence={system.comps.evidence} />
          <Kpi
            label="Voids"
            value={usd(system.voids.value)}
            evidence={system.voids.evidence}
            sub={`${system.voidFlagRule} · peer median ${pct(system.peerMedianVoidRate)}`}
          />
        </section>

        <section className="mb-10 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="display mb-4 text-3xl">System misses</h2>
            <div className="space-y-3">
              {desk.misses.map((miss) => (
                <button
                  key={miss.id}
                  type="button"
                  onClick={() => openMiss(miss)}
                  className={`card w-full p-5 text-left ${selectedMissId === miss.id ? 'border-ink-800' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      {miss.kind} · {miss.store}
                    </p>
                    <EvidencePill status={miss.evidence} />
                  </div>
                  <p className="mt-2 font-semibold text-ink-800">{miss.headline}</p>
                  <p className="mt-2 text-sm text-ink-600">
                    {miss.owner} · due {miss.dueDate}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <h2 className="display mb-4 text-3xl">Drill</h2>
            <div className="card p-5" data-testid="drill-inspector">
              {selectedMiss && selectedPath ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">System → store → line → owner</p>
                  <ol className="mt-4 space-y-2 text-sm">
                    {selectedPath.crumbs.map((crumb) => (
                      <li key={crumb} className="rounded-lg bg-ink-100 px-3 py-2 text-ink-800">
                        {crumb}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 text-sm text-ink-600">
                    {selectedPath.lineLabel}. Owner is a role, not a name. Due {selectedPath.dueDate}.
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-600">Click a system miss, or a void / catering cell, to open the owner and due date.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="display text-3xl">Stores</h2>
            <div className="flex flex-wrap gap-2" aria-label="Region filter">
              <button
                type="button"
                onClick={() => setRegionFilter('all')}
                className={`rounded-full border px-3 py-1 text-xs ${regionFilter === 'all' ? 'border-ink-800 bg-ink-800 text-white' : 'border-ink-200 text-ink-600'}`}
              >
                All regions
              </button>
              {regions.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setRegionFilter(region)}
                  className={`rounded-full border px-3 py-1 text-xs ${regionFilter === region ? 'border-ink-800 bg-ink-800 text-white' : 'border-ink-200 text-ink-600'}`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-ink-500">
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider">Store</th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider">Region</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider">CY</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider">Catering</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider">Avg check</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider">Comps</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider">Staff meals</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider">Voids</th>
                </tr>
              </thead>
              <tbody>
                {visibleStores.map((row) => (
                  <tr key={row.store} className="border-b border-ink-200/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-800">{row.store}</td>
                    <td className="px-4 py-3 text-ink-600">{row.region}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{usd(row.cySales.value)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <button type="button" className="underline decoration-ink-300 underline-offset-2" onClick={() => openStoreLine(row.store, 'catering')}>
                        {usd(row.catering.value)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{usd(row.avgCheck.value)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${row.compFlagged ? 'font-semibold text-amber-700' : ''}`}>
                      {usd(row.comps.value)}
                      {row.compFlagged ? ' · flag' : ''}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{usd(row.staffMeals.value)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${row.voidFlagged ? 'font-semibold text-red-700' : ''}`}>
                      <button type="button" className="underline decoration-ink-300 underline-offset-2" onClick={() => openStoreLine(row.store, 'void')}>
                        {usd(row.voids.value)} {pct(row.voidRate)}
                        {row.voidFlagged ? ' · flag' : ''}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="display mb-4 text-3xl">Regions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {view.regions.map((row) => (
              <button
                key={row.region}
                type="button"
                onClick={() => setRegionFilter(row.region)}
                className={`card p-5 text-left ${regionFilter === row.region ? 'border-ink-800' : ''}`}
              >
                <p className="text-xs uppercase tracking-wider text-ink-500">{row.storeCount} stores</p>
                <h3 className="mt-1 text-xl font-semibold">{row.region}</h3>
                <p className="mt-3 text-sm text-ink-600">CY {usd(row.cySales.value)}</p>
                <p className="text-sm text-ink-600">Voids {usd(row.voids.value)} · {pct(row.voidRate)}</p>
                {row.voidFlagged ? <p className="mt-2 text-xs font-semibold text-red-700">Peer-median void flag on this region</p> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="display mb-4 text-3xl">16-store roster</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {desk.roster.map((row) => (
              <div key={row.store} className="card p-4">
                <p className="text-xs uppercase tracking-wider text-ink-500">{row.region}</p>
                <p className="mt-1 font-semibold">{row.store}</p>
                <p className="mt-2 text-xs text-ink-500">{row.inDailyPull ? 'In Aug 12 Daily pull' : 'Roster only — not in this pull'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="display mb-4 text-3xl">Drivers and prohibitors</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {desk.calendarFlags.map((flag) => (
              <div
                key={`${flag.store}-${flag.cause}`}
                className={`card p-5 ${flag.kind === 'driver' ? 'border-emerald-300' : 'border-red-300'}`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${flag.kind === 'driver' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {flag.kind} · {flag.cause}
                </p>
                <h3 className="mt-2 font-semibold">{flag.store}</h3>
                <p className="mt-2 text-sm text-ink-600">{flag.note}</p>
                <p className="mt-2 text-xs text-ink-500">This year {flag.thisYear ? 'yes' : 'no'} · last year {flag.lastYear ? 'yes' : 'no'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="display mb-4 text-3xl">Swarm jobs</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {desk.swarm.jobs.map((job) => (
              <div key={job.jobId} className={`card p-4 ${job.status === 'killed' ? 'border-amber-300 bg-amber-50' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{job.status}</p>
                <p className="mt-1 font-semibold">{job.jobId}</p>
                <p className="mt-2 text-xs text-ink-600">{job.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="display mb-4 text-3xl">Sheet1 drill-downs</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {drillIds.map((id) => (
              <a key={id} href={`#${id}`} className="rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-600 hover:border-ink-400">
                {id.replaceAll('-', ' ')}
              </a>
            ))}
          </div>

          <div id="comps-servers" className="card mb-4 overflow-hidden p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Comps servers</h3>
            {desk.drillDowns.compsServers.map((row) => (
              <p key={row.station} className="flex justify-between text-sm">
                <span>{row.store} · {row.station}</span>
                <span className="tabular-nums">{usd(row.comps)}</span>
              </p>
            ))}
          </div>
          <div id="staff-meals" className="card mb-4 overflow-hidden p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Staff meals</h3>
            {desk.drillDowns.staffMeals.map((row) => (
              <p key={`${row.store}-${row.station}`} className="flex justify-between text-sm">
                <span>{row.store} · {row.station}</span>
                <span className="tabular-nums">{usd(row.amount)}</span>
              </p>
            ))}
          </div>
          <div id="training-meals" className="card mb-4 overflow-hidden p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Training meals</h3>
            {desk.drillDowns.trainingMeals.map((row) => (
              <p key={`${row.store}-${row.station}`} className="flex justify-between text-sm">
                <span>{row.store} · {row.station}</span>
                <span className="tabular-nums">{usd(row.amount)}</span>
              </p>
            ))}
          </div>
          <div id="void-ranking" className="card mb-4 overflow-hidden p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Void ranking</h3>
            {desk.drillDowns.voidRanking.map((row) => (
              <button
                key={row.store}
                type="button"
                onClick={() => openStoreLine(row.store, 'void')}
                className={`flex w-full justify-between text-left text-sm ${row.flagged ? 'font-semibold text-red-700' : ''}`}
              >
                <span>{row.store}</span>
                <span className="tabular-nums">{usd(row.voids)} · {pct(row.voidRate)}{row.flagged ? ' · flag' : ''}</span>
              </button>
            ))}
          </div>
          <div id="daypart" className="card mb-4 overflow-hidden p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Daypart</h3>
            {desk.drillDowns.daypart.map((row) => (
              <p key={row.daypart} className="flex justify-between text-sm">
                <span className="capitalize">{row.daypart}</span>
                <span className="tabular-nums">{usd(row.cySales)} · avg {usd(row.avgCheck)}</span>
              </p>
            ))}
          </div>
          <div id="ticket-times" className="card mb-4 overflow-hidden p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">Ticket times</h3>
            {desk.drillDowns.ticketTimes.map((row) => (
              <p key={row.daypart} className="flex justify-between text-sm">
                <span className="capitalize">{row.daypart}</span>
                <span className="tabular-nums">{row.medianMinutes.toFixed(1)} min</span>
              </p>
            ))}
          </div>
          <div id="p-mix" className="card overflow-hidden p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider">P-mix</h3>
            {desk.drillDowns.pMix.map((row) => (
              <p key={row.category} className="flex justify-between text-sm">
                <span>{row.category}</span>
                <span className="tabular-nums">{usd(row.cySales)} · {pct(row.mixPct)}</span>
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
