'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type VoidResult = {
  ok: true;
  rowsParsed: number;
  networkNet: number;
  networkVoids: number;
  networkVoidRate: number;
  medianStoreVoidRate: number;
  storesFlagged: number;
  stores: Array<{ name: string; net: number; voids: number; voidRate: number; excessYr: number; flagged: boolean }>;
  employees: Array<{ store: string; name: string; net: number; voidAmount: number; voidRate: number; flagged: boolean }>;
};

type EmployeeFlag = { store: string; name: string; count: number; dollars: number; rate: number; peerRate: number };
type EmployeeRow = {
  store: string; name: string;
  ticketsRung: number; netSales: number;
  voidsDollars: number; voidsCount: number; cashVoidsCount: number;
  compsDollars: number; compsCount: number;
  discountsDollars: number; discountsCount: number;
  voidAfterPaymentCount: number; promoStackedCount: number; discountAfterCloseCount: number;
  riskScore: number;
};

type LeakResult = {
  ok: true;
  rowsParsed: number;
  ticketsAnalyzed: number;
  stores: string[];
  networkNet: number; networkVoids: number; networkComps: number; networkDiscounts: number;
  signals: {
    voidAfterPayment:    { totalCount: number; totalDollars: number; flagged: EmployeeFlag[] };
    cashOnlyVoiders:     EmployeeFlag[];
    promoStacking:       { totalCount: number; totalDollars: number; flagged: EmployeeFlag[] };
    compAbuse:           EmployeeFlag[];
    discountAfterClose:  { totalCount: number; totalDollars: number; flagged: EmployeeFlag[] };
  };
  employees: EmployeeRow[];
};

type Err = { ok: false; error: string; hint?: string; detectedColumns?: string[] };

const MODES = [
  { id: 'void', label: 'Void Hunter',    blurb: 'Employee performance CSV · voids vs peer band' },
  { id: 'leak', label: 'Leak Detector',  blurb: 'Ticket-level CSV · comps, promos, post-pay voids, cash-only voiders' },
] as const;
type Mode = typeof MODES[number]['id'];

const POS_OPTIONS = [
  { v: 'Toast',      tag: 'Now',     status: 'csv',  note: 'Drop Toast Employee Performance or Sales Detail CSV today.' },
  { v: 'Lightspeed', tag: 'Soon',    status: 'soon', note: 'Lightspeed dev-account OAuth in build.' },
  { v: 'Aloha',      tag: 'Soon',    status: 'soon', note: 'NCR/Aloha integration in motion. Enterprise partner cycle.' },
  { v: 'Square',     tag: 'CSV',     status: 'csv',  note: 'Drop your Square employee summary CSV.' },
  { v: 'Clover',     tag: 'CSV',     status: 'csv',  note: 'Drop your Clover Reports export.' },
  { v: 'Other',      tag: 'Tell us', status: 'soon', note: "Tell us your POS — we'll prioritize the ones operators ask for." },
];

