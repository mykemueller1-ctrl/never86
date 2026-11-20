'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ActionShiftDoor } from '@/components/ActionShiftDoor';
import { buildActionShift, type ActionShiftResult } from '@/lib/actionShift';
import type { DeskClose } from '@/lib/deskClose';

type Seat = {
  n: number;
  role: string;
  status: 'free' | 'invite' | 'paid';
  name: string;
};

// Free plan = one owner seat, one restaurant, one login.
// Seats 2–3 are paid expansion. Multi-unit Command Center is a separate build.
const SEATS: Seat[] = [
  { n: 1, role: 'Owner-operator', status: 'free', name: 'Your restaurant · one store · free' },
  { n: 2, role: 'Manager / GM', status: 'invite', name: 'Paid seat · one manager login' },
  { n: 3, role: 'Kitchen / FOH / driver stations', status: 'invite', name: 'Paid seat · templates under manager' },
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
    <ActionShiftDoor>
      <section id="drop" className="as-tool-wrap as-wrap">
        <div className="as-panel">
          <p className="as-kicker">YESTERDAY’S CLOSE</p>
          <h2>Drop the numbers you already have.</h2>
          <p className="as-fine">
            One restaurant and one login on the free seat. A second location stays closed until it is paid. No POS password.
          </p>
          <form onSubmit={onPaste} className="as-stack" style={{ marginTop: 18 }}>
            <label className="as-label" htmlFor="action-shift-paste">Paste a close</label>
            <textarea
              id="action-shift-paste"
              className="as-field"
              rows={7}
              placeholder="Paste native-text ZReport_Summary, Hourly_Sales, or Void_Promo. Or type numbers below."
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <button type="submit" className="as-button">Read close</button>
          </form>
          <form onSubmit={onRun} className="as-stack" style={{ marginTop: 22 }}>
            <label className="as-label">
              Business date
              <input className="as-field" style={{ marginTop: 6 }} value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} />
            </label>
            <label className="as-label">
              Gross sales
              <input className="as-field" style={{ marginTop: 6 }} value={grossSales} onChange={(e) => setGrossSales(e.target.value)} inputMode="decimal" />
            </label>
            <label className="as-label">
              Labor $
              <input className="as-field" style={{ marginTop: 6 }} value={laborDollars} onChange={(e) => setLaborDollars(e.target.value)} inputMode="decimal" />
            </label>
            <label className="as-label">
              Voids $
              <input className="as-field" style={{ marginTop: 6 }} value={voids} onChange={(e) => setVoids(e.target.value)} inputMode="decimal" />
            </label>
            <label className="as-label">
              Expected cash
              <input className="as-field" style={{ marginTop: 6 }} value={expectedCash} onChange={(e) => setExpectedCash(e.target.value)} inputMode="decimal" />
            </label>
            <label className="as-label">
              Entered deposit
              <input className="as-field" style={{ marginTop: 6 }} value={enteredDeposit} onChange={(e) => setEnteredDeposit(e.target.value)} inputMode="decimal" />
            </label>
            <button type="submit" className="as-button">Run Action Shift</button>
            {error ? <p className="as-error">{error}</p> : null}
          </form>

          <section id="desk" style={{ marginTop: 28 }}>
            <p className="as-kicker">ONE NEXT MOVE</p>
            {desk ? (
              <p>
                Sales {desk.sales.display} · Food {desk.mix.food.display} · Beer {desk.mix.beer.display} · Liquor {desk.mix.liquor.display} · Pop {desk.mix.pop.display}
                {' · '}Labor {desk.labor.display} · Cash {desk.cash.status === 'unentered' ? 'unentered (not a shortage)' : desk.cash.display}
                {desk.hourlyPeak ? ` · Peak ${desk.hourlyPeak.hour}` : ''}
              </p>
            ) : null}
            {!result ? (
              <p className="as-fine">Drop yesterday’s numbers above. The reading stays Unverified until sources land.</p>
            ) : (
              <div>
                <p style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.04em', margin: '8px 0' }}>{result.summary}</p>
                <p className="as-fine">{result.businessDate} · {result.sourceStatus}</p>
                <ul className="as-seat-list">
                  {result.morningActions.map((a, i) => (
                    <li key={a.id} style={{ display: 'block' }}>
                      <p className="as-fine">
                        Action {i + 1} · {a.owner}
                        {a.dollarsObserved != null ? ` · $${a.dollarsObserved.toFixed(2)}` : ''}
                      </p>
                      <p style={{ margin: '4px 0', fontWeight: 600 }}>{a.title}</p>
                      <p className="as-fine">{a.move}</p>
                      <p className="as-fine">Proof object: {a.proof.object} · {a.claimBoundary}</p>
                    </li>
                  ))}
                </ul>
                <p className="as-kicker" style={{ marginTop: 18 }}>NIGHT PROOF</p>
                <ul>
                  {result.nightCloseCheck.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {result.missingEvidence.length > 0 ? (
                  <>
                    <p className="as-kicker">MISSING EVIDENCE</p>
                    <ul>
                      {result.missingEvidence.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            )}
          </section>

          <section id="seats" style={{ marginTop: 28 }}>
            <p className="as-kicker">THE FREE SEAT</p>
            <ul className="as-seat-list">
              {SEATS.map((s) => (
                <li key={s.n}>
                  <span>
                    {s.n}. {s.role}
                    <span className="as-fine"> · {s.status === 'free' ? 'Free' : 'Paid expansion'}</span>
                  </span>
                  <span>{s.name}</span>
                </li>
              ))}
            </ul>
            <p className="as-fine" style={{ marginTop: 12 }}>
              Open play is a sample shop. Private store numbers stay off this page.
            </p>
            <div className="as-link-row">
              <Link href="/play">Start playing</Link>
              <Link href="/onboard">Claim owner seat</Link>
              <Link href="/action-shift/manager">Manager seat</Link>
              <Link href="/action-shift/lab">Lab templates</Link>
            </div>
          </section>
        </div>
      </section>
    </ActionShiftDoor>
  );
}
