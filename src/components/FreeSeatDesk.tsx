'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { DeskClose } from '@/lib/deskClose';

const INK = '#141414';
const BLUE = '#2424cf';
const MUTED = '#6b6b66';
const RULE = '#d8d3c5';
const PAPER = '#f7f4ec';

type Mode = 'payroll' | 'prices' | 'process';

type LaborResult = {
  ok: true;
  shifts: number;
  employees: number;
  totalDriftMinutes: number;
  totalDriftDollars: number;
  driftRatio: number;
  perEmployee: Array<{
    store: string;
    name: string;
    earlyClockIns: number;
    lateClockOuts: number;
    totalOtMinutes: number;
    shiftsRun: number;
  }>;
  ghostShifts: Array<{
    store: string;
    name: string;
    clockedMinutes: number;
    shiftStart: string;
  }>;
};

type PriceResult = {
  ok: true;
  prevPeriod: string;
  currPeriod: string;
  totalSkus: number;
  flaggedSkus: number;
  totalDriftDollars: number;
  perSku: Array<{
    vendor: string;
    sku: string;
    prevPrice: number;
    currPrice: number;
    driftPct: number;
    driftDollars: number;
    flagged: boolean;
  }>;
};

type DeskPayload = {
  restaurantName: string | null;
  desk: DeskClose | null;
  closeId: number | null;
};

const MODE_COPY: Record<Mode, { label: string; headline: string; detail: string }> = {
  payroll: {
    label: 'Payroll',
    headline: 'Where scheduled hours became paid drift.',
    detail: 'Upload a time-clock CSV. We compare scheduled start and end against actual punches.',
  },
  prices: {
    label: 'Prices',
    headline: 'Read every SKU without reading every invoice.',
    detail: 'Upload two or more periods of vendor pricing. We flag increases greater than 5%.',
  },
  process: {
    label: 'Process',
    headline: 'Turn yesterday into three moves.',
    detail: 'Paste or upload a complete prior-day close. We return no more than three actions.',
  },
};

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: `1px solid ${BLUE}`, padding: '14px 16px' }}>
      <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: MUTED }}>{label}</p>
      <p className="font-serif" style={{ fontSize: 28, color: INK, marginTop: 6 }}>{value}</p>
      <p className="font-mono uppercase" style={{ fontSize: 9, color: BLUE, marginTop: 8 }}>UNVERIFIED</p>
    </div>
  );
}