const usd = (n: number) => '$' + Math.round(n).toLocaleString();
const pct = (n: number) => (n * 100).toFixed(2) + '%';

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TrialPage() {
  const [phase, setPhase] = useState<'start' | 'active' | 'ended'>('start');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [starting, setStarting] = useState(false);

  const [mode, setMode] = useState<Mode>('void');
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [voidResult, setVoidResult] = useState<VoidResult | null>(null);
  const [leakResult, setLeakResult] = useState<LeakResult | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [errHint, setErrHint] = useState('');
  const [detectedCols, setDetectedCols] = useState<string[]>([]);
  const [filename, setFilename] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [name, setName] = useState('');
  const [leadSaved, setLeadSaved] = useState(false);

  const [waitlistPos, setWaitlistPos] = useState<string | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (phase !== 'active' || !expiresAt) return;
    const id = setInterval(() => {
      const ms = expiresAt - Date.now();
      setRemaining(ms);
      if (ms <= 0) {
        setPhase('ended');
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [phase, expiresAt]);

  async function startTrial() {
    setStarting(true);
    try {
      const res = await fetch('/api/trial/start', { method: 'POST' });
      const data = await res.json();
      if (data.ok && data.expiresAt) {
        setExpiresAt(new Date(data.expiresAt).getTime());
        setRemaining(new Date(data.expiresAt).getTime() - Date.now());
        setPhase('active');
      } else {
        setErrMsg(data.error || 'Could not start trial.');
      }
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : 'Could not start trial.');
    } finally {
      setStarting(false);
    }
  }

  async function runFile(file: File) {
    setFilename(file.name);
    setStatus('running');
    setErrMsg(''); setErrHint(''); setDetectedCols([]);
    setVoidResult(null); setLeakResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const endpoint = mode === 'void' ? '/api/connect/void-hunter' : '/api/connect/leak-detector';
      const res = await fetch(endpoint, { method: 'POST', body: form });
      const data = await res.json();
      if (data.ok) {
        if (mode === 'void') setVoidResult(data as VoidResult);
        else setLeakResult(data as LeakResult);
        setStatus('done');
      } else {
        const err = data as Err;
        setErrMsg(err.error || 'Failed to parse');
        setErrHint(err.hint || '');
        setDetectedCols(err.detectedColumns || []);
        setStatus('error');
      }
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : 'Something went wrong');
      setStatus('error');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (phase !== 'active') return;
    const file = e.dataTransfer.files?.[0];
    if (file) runFile(file);
  }

  async function saveLead(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, name, restaurantName,
          agentRequested: mode === 'void' ? 'Void Hunter · trial' : 'Leak Detector · trial',
          sourcePage: '/trial',
        }),
      });
      setLeadSaved(true);
    } catch {}
  }

  async function joinWaitlist(pos: string) {
    if (!email) { setWaitlistPos(pos); return; }
    setWaitlistStatus('sending');
    try {
      await fetch('/api/integration-waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, restaurantName, pos, sourcePage: '/trial' }),
      });
      setWaitlistStatus('sent'); setWaitlistPos(pos);
    } catch { setWaitlistStatus('error'); }
  }

  const networkLeakYr = voidResult
    ? Math.max(0, voidResult.networkVoids - voidResult.medianStoreVoidRate * voidResult.networkNet) * 3
    : 0;

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· live trial</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · 60 minutes · real reads on your locations</p>
            </span>
          </Link>
          {phase === 'active' && (
            <div className="text-right">
              <p className="compass-eyebrow-dim">— Time remaining</p>
              <p className="font-mono tabular-nums text-3xl mt-1" style={{ color: remaining < 5 * 60 * 1000 ? '#ff9500' : '#ffffff' }}>
                {formatRemaining(remaining)}
              </p>
            </div>
          )}
        </div>
      </div>

      {phase === 'start' && (
        <section className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-16 text-center">
          <p className="compass-eyebrow mb-6">— Free trial · 60 minutes</p>
          <h1 className="compass-display text-5xl md:text-7xl mb-6">
            One hour. <em>Your real numbers.</em>
          </h1>
          <p className="compass-body text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Two agents wired. Drop a CSV, see what&apos;s actually happening on your floor. No card. No human in the loop.
          </p>
          <button onClick={startTrial} disabled={starting} className="btn-primary text-base disabled:opacity-50" style={{ background: '#0066ff' }}>
            {starting ? 'Starting…' : 'Start the hour →'}
          </button>
          {errMsg && <p className="text-[#ff453a] text-sm mt-4">{errMsg}</p>}
          <p className="compass-eyebrow-dim mt-6">— Supported now: Toast · Square · Clover · PDQ (CSV) · OAuth for Toast/Lightspeed/Aloha in build</p>
        </section>
      )}

      {phase === 'active' && (
        <>
          <section className="max-w-4xl mx-auto px-6 pt-8 pb-4">
            <p className="compass-eyebrow mb-4">— Pick an agent</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {MODES.map((m) => (
                <button key={m.id} type="button" onClick={() => { setMode(m.id); setStatus('idle'); setVoidResult(null); setLeakResult(null); }}
                  className="compass-card text-left transition-colors"
                  style={mode === m.id ? { borderColor: '#0066ff' } : {}}>
                  <p className="compass-card-label" style={mode === m.id ? { color: '#0066ff' } : {}}>{mode === m.id ? 'Selected' : 'Agent'}</p>
                  <h3>{m.label}</h3>
                  <p className="compass-body text-sm mt-2">{m.blurb}</p>
                </button>
              ))}
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="compass-card cursor-pointer text-center transition-all"
              style={{
                padding: '60px 20px',
                borderStyle: 'dashed',
                borderColor: dragging ? '#0066ff' : '#2c2c2e',
                background: dragging ? 'rgba(0,102,255,0.04)' : '#0a0a0a',
              }}
            >
              <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) runFile(f); }} className="hidden" />
              {status === 'running' ? (
                <>
                  <p className="compass-eyebrow mb-3">— Running {mode === 'void' ? 'Void Hunter' : 'Leak Detector'}</p>
                  <p className="font-serif text-2xl text-white">Analyzing <em>{filename}</em>…</p>
                </>
              ) : (
                <>
                  <p className="compass-eyebrow mb-3">— Drop a CSV for {mode === 'void' ? 'Void Hunter' : 'Leak Detector'}</p>
                  <p className="font-serif text-3xl text-white mb-2">Click to choose · or drag a file</p>
                  <p className="compass-body text-sm">
                    {mode === 'void'
                      ? 'Per-employee CSV · Location, Employee, Net Sales, Void Amount'
                      : 'Per-ticket CSV · Location, Employee, Ticket Total, Tender, Void/Comp/Discount columns'}
                  </p>
                </>
              )}
            </div>

            {status === 'error' && (
              <div className="compass-card mt-4" style={{ borderColor: '#ff453a' }}>
                <p className="compass-card-label" style={{ color: '#ff453a' }}>— Couldn&apos;t parse</p>
                <p className="font-serif text-xl text-white mt-3">{errMsg}</p>
                {errHint && <p className="compass-body text-sm mt-3">{errHint}</p>}
                {detectedCols.length > 0 && (
                  <p className="compass-body text-sm mt-3">
                    <span className="text-[#6e6e73]">Columns we saw:</span>{' '}
                    <span className="font-mono text-white">{detectedCols.join(' · ')}</span>
                  </p>
                )}
              </div>
            )}
          </section>

          {status === 'done' && voidResult && mode === 'void' && (
            <section className="border-t border-[#1f1f1f] py-16 px-6">
              <div className="max-w-5xl mx-auto">
                <p className="compass-eyebrow mb-4">— Void Hunter · {filename}</p>
                <h2 className="compass-display text-3xl md:text-5xl mb-10">
                  {voidResult.storesFlagged > 0
                    ? <>Found <em>{voidResult.storesFlagged} store{voidResult.storesFlagged === 1 ? '' : 's'}</em> above the peer band.</>
                    : <>No stores <em>above the peer band.</em></>}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="compass-kpi"><p className="compass-kpi-label">Network net</p><p className="compass-kpi-val">{usd(voidResult.networkNet)}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Network voids</p><p className="compass-kpi-val">{usd(voidResult.networkVoids)}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Network void rate</p><p className="compass-kpi-val">{pct(voidResult.networkVoidRate)}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Peer-median rate</p><p className="compass-kpi-val">{pct(voidResult.medianStoreVoidRate)}</p></div>
                </div>
                {networkLeakYr > 0 && (
                  <div className="compass-card mb-10" style={{ borderColor: '#0066ff' }}>
                    <p className="compass-card-label" style={{ color: '#0066ff' }}>— The lever</p>
                    <h3>Excess voids above the peer band, annualized: <em style={{ color: '#0066ff' }}>{usd(networkLeakYr)}</em></h3>
                  </div>
                )}
                {voidResult.stores.length > 0 && (
                  <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                    <table className="data-table w-full">
                      <thead><tr><th className="!text-left">Store</th><th>Net</th><th>Voids</th><th>Rate</th><th>Excess / yr</th></tr></thead>
                      <tbody>
                        {voidResult.stores.map((s) => (
                          <tr key={s.name} style={{ color: '#d2d2d7' }}>
                            <td className="!text-left text-white font-medium">{s.name}{s.flagged ? <span className="badge badge-unverified ml-2">Above band</span> : null}</td>
                            <td className="font-mono tabular-nums">{usd(s.net)}</td>
                            <td className="font-mono tabular-nums">{usd(s.voids)}</td>
                            <td className="font-mono tabular-nums">{pct(s.voidRate)}</td>
                            <td className="font-mono tabular-nums">{s.excessYr > 0 ? usd(s.excessYr) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {status === 'done' && leakResult && mode === 'leak' && (
            <section className="border-t border-[#1f1f1f] py-16 px-6">
              <div className="max-w-6xl mx-auto">
                <p className="compass-eyebrow mb-4">— Leak Detector · {filename}</p>
                <h2 className="compass-display text-3xl md:text-5xl mb-8">
                  {leakResult.ticketsAnalyzed.toLocaleString()} tickets. <em>{leakResult.stores.length} store{leakResult.stores.length === 1 ? '' : 's'}.</em>
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="compass-kpi"><p className="compass-kpi-label">Network net</p><p className="compass-kpi-val">{usd(leakResult.networkNet)}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Voids</p><p className="compass-kpi-val">{usd(leakResult.networkVoids)}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Comps</p><p className="compass-kpi-val">{usd(leakResult.networkComps)}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Discounts</p><p className="compass-kpi-val">{usd(leakResult.networkDiscounts)}</p></div>
                </div>

                {/* Signal cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
                  <div className="compass-card" style={leakResult.signals.voidAfterPayment.totalCount > 0 ? { borderColor: '#ff453a' } : {}}>
                    <p className="compass-card-label" style={leakResult.signals.voidAfterPayment.totalCount > 0 ? { color: '#ff453a' } : {}}>— Void after payment</p>
                    <h3>{leakResult.signals.voidAfterPayment.totalCount} tickets · <em>{usd(leakResult.signals.voidAfterPayment.totalDollars)}</em></h3>
                    <p className="compass-body text-[13px] mt-2">Ticket was paid, then voided. The classic skim.</p>
                    {leakResult.signals.voidAfterPayment.flagged.slice(0, 5).map((f) => (
                      <p key={f.name} className="text-[13px] mt-1 text-white font-mono">{f.name} <span className="text-[#6e6e73]">·</span> {f.count}</p>
                    ))}
                  </div>

                  <div className="compass-card" style={leakResult.signals.cashOnlyVoiders.length > 0 ? { borderColor: '#ff453a' } : {}}>
                    <p className="compass-card-label" style={leakResult.signals.cashOnlyVoiders.length > 0 ? { color: '#ff453a' } : {}}>— Cash-only voiders</p>
                    <h3>{leakResult.signals.cashOnlyVoiders.length} name{leakResult.signals.cashOnlyVoiders.length === 1 ? '' : 's'} flagged</h3>
                    <p className="compass-body text-[13px] mt-2">≥80% of their voids on cash tickets. Strong theft signal.</p>
                    {leakResult.signals.cashOnlyVoiders.slice(0, 5).map((f) => (
                      <p key={f.name} className="text-[13px] mt-1 text-white font-mono">{f.name} <span className="text-[#6e6e73]">·</span> {pct(f.rate)}</p>
                    ))}
                  </div>

                  <div className="compass-card" style={leakResult.signals.compAbuse.length > 0 ? { borderColor: '#ff9500' } : {}}>
                    <p className="compass-card-label" style={leakResult.signals.compAbuse.length > 0 ? { color: '#ff9500' } : {}}>— Comp abuse</p>
                    <h3>{leakResult.signals.compAbuse.length} name{leakResult.signals.compAbuse.length === 1 ? '' : 's'} flagged</h3>
                    <p className="compass-body text-[13px] mt-2">Comp rate above peer band, or {'>'}10% of own revenue comped.</p>
                    {leakResult.signals.compAbuse.slice(0, 5).map((f) => (
                      <p key={f.name} className="text-[13px] mt-1 text-white font-mono">{f.name} <span className="text-[#6e6e73]">·</span> {pct(f.rate)}</p>
                    ))}
                  </div>

                  <div className="compass-card" style={leakResult.signals.promoStacking.totalCount > 0 ? { borderColor: '#ff9500' } : {}}>
                    <p className="compass-card-label" style={leakResult.signals.promoStacking.totalCount > 0 ? { color: '#ff9500' } : {}}>— Promo stacking</p>
                    <h3>{leakResult.signals.promoStacking.totalCount} tickets · <em>{usd(leakResult.signals.promoStacking.totalDollars)}</em></h3>
                    <p className="compass-body text-[13px] mt-2">Two or more discounts applied to a single ticket.</p>
                    {leakResult.signals.promoStacking.flagged.slice(0, 5).map((f) => (
                      <p key={f.name} className="text-[13px] mt-1 text-white font-mono">{f.name} <span className="text-[#6e6e73]">·</span> {f.count}</p>
                    ))}
                  </div>

                  <div className="compass-card" style={leakResult.signals.discountAfterClose.totalCount > 0 ? { borderColor: '#ff9500' } : {}}>
                    <p className="compass-card-label" style={leakResult.signals.discountAfterClose.totalCount > 0 ? { color: '#ff9500' } : {}}>— Discount after close</p>
                    <h3>{leakResult.signals.discountAfterClose.totalCount} tickets · <em>{usd(leakResult.signals.discountAfterClose.totalDollars)}</em></h3>
                    <p className="compass-body text-[13px] mt-2">Discount applied after the ticket was closed.</p>
                    {leakResult.signals.discountAfterClose.flagged.slice(0, 5).map((f) => (
                      <p key={f.name} className="text-[13px] mt-1 text-white font-mono">{f.name} <span className="text-[#6e6e73]">·</span> {f.count}</p>
                    ))}
                  </div>

                  <div className="compass-card">
                    <p className="compass-card-label">— Network rates</p>
                    <h3>Aggregate</h3>
                    <p className="compass-body text-[13px] mt-2">
                      Void: <span className="font-mono text-white">{pct(leakResult.networkVoids / Math.max(1, leakResult.networkNet))}</span>
                      <br />Comp: <span className="font-mono text-white">{pct(leakResult.networkComps / Math.max(1, leakResult.networkNet))}</span>
                      <br />Discount: <span className="font-mono text-white">{pct(leakResult.networkDiscounts / Math.max(1, leakResult.networkNet))}</span>
                    </p>
                  </div>
                </div>

                {/* Top-risk employee table */}
                <p className="compass-eyebrow mb-3">— Top names · sorted by composite risk score</p>
                <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                  <table className="data-table w-full">
                    <thead><tr>
                      <th className="!text-left">Name</th>
                      <th className="!text-left">Store</th>
                      <th>Tickets</th>
                      <th>Net</th>
                      <th>Voids</th>
                      <th>Cash voids</th>
                      <th>Comps</th>
                      <th>PostPay</th>
                      <th>Stack</th>
                      <th>Risk</th>
                    </tr></thead>
                    <tbody>
                      {leakResult.employees.slice(0, 20).map((e) => (
                        <tr key={`${e.store}-${e.name}`} style={{ color: '#d2d2d7' }}>
                          <td className="!text-left text-white font-medium">{e.name}</td>
                          <td className="!text-left">{e.store}</td>
                          <td className="font-mono tabular-nums">{e.ticketsRung}</td>
                          <td className="font-mono tabular-nums">{usd(e.netSales)}</td>
                          <td className="font-mono tabular-nums">{usd(e.voidsDollars)}</td>
                          <td className="font-mono tabular-nums">{e.cashVoidsCount}</td>
                          <td className="font-mono tabular-nums">{usd(e.compsDollars)}</td>
                          <td className="font-mono tabular-nums">{e.voidAfterPaymentCount}</td>
                          <td className="font-mono tabular-nums">{e.promoStackedCount}</td>
                          <td className="font-mono tabular-nums font-semibold" style={{ color: e.riskScore >= 50 ? '#ff453a' : e.riskScore >= 20 ? '#ff9500' : '#86868b' }}>
                            {e.riskScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          <section className="border-t border-[#1f1f1f] py-16 px-6">
            <div className="max-w-3xl mx-auto">
              <p className="compass-eyebrow mb-4">— Connect your POS · auto-read every shift</p>
              <h2 className="compass-display text-3xl md:text-5xl mb-10">
                When OAuth lights up, <em>we email you first.</em>
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {POS_OPTIONS.map((p) => (
                  <button key={p.v} onClick={() => joinWaitlist(p.v)} className="compass-card text-left hover:border-[#0066ff] transition-colors group">
                    <div className="flex items-center justify-between">
                      <p className="compass-card-label">{p.tag}</p>
                      {p.status === 'csv'
                        ? <span className="text-[11px] font-medium" style={{ color: '#34c759' }}>CSV today</span>
                        : <span className="text-[11px] font-medium" style={{ color: '#0066ff' }}>Waitlist</span>}
                    </div>
                    <h3>{p.v}</h3>
                    <p className="compass-body text-[13px] mt-2">{p.note}</p>
                    {waitlistPos === p.v && waitlistStatus === 'sent' && <p className="text-[11px] mt-2" style={{ color: '#34c759' }}>✓ On the list</p>}
                  </button>
                ))}
              </div>
              {!email && waitlistPos && (
                <p className="compass-body text-sm mt-4 text-center">
                  Add your email below first so we know where to send the &ldquo;{waitlistPos}&rdquo; alert.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      {phase === 'ended' && (
        <section className="max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
          <p className="compass-eyebrow mb-6" style={{ color: '#ff9500' }}>— Trial ended</p>
          <h1 className="compass-display text-4xl md:text-6xl mb-6">
            Time&apos;s up. <em>The leak isn&apos;t.</em>
          </h1>
          <p className="compass-body text-lg md:text-xl mb-10">
            You saw the read. Want it on every shift, wired to your live POS, every figure source-tagged? Drop your details — Myke reaches out personally within 24 hours.
          </p>
        </section>
      )}

      {phase !== 'start' && (
        <section className="border-t border-[#1f1f1f] py-16 px-6">
          <div className="max-w-xl mx-auto">
            <p className="compass-eyebrow mb-4 text-center">— Save your read · wire it to live data</p>
            {leadSaved ? (
              <div className="compass-card text-center">
                <p className="font-serif text-2xl text-white">You&apos;re saved.</p>
                <p className="compass-body mt-3">Myke will reach out within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={saveLead} className="compass-card space-y-3">
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
                <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
                <button type="submit" className="btn-primary w-full" style={{ background: '#0066ff' }}>Save my read →</button>
              </form>
            )}
          </div>
        </section>
      )}

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/pricing"  className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/onboard"  className="hover:text-white transition-colors">Full onboard</Link>
            <Link href="/"         className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
