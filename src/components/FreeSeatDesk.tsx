'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { DeskClose } from '@/lib/deskClose';

const INK = '#141414';
const BLUE = '#2424cf';
const MUTED = '#6b6b66';
const RULE = '#d8d3c5';

type DeskPayload = {
  restaurantName: string | null;
  forwardTo: string;
  desk: DeskClose | null;
  closeId: number | null;
};

function Stamp({ state }: { state: string }) {
  const label = state === 'missing-evidence' ? 'MISSING EVIDENCE' : state.toUpperCase();
  const color = state === 'missing-evidence' ? '#b45309' : BLUE;
  return (
    <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '0.08em', color, border: `1px solid ${color}`, padding: '2px 5px' }}>
      {label}
    </span>
  );
}

function NumberBox({ label, display, state }: { label: string; display: string; state: string }) {
  return (
    <div style={{ border: `1px solid ${BLUE}`, padding: '12px 14px' }}>
      <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: MUTED }}>{label}</p>
      <p className="font-serif" style={{ fontSize: 26, margin: '6px 0 8px', color: INK }}>{display}</p>
      <Stamp state={state} />
    </div>
  );
}

export default function FreeSeatDesk({ operatorId }: { operatorId: number }) {
  const [payload, setPayload] = useState<DeskPayload | null>(null);
  const [desk, setDesk] = useState<DeskClose | null>(null);
  const [closeId, setCloseId] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proofKind, setProofKind] = useState('pos-close');
  const [proofNote, setProofNote] = useState('');

  useEffect(() => {
    fetch('/api/desk')
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        setPayload({ restaurantName: data.restaurantName, forwardTo: data.forwardTo, desk: data.desk, closeId: data.closeId });
        setDesk(data.desk);
        setCloseId(data.closeId);
      })
      .catch(() => {});
  }, [operatorId]);

  async function submitDocs(docs: FormData) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/intake/close', { method: 'POST', body: docs });
      const data = await res.json();
      if (!data.success) {
        setStatus(data.error || 'Could not read that close.');
        return;
      }
      setDesk(data.desk);
      setCloseId(data.closeId);
      setStatus(data.persisted ? 'Close is on the desk.' : 'Parsed. Neon intake table still needs drizzle/0003 to keep it overnight.');
    } catch {
      setStatus('Could not reach intake.');
    } finally {
      setBusy(false);
    }
  }

  function onPaste(e: FormEvent) {
    e.preventDefault();
    const form = new FormData();
    form.set('text', text);
    form.set('filename', 'paste.txt');
    void submitDocs(form);
  }

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    for (const file of Array.from(files)) form.append('file', file);
    void submitDocs(form);
  }

  async function prove(actionId: string, outcome: 'verified' | 'acknowledged' | 'not-done' | 'data-missing') {
    setBusy(true);
    try {
      const res = await fetch('/api/desk/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          outcome,
          proofKind: outcome === 'verified' ? proofKind : 'other-source',
          proofNote,
          closeId,
        }),
      });
      const data = await res.json();
      setStatus(data.success ? `Night proof: ${data.state}` : data.error);
    } catch {
      setStatus('Could not save proof.');
    } finally {
      setBusy(false);
    }
  }

  const mix = desk?.mix;

  return (
    <div>
      <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: MUTED }}>
        / {payload?.restaurantName || 'YOUR RESTAURANT'} — FREE SEAT · ONE STORE · PRIOR BUSINESS DAY
      </p>
      <h1 className="font-serif" style={{ fontSize: 44, letterSpacing: '-0.015em', margin: '10px 0 6px' }}>
        {desk ? `Yesterday, ${desk.businessDate || 'date missing'}.` : 'Drop yesterday’s close.'}
      </h1>
      <p className="font-serif italic" style={{ fontSize: 19, color: BLUE, marginBottom: 18 }}>
        Forward the PDQ email, upload the Z / Void / Hourly files, or paste native text. Vendor invoices, purchase orders, and theoretical-usage files (CSV / native-text PDF) feed the same Action Shift. No POS or vendor-portal password.
      </p>

      <div style={{ border: `1px solid ${RULE}`, background: '#fffdf7', padding: 16, marginBottom: 22 }}>
        <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: MUTED, marginBottom: 8 }}>Forward EOD to</p>
        <p className="font-mono" style={{ fontSize: 14, color: INK }}>{payload?.forwardTo || 'Sign in to see your close address.'}</p>
        <p style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>
          PDQ already mails ZReport_Summary, Void_Promo_Report, and Hourly_Sales_Report. Filename date is the business date.
          Extra stores and seats are paid.
        </p>
      </div>

      <form onSubmit={onPaste} className="space-y-3" style={{ marginBottom: 22 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the native-text Z, Hourly, Void report, vendor invoice, purchase order, or theoretical usage…"
          rows={8}
          className="w-full"
          style={{ border: `1px solid ${RULE}`, background: '#fff', padding: 12, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
        />
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.08em', border: `1px solid ${INK}`, background: INK, color: '#f7f4ec', padding: '10px 16px' }}>
            {busy ? 'Reading…' : 'Read paste →'}
          </button>
          <label className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.08em', border: `1px solid ${INK}`, color: INK, padding: '10px 16px', cursor: 'pointer' }}>
            Upload files
            <input type="file" multiple className="hidden" accept=".txt,.pdf,.csv" onChange={(e) => onFiles(e.target.files)} />
          </label>
        </div>
      </form>
      {status ? <p style={{ fontSize: 13, color: MUTED, marginBottom: 18 }}>{status}</p> : null}

      {desk ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
            <NumberBox label="Sales" display={desk.sales.display} state={desk.sales.state} />
            <NumberBox label="Labor" display={desk.labor.display} state={desk.labor.state} />
            <NumberBox label="Cash" display={desk.cash.status === 'unentered' ? 'Unentered' : desk.cash.display} state={desk.cash.state} />
            <NumberBox label="Voids" display={desk.voids.display} state={desk.voids.state} />
          </div>
          {mix ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 28 }}>
              <NumberBox label="Food" display={mix.food.display} state={mix.food.state} />
              <NumberBox label="Beer" display={mix.beer.display} state={mix.beer.state} />
              <NumberBox label="Liquor" display={mix.liquor.display} state={mix.liquor.state} />
              <NumberBox label="Pop" display={mix.pop.display} state={mix.pop.state} />
            </div>
          ) : null}
          {desk.hourlyPeak ? (
            <p className="font-mono" style={{ fontSize: 12, color: MUTED, marginBottom: 24 }}>
              Peak hour {desk.hourlyPeak.hour} · {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(desk.hourlyPeak.sales)}
              {desk.hourlyPeak.guests != null ? ` · ${desk.hourlyPeak.guests} guests` : ''} · Unverified
            </p>
          ) : null}

          <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: INK, marginBottom: 8 }}>Action Shift · ≤3 moves</p>
          {desk.actionShift ? (
            <ul className="space-y-4" style={{ marginBottom: 28 }}>
              {desk.actionShift.morningActions.map((a, i) => (
                <li key={a.instanceKey || `${a.id}-${i}`} style={{ borderLeft: `3px solid ${BLUE}`, padding: '8px 0 8px 14px' }}>
                  <p className="font-mono uppercase" style={{ fontSize: 10, color: MUTED }}>
                    {String(i + 1).padStart(2, '0')} · {a.owner}
                    {a.dollarsObserved != null ? ` · $${a.dollarsObserved.toFixed(2)}` : ''}
                  </p>
                  <p className="font-serif" style={{ fontSize: 22, color: INK, marginTop: 4 }}>{a.title}</p>
                  <p style={{ fontSize: 14, color: '#3d3d38', marginTop: 4 }}>{a.move}</p>
                  <p className="font-mono" style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>
                    Proof object: {a.proof.object} · {a.claimBoundary}
                  </p>
                  <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
                    <button type="button" disabled={busy} onClick={() => prove(a.instanceKey || a.id, 'acknowledged')} className="font-mono uppercase" style={{ fontSize: 10, border: `1px solid ${RULE}`, padding: '6px 10px' }}>Ack</button>
                    <button type="button" disabled={busy} onClick={() => prove(a.instanceKey || a.id, 'verified')} className="font-mono uppercase" style={{ fontSize: 10, border: `1px solid ${INK}`, background: INK, color: '#f7f4ec', padding: '6px 10px' }}>Close with proof</button>
                    <button type="button" disabled={busy} onClick={() => prove(a.instanceKey || a.id, 'data-missing')} className="font-mono uppercase" style={{ fontSize: 10, border: `1px solid ${RULE}`, padding: '6px 10px' }}>Missing data</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>{desk.actionShiftError || 'Need a Z with net sales, a current + prior vendor invoice, or a PO / invoice / usage packet before Action Shift can rank a move.'}</p>
          )}

          <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 8 }}>Night proof object</p>
          <div className="flex flex-wrap gap-3" style={{ marginBottom: 18 }}>
            <select value={proofKind} onChange={(e) => setProofKind(e.target.value)} style={{ border: `1px solid ${RULE}`, padding: '8px 10px', fontSize: 13 }}>
              <option value="pos-close">POS close</option>
              <option value="deposit-slip">Deposit slip</option>
              <option value="time-clock">Time clock</option>
              <option value="schedule">Schedule</option>
              <option value="ticket-detail">Ticket detail</option>
              <option value="exception-log">Exception log</option>
              <option value="invoice-packet">Invoice packet</option>
              <option value="po-packet">PO / receiving packet</option>
              <option value="photo">Photo</option>
            </select>
            <input
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              placeholder="What the shift created (not a verbal yes)"
              style={{ border: `1px solid ${RULE}`, padding: '8px 10px', fontSize: 13, minWidth: 240 }}
            />
          </div>

          {desk.missingEvidence.length ? (
            <div>
              <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', color: MUTED }}>Missing evidence</p>
              <ul className="list-disc pl-5" style={{ fontSize: 13, color: '#3d3d38', marginTop: 8 }}>
                {desk.missingEvidence.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