export default function FreeSeatDesk({ operatorId }: { operatorId: number }) {
  const [mode, setMode] = useState<Mode>('payroll');
  const [restaurantName, setRestaurantName] = useState('Your restaurant');
  const [processDesk, setProcessDesk] = useState<DeskClose | null>(null);
  const [closeId, setCloseId] = useState<number | null>(null);
  const [labor, setLabor] = useState<LaborResult | null>(null);
  const [prices, setPrices] = useState<PriceResult | null>(null);
  const [processText, setProcessText] = useState('');
  const [processFile, setProcessFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/desk')
      .then((response) => response.json())
      .then((data: DeskPayload & { success?: boolean }) => {
        if (!data.success) return;
        if (data.restaurantName) setRestaurantName(data.restaurantName);
        setProcessDesk(data.desk);
        setCloseId(data.closeId);
      })
      .catch(() => {});
  }, [operatorId]);

  function choose(next: Mode) {
    setMode(next);
    setStatus(null);
  }

  async function runCsv(file: File) {
    const endpoint = mode === 'payroll'
      ? '/api/connect/labor-drift'
      : '/api/connect/vendor-drift';
    setBusy(true);
    setStatus(null);
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch(endpoint, { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not read that CSV.');
      if (mode === 'payroll') setLabor(data as LaborResult);
      else setPrices(data as PriceResult);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read that CSV.');
    } finally {
      setBusy(false);
    }
  }

  async function runSample() {
    if (mode === 'process') {
      setProcessText([
        'Store: Sample Restaurant',
        'Business Date: 2026-08-27',
        'Subtotal: $4,120.00',
        'Labor Summary Total: $980.00',
        'Expected Cash: $640.00',
        'Actual Deposit: $638.00',
        '# Voids: $44.00',
        'Promo: $90.00',
      ].join('\n'));
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const sample = mode === 'payroll'
        ? { url: '/samples/timesheet-labor.csv', name: 'sample-labor.csv' }
        : { url: '/samples/vendor-drift.csv', name: 'sample-vendor-prices.csv' };
      const response = await fetch(sample.url);
      if (!response.ok) throw new Error('Could not load the sample.');
      const file = new File([await response.blob()], sample.name, { type: 'text/csv' });
      await runCsv(file);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load the sample.');
      setBusy(false);
    }
  }

  async function runProcess(event: FormEvent) {
    event.preventDefault();
    if (!processText.trim() && !processFile) {
      setStatus('Paste a close or choose a file first.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const form = new FormData();
      if (processText.trim()) {
        form.set('text', processText);
        form.set('filename', 'close.txt');
      }
      if (processFile) form.set('file', processFile);
      const response = await fetch('/api/intake/close', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not read that close.');
      setProcessDesk(data.desk);
      setCloseId(data.closeId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read that close.');
    } finally {
      setBusy(false);
    }
  }

  async function closeWithProof(actionId: string) {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch('/api/desk/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          outcome: 'acknowledged',
          proofKind: 'other-source',
          proofNote: 'Operator acknowledged this review item.',
          closeId,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not save the receipt.');
      setStatus('Receipt saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save the receipt.');
    } finally {
      setBusy(false);
    }
  }

  const copy = MODE_COPY[mode];

  return (
    <div>
      <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: MUTED }}>
        / {restaurantName} · OPERATOR
      </p>
      <h1 className="font-serif" style={{ fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '12px 0 8px' }}>
        Find the leak. Run the fix.
      </h1>
      <p className="font-serif italic" style={{ fontSize: 20, color: BLUE, marginBottom: 28 }}>
        Payroll. Prices. Process. Pick one and use your own numbers—or run the sample first.
      </p>

      <div className="grid gap-3 md:grid-cols-3" style={{ marginBottom: 28 }}>
        {(Object.keys(MODE_COPY) as Mode[]).map((key) => {
          const item = MODE_COPY[key];
          const selected = key === mode;
          return (
            <button
              type="button"
              key={key}
              onClick={() => choose(key)}
              className="text-left"
              style={{
                border: `1px solid ${selected ? BLUE : RULE}`,
                borderTop: `4px solid ${selected ? BLUE : INK}`,
                padding: 18,
                background: selected ? '#f2f7ff' : '#fffdf7',
              }}
            >
              <p className="font-mono uppercase" style={{ fontSize: 10, color: selected ? BLUE : MUTED, letterSpacing: '0.1em' }}>{item.label}</p>
              <p className="font-serif" style={{ fontSize: 21, color: INK, marginTop: 7 }}>{item.headline}</p>
            </button>
          );
        })}
      </div>

      <section style={{ border: `1px solid ${RULE}`, background: '#fffdf7', padding: 22, marginBottom: 26 }}>
        <p className="font-mono uppercase" style={{ fontSize: 10, color: BLUE, letterSpacing: '0.1em' }}>{copy.label}</p>
        <h2 className="font-serif" style={{ fontSize: 30, color: INK, marginTop: 6 }}>{copy.headline}</h2>
        <p style={{ fontSize: 14, color: MUTED, marginTop: 8 }}>{copy.detail}</p>

        {mode === 'process' ? (
          <form onSubmit={runProcess} className="mt-5 space-y-3">
            <textarea
              value={processText}
              onChange={(event) => setProcessText(event.target.value)}
              placeholder="Paste yesterday’s close…"
              rows={8}
              className="w-full"
              style={{ border: `1px solid ${RULE}`, background: '#fff', padding: 12, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="font-mono uppercase" style={{ fontSize: 11, border: `1px solid ${INK}`, padding: '10px 14px', cursor: 'pointer' }}>
                Choose close file
                <input type="file" className="hidden" accept=".txt,.pdf,.csv" onChange={(event) => setProcessFile(event.target.files?.[0] ?? null)} />
              </label>
              {processFile ? <span style={{ fontSize: 12, color: MUTED }}>{processFile.name}</span> : null}
              <button type="submit" disabled={busy} className="font-mono uppercase" style={{ fontSize: 11, border: `1px solid ${INK}`, background: INK, color: PAPER, padding: '10px 16px' }}>
                {busy ? 'Reading…' : 'Build my three moves →'}
              </button>
              <button type="button" onClick={() => void runSample()} disabled={busy} className="font-mono uppercase" style={{ fontSize: 11, color: BLUE, padding: '10px 4px' }}>Load sample</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <label className="font-mono uppercase" style={{ fontSize: 11, border: `1px solid ${INK}`, background: INK, color: PAPER, padding: '10px 16px', cursor: 'pointer' }}>
              {busy ? 'Reading…' : `Upload ${copy.label} CSV →`}
              <input type="file" className="hidden" accept=".csv,text/csv" disabled={busy} onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void runCsv(file);
              }} />
            </label>
            <button type="button" onClick={() => void runSample()} disabled={busy} className="font-mono uppercase" style={{ fontSize: 11, color: BLUE, padding: '10px 4px' }}>Run sample</button>
          </div>
        )}
      </section>

      {status ? <p style={{ borderLeft: `3px solid ${BLUE}`, paddingLeft: 12, fontSize: 14, color: MUTED, marginBottom: 22 }}>{status}</p> : null}

      {mode === 'payroll' && labor ? (
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Paid drift" value={money(labor.totalDriftDollars)} />
            <Stat label="Drift minutes" value={String(labor.totalDriftMinutes)} />
            <Stat label="Shifts read" value={String(labor.shifts)} />
            <Stat label="Review leads" value={String(labor.ghostShifts.length)} />
          </div>
          <p className="font-mono uppercase mb-3" style={{ fontSize: 10, letterSpacing: '0.1em' }}>Largest schedule-versus-actual leads</p>
          <div className="space-y-3">
            {labor.perEmployee.slice(0, 5).map((row) => (
              <div key={`${row.store}-${row.name}`} style={{ borderLeft: `3px solid ${BLUE}`, background: '#fffdf7', padding: '12px 16px' }}>
                <p className="font-serif" style={{ fontSize: 20 }}>{row.name} · {row.store}</p>
                <p style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{Math.round(row.totalOtMinutes)} drift min · {row.earlyClockIns} early clocks · {row.lateClockOuts} late clocks · {row.shiftsRun} shifts</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 14 }}>Review lead only. This is not proof of time theft or employee misconduct.</p>
        </section>
      ) : null}

      {mode === 'prices' && prices ? (
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="SKUs read" value={String(prices.totalSkus)} />
            <Stat label="Over 5%" value={String(prices.flaggedSkus)} />
            <Stat label="Unit drift" value={money(prices.totalDriftDollars)} />
            <Stat label="Periods" value={`${prices.prevPeriod} → ${prices.currPeriod}`} />
          </div>
          <p className="font-mono uppercase mb-3" style={{ fontSize: 10, letterSpacing: '0.1em' }}>Invoice lines to verify</p>
          <div className="space-y-3">
            {prices.perSku.filter((row) => row.flagged).slice(0, 10).map((row) => (
              <div key={`${row.vendor}-${row.sku}`} style={{ borderLeft: `3px solid ${BLUE}`, background: '#fffdf7', padding: '12px 16px' }}>
                <p className="font-serif" style={{ fontSize: 20 }}>{row.sku} · {row.vendor}</p>
                <p style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{money(row.prevPrice)} → {money(row.currPrice)} · {(row.driftPct * 100).toFixed(1)}% increase</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 14 }}>Confirm pack size, substitutions, credits, and invoice terms before contacting the vendor.</p>
        </section>
      ) : null}

      {mode === 'process' && processDesk?.actionShift ? (
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Sales" value={processDesk.sales.display} />
            <Stat label="Labor" value={processDesk.labor.display} />
            <Stat label="Cash" value={processDesk.cash.display} />
            <Stat label="Voids" value={processDesk.voids.display} />
          </div>
          <p className="font-mono uppercase mb-3" style={{ fontSize: 10, letterSpacing: '0.1em' }}>Today · no more than three moves</p>
          <div className="space-y-3">
            {processDesk.actionShift.morningActions.map((action, index) => (
              <div key={action.instanceKey || `${action.id}-${index}`} style={{ borderLeft: `3px solid ${BLUE}`, background: '#fffdf7', padding: '14px 16px' }}>
                <p className="font-mono uppercase" style={{ fontSize: 10, color: MUTED }}>{String(index + 1).padStart(2, '0')} · {action.owner}</p>
                <p className="font-serif" style={{ fontSize: 22, marginTop: 5 }}>{action.title}</p>
                <p style={{ fontSize: 14, color: '#3d3d38', marginTop: 5 }}>{action.move}</p>
                <p className="font-mono" style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>Receipt: {action.proof.object}</p>
                <button type="button" disabled={busy} onClick={() => void closeWithProof(action.instanceKey || action.id)} className="font-mono uppercase" style={{ fontSize: 10, border: `1px solid ${INK}`, padding: '7px 10px', marginTop: 10 }}>Acknowledge</button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
