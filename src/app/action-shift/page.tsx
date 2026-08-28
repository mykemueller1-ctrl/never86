'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { buildActionShift, type ActionShiftResult } from '@/lib/actionShift';
import type { DeskClose } from '@/lib/deskClose';

type Seat = {
  n: number;
  role: string;
  status: 'free' | 'invite' | 'paid';
  name: string;
};

// Free plan = one operator seat. Extra seats / role controls are paid later (#118).
const SEATS: Seat[] = [
  { n: 1, role: 'Owner-operator', status: 'free', name: 'You · this store' },
  { n: 2, role: 'Manager / GM', status: 'invite', name: 'One manager login · no staff-wide PINs' },
  { n: 3, role: 'Kitchen / FOH / driver stations', status: 'invite', name: 'Templates owned by the manager seat' },
];

export default function ActionShiftDeskPage() {
  const [grossSales, setGrossSales] = useState('');
  const [laborDollars, setLaborDollars] = useState('');
  const [voids, setVoids] = useState('');
  const [expectedCash, setExpectedCash] = useState('');
  const [enteredDeposit, setEnteredDeposit] = useState('');
  const [businessDate, setBusinessDate] = useState('');
  const [paste, setPaste] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ActionShiftResult | null>(null);
  const [desk, setDesk] = useState<DeskClose | null>(null);

  function onRun(e: FormEvent) {
    e.preventDefault();
    const parsed = buildActionShift({
      store: 'Your store',
      businessDate: businessDate || undefined,
      grossSales: Number(grossSales),
      laborDollars: laborDollars ? Number(laborDollars) : undefined,
      voids: voids ? Number(voids) : undefined,
      expectedCash: expectedCash ? Number(expectedCash) : undefined,
      enteredDeposit: enteredDeposit ? Number(enteredDeposit) : undefined,
      cashEntered: enteredDeposit !== '' && Number(enteredDeposit) > 0,
    });
    if (!parsed.ok) {
      setResult(null);
      setError(parsed.error);
      return;
    }
    setError(null);
    setResult(parsed.result);
  }

  async function onPaste(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/intake/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: paste, filename: 'paste.txt' }),
      });
      const data = await res.json();
      if (!data.success) {
        setDesk(null);
        setResult(null);
        setError(data.error || 'Could not read that close.');
        return;
      }
      setDesk(data.desk);
      setResult(data.desk.actionShift);
      if (data.desk.actionShiftError && !data.desk.actionShift) setError(data.desk.actionShiftError);
    } catch {
      setError('Could not reach parse.');
    }
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
          Yesterday&apos;s numbers → one next action → night proof. One free seat. Extra seats paid later.
        </p>

        <nav className="mt-8 flex flex-wrap gap-4 text-sm text-[#c5d0c8]">
          <a href="#desk" className="underline-offset-4 hover:underline">
            Desk
          </a>
          <a href="#drop" className="underline-offset-4 hover:underline">
            Drop close
          </a>
          <a href="#seats" className="underline-offset-4 hover:underline">
            Free seat
          </a>
          <Link href="/action-shift/manager" className="underline-offset-4 hover:underline">
            Manager seat
          </Link>
          <Link href="/action-shift/setup" className="underline-offset-4 hover:underline">
            Payroll join
          </Link>
          <Link href="/tools/3p-fee-finder" className="underline-offset-4 hover:underline">
            DoorDash path
          </Link>
          <Link href="/mcp" className="underline-offset-4 hover:underline">
            LLM / MCP
          </Link>
          <Link href="/action-shift/lab" className="underline-offset-4 hover:underline">
            CTap lab templates
          </Link>
        </nav>

        <section id="seats" className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-sm tracking-wide text-[#8fa898]">Free seat · one store · one login</h2>
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
                  <span className="ml-2 text-xs text-[#7a8a80]">{s.status === 'free' ? 'Free forever' : 'Paid expansion'}</span>
                </div>
                <span className="text-sm text-[#a8b5ac]">{s.name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#7a8a80]">
            Manager operating UI is visible as a synthetic proof.{' '}
            <Link href="/action-shift/manager" className="text-[#c4a35a] underline-offset-4 hover:underline">
              Open manager seat →
            </Link>
          </p>
        </section>

        <section id="drop" className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-sm tracking-wide text-[#8fa898]">Drop · prior business day · no POS password</h2>
          <form onSubmit={onPaste} className="mt-4">
            <textarea
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#f3f5f0]"
              rows={7}
              placeholder="Paste native-text ZReport_Summary, Hourly_Sales, or Void_Promo. Or type numbers below."
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <button
              type="submit"
              className="mt-3 rounded-md bg-[#c4a35a] px-4 py-2.5 text-sm font-medium text-[#0c1210] hover:bg-[#d4b56a]"
            >
              Read close →
            </button>
          </form>
          <form onSubmit={onRun} className="mt-6 grid gap-3 sm:grid-cols-2">
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
          {desk ? (
            <p className="mt-4 text-sm text-[#a8b5ac]">
              Sales {desk.sales.display} · Food {desk.mix.food.display} · Beer {desk.mix.beer.display} · Liquor {desk.mix.liquor.display} · Pop {desk.mix.pop.display}
              {' · '}Labor {desk.labor.display} · Cash {desk.cash.status === 'unentered' ? 'unentered (not a shortage)' : desk.cash.display}
              {desk.lateDeliveryCount != null ? ` · Late ${desk.lateDeliveryCount}/${desk.lateDeliverySales.display}` : ''}
              {desk.inHouseDeliveryCount != null ? ` · In-house delivery ${desk.inHouseDeliveryCount}/${desk.inHouseDeliverySales.display}` : ''}
              {desk.hourlyPeak ? ` · Peak ${desk.hourlyPeak.hour}` : ''}
            </p>
          ) : null}
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
                      Proof object: {a.proof.object} · {a.claimBoundary}
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
