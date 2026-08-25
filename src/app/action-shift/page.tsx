'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { buildActionShift, type ActionShiftResult } from '@/lib/actionShift';

type Seat = {
  n: number;
  role: string;
  status: 'free' | 'invite' | 'paid';
  name: string;
};

const SEATS: Seat[] = [
  { n: 1, role: 'Owner', status: 'free', name: 'You' },
  { n: 2, role: 'Manager / GM', status: 'invite', name: 'Invite' },
  { n: 3, role: 'Kitchen or Bar', status: 'invite', name: 'Invite' },
];

export default function ActionShiftDeskPage() {
  const [grossSales, setGrossSales] = useState('13727.18');
  const [laborDollars, setLaborDollars] = useState('');
  const [voids, setVoids] = useState('');
  const [expectedCash, setExpectedCash] = useState('');
  const [enteredDeposit, setEnteredDeposit] = useState('');
  const [businessDate, setBusinessDate] = useState('2026-08-22');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ActionShiftResult | null>(null);

  function onRun(e: FormEvent) {
    e.preventDefault();
    const parsed = buildActionShift({
      store: 'Community Tap & Pizza',
      businessDate: businessDate || undefined,
      grossSales: Number(grossSales),
      laborDollars: laborDollars ? Number(laborDollars) : undefined,
      voids: voids ? Number(voids) : undefined,
      expectedCash: expectedCash ? Number(expectedCash) : undefined,
      enteredDeposit: enteredDeposit ? Number(enteredDeposit) : undefined,
    });
    if (!parsed.ok) {
      setResult(null);
      setError(parsed.error);
      return;
    }
    setError(null);
    setResult(parsed.result);
  }

  return (
    <main className="min-h-screen bg-[#0c1210] text-[#e8ebe6]">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 0%, #1a3a2f 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 10%, #2a2418 0%, transparent 50%)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 pb-24 pt-8">
        <p className="text-xs tracking-[0.2em] uppercase text-[#8fa898]">
          CTAP · Action Shift · proof install
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-[#f3f5f0] md:text-5xl">
          Never 86&apos;d
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#a8b5ac]">
          LLM → DoorDash first win → free seat → 3 seats → full in-store. Same path every
          operator will take. Command Center later.
        </p>

        <nav className="mt-8 flex flex-wrap gap-4 text-sm text-[#c5d0c8]">
          <a href="#desk" className="underline-offset-4 hover:underline">
            Desk
          </a>
          <a href="#drop" className="underline-offset-4 hover:underline">
            Drop close
          </a>
          <a href="#seats" className="underline-offset-4 hover:underline">
            Seats
          </a>
          <Link href="/tools/3p-fee-finder" className="underline-offset-4 hover:underline">
            DoorDash path
          </Link>
          <Link href="/mcp" className="underline-offset-4 hover:underline">
            LLM / MCP
          </Link>
        </nav>

        <section id="seats" className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-sm tracking-wide text-[#8fa898]">Seats · path to 3</h2>
          <ul className="mt-4 space-y-3">
            {SEATS.map((s) => (
              <li
                key={s.n}
                className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-3"
              >
                <div>
                  <span className="text-[#f3f5f0]">
                    {s.n}. {s.role}
                  </span>
                  <span className="ml-2 text-xs text-[#7a8a80]">
                    {s.status === 'free' ? 'Free forever' : 'Invite · paid later'}
                  </span>
                </div>
                <span className="text-sm text-[#a8b5ac]">{s.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="drop" className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-sm tracking-wide text-[#8fa898]">Drop · prior business day</h2>
          <form onSubmit={onRun} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-[#8fa898] sm:col-span-2">
              Business date
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#f3f5f0]"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
              />
            </label>
            <label className="block text-xs text-[#8fa898]">
              Gross sales *
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#f3f5f0]"
                value={grossSales}
                onChange={(e) => setGrossSales(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="block text-xs text-[#8fa898]">
              Labor $
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#f3f5f0]"
                value={laborDollars}
                onChange={(e) => setLaborDollars(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="block text-xs text-[#8fa898]">
              Voids $
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#f3f5f0]"
                value={voids}
                onChange={(e) => setVoids(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="block text-xs text-[#8fa898]">
              Expected cash
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#f3f5f0]"
                value={expectedCash}
                onChange={(e) => setExpectedCash(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="block text-xs text-[#8fa898]">
              Entered deposit
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#f3f5f0]"
                value={enteredDeposit}
                onChange={(e) => setEnteredDeposit(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="mt-2 rounded-md bg-[#c4a35a] px-4 py-2.5 text-sm font-medium text-[#0c1210] hover:bg-[#d4b56a]"
              >
                Run Action Shift
              </button>
              {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
            </div>
          </form>
        </section>

        <section id="desk" className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-sm tracking-wide text-[#8fa898]">Desk · one next move</h2>
          {!result ? (
            <p className="mt-4 text-sm text-[#a8b5ac]">
              Drop yesterday&apos;s numbers above. Engine labels everything Unverified until
              sources land.
            </p>
          ) : (
            <div className="mt-4">
              <p className="font-serif text-2xl text-[#f3f5f0] md:text-3xl">{result.summary}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-[#8fa898]">
                {result.businessDate} · {result.sourceStatus}
              </p>
              <ul className="mt-8 space-y-6">
                {result.morningActions.map((a, i) => (
                  <li key={a.id} className="border-l-2 border-[#c4a35a] pl-4">
                    <p className="text-xs text-[#8fa898]">
                      Action {i + 1} · {a.owner}
                      {a.dollarsObserved != null ? ` · $${a.dollarsObserved.toFixed(2)}` : ''}
                    </p>
                    <p className="mt-1 text-lg text-[#f3f5f0]">{a.title}</p>
                    <p className="mt-1 text-sm text-[#a8b5ac]">{a.move}</p>
                    <p className="mt-2 text-xs text-[#7a8a80]">
                      Proof: {a.evidence} · {a.claimBoundary}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <p className="text-xs uppercase tracking-wide text-[#8fa898]">Night proof</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#a8b5ac]">
                  {result.nightCloseCheck.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              {result.missingEvidence.length > 0 ? (
                <div className="mt-8">
                  <p className="text-xs uppercase tracking-wide text-[#8fa898]">Missing evidence</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#a8b5ac]">
                    {result.missingEvidence.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <p className="mt-16 text-xs leading-relaxed text-[#5f6e64]">
          Path: LLM MCP DoorDash win → free Owner seat → Manager + Station seats → full
          in-store. Wireframe:{' '}
          <code className="text-[#8fa898]">docs/product/LLM_FIRST_ONBOARDING_WIREFRAME.md</code>
        </p>
      </div>
    </main>
  );
}
