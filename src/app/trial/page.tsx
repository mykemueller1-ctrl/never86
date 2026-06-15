'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/track';

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
    dowVoidPatterns:     Array<{ store: string; name: string; dow: string; voidsOnDow: number; totalVoids: number; concentration: number }>;
    microCompPatterns:   Array<{ store: string; name: string; compsCount: number; compsDollars: number; avgComp: number }>;
  };
  employees: EmployeeRow[];
};

type Err = { ok: false; error: string; hint?: string; detectedColumns?: string[] };

const MODES = [
  { id: 'void',     label: 'Void Hunter',          blurb: 'Employee performance CSV · voids vs peer band' },
  { id: 'leak',     label: 'Leak Detector',        blurb: 'Ticket-level CSV · 7 theft signals · risk score per name' },
  { id: 'labor',    label: 'Labor Drift',          blurb: 'Timesheet CSV · OT drift · ghost shifts · early/late clocks' },
  { id: 'tips',     label: 'Tip Variance',         blurb: 'Weekly tip CSV · per-name week-over-week tip-rate delta' },
  { id: 'catering', label: 'Catering Leak',        blurb: 'Catering recon CSV · invoice-vs-POS gap · unmatched orders' },
  { id: 'bcs',      label: 'Beverage Cost Score',  blurb: 'Pour vs inventory CSV · BCS 0-100 · per-category shrink' },
  { id: 'drift',    label: 'Vendor Drift',         blurb: 'Vendor invoice CSV · per-SKU week-over-week price drift' },
] as const;
type Mode = typeof MODES[number]['id'];

type LaborDriftResult = {
  ok: true;
  rowsParsed: number;
  shifts: number;
  employees: number;
  stores: string[];
  totalDriftMinutes: number;
  totalDriftDollars: number;
  driftRatio: number;
  perEmployee: Array<{ store: string; name: string; earlyClockIns: number; lateClockOuts: number; earlyMinutes: number; lateMinutes: number; totalOtMinutes: number; shiftsRun: number }>;
  ghostShifts: Array<{ store: string; name: string; clockedMinutes: number; netSales: number; shiftStart: string }>;
};

type TipVarianceResult = {
  ok: true;
  rowsParsed: number;
  weeks: string[];
  employees: number;
  networkPrevTips: number;
  networkCurrTips: number;
  networkWoW: number;
  perEmployee: Array<{ store: string; name: string; prevTipRate: number; currTipRate: number; deltaPp: number; prevTipDollars: number; currTipDollars: number; flagged: boolean }>;
};

type BcsResult = {
  ok: true;
  rowsParsed: number;
  storesCount: number;
  networkConsumed: number;
  networkPoured: number;
  networkShrinkUnits: number;
  networkShrinkPct: number;
  networkRevenueLost: number;
  networkBcsScore: number;
  perStore: Array<{ store: string; bcsScore: number; consumed: number; poured: number; shrinkUnits: number; shrinkPct: number; revenueLost: number; byCategory: Array<{ category: string; consumed: number; poured: number; shrinkUnits: number; shrinkPct: number; revenueLost: number }> }>;
};

type VendorDriftResult = {
  ok: true;
  rowsParsed: number;
  vendors: string[];
  periodsCount: number;
  prevPeriod: string;
  currPeriod: string;
  totalSkus: number;
  flaggedSkus: number;
  totalDriftDollars: number;
  perSku: Array<{ vendor: string; sku: string; category: string; prevPeriod: string; currPeriod: string; prevPrice: number; currPrice: number; driftPct: number; driftDollars: number; flagged: boolean }>;
};

type CateringResult = {
  ok: true;
  rowsParsed: number;
  orders: number;
  stores: string[];
  totalInvoice: number;
  totalPos: number;
  totalGap: number;
  gapRatio: number;
  perStore: Array<{ store: string; orders: number; totalInvoice: number; totalPos: number; totalGap: number; gapRatio: number }>;
  topCustomerConcentration: Array<{ customer: string; orders: number; totalGap: number; totalInvoice: number; gapShare: number }>;
  unmatchedOrders: Array<{ store: string; orderId: string; customer: string; eventDate: string; invoiceAmount: number; posAmount: number; gap: number }>;
  flaggedOrders: Array<{ store: string; orderId: string; customer: string; eventDate: string; invoiceAmount: number; posAmount: number; gap: number }>;
};

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
  const [laborResult, setLaborResult] = useState<LaborDriftResult | null>(null);
  const [tipsResult, setTipsResult] = useState<TipVarianceResult | null>(null);
  const [cateringResult, setCateringResult] = useState<CateringResult | null>(null);
  const [bcsResult, setBcsResult] = useState<BcsResult | null>(null);
  const [driftResult, setDriftResult] = useState<VendorDriftResult | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [errHint, setErrHint] = useState('');
  const [detectedCols, setDetectedCols] = useState<string[]>([]);
  const [filename, setFilename] = useState('');
  const [dragging, setDragging] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [name, setName] = useState('');
  const [leadSaved, setLeadSaved] = useState(false);

  const [waitlistPos, setWaitlistPos] = useState<string | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => { trackEvent('trial_view'); }, []);

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
    trackEvent('trial_start_click');
    setStarting(true);
    try {
      const res = await fetch('/api/trial/start', { method: 'POST' });
      const data = await res.json();
      if (data.ok && data.expiresAt) {
        setExpiresAt(new Date(data.expiresAt).getTime());
        setRemaining(new Date(data.expiresAt).getTime() - Date.now());
        setPhase('active');
        trackEvent('trial_start_success', { meta: { expiresAt: data.expiresAt } });
      } else {
        const msg = data.error || 'Could not start trial.';
        setErrMsg(msg);
        trackEvent('trial_start_error', { meta: { error: msg, status: res.status } });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not start trial.';
      setErrMsg(msg);
      trackEvent('trial_start_error', { meta: { error: msg, status: 0 } });
    } finally {
      setStarting(false);
    }
  }

  async function runFile(file: File) {
    trackEvent('trial_csv_dropped', { meta: { mode, filename: file.name, sizeBytes: file.size } });
    setFilename(file.name);
    setStatus('running');
    setErrMsg(''); setErrHint(''); setDetectedCols([]);
    setVoidResult(null); setLeakResult(null); setLaborResult(null); setTipsResult(null); setCateringResult(null); setBcsResult(null); setDriftResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const endpoint = mode === 'void'     ? '/api/connect/void-hunter'
                     : mode === 'leak'     ? '/api/connect/leak-detector'
                     : mode === 'labor'    ? '/api/connect/labor-drift'
                     : mode === 'tips'     ? '/api/connect/tip-variance'
                     : mode === 'catering' ? '/api/connect/catering-leak'
                     : mode === 'bcs'      ? '/api/connect/beverage-score'
                     : '/api/connect/vendor-drift';
      const res = await fetch(endpoint, { method: 'POST', body: form });
      const data = await res.json();
      if (data.ok) {
        if      (mode === 'void')     setVoidResult(data as VoidResult);
        else if (mode === 'leak')     setLeakResult(data as LeakResult);
        else if (mode === 'labor')    setLaborResult(data as LaborDriftResult);
        else if (mode === 'tips')     setTipsResult(data as TipVarianceResult);
        else if (mode === 'catering') setCateringResult(data as CateringResult);
        else if (mode === 'bcs')      setBcsResult(data as BcsResult);
        else                          setDriftResult(data as VendorDriftResult);
        if (typeof data.shareToken === 'string') setShareToken(data.shareToken);
        setStatus('done');
        trackEvent('trial_run_complete', { meta: { mode, shareToken: typeof data.shareToken === 'string' ? data.shareToken : null } });
      } else {
        const err = data as Err;
        setErrMsg(err.error || 'Failed to parse');
        setErrHint(err.hint || '');
        setDetectedCols(err.detectedColumns || []);
        setStatus('error');
        trackEvent('trial_run_error', { meta: { mode, error: err.error || 'parse_failed' } });
      }
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : 'Something went wrong');
      setStatus('error');
      trackEvent('trial_run_error', { meta: { mode, error: e instanceof Error ? e.message : 'unknown' } });
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
    trackEvent('trial_lead_saved', { meta: { mode, hasShareToken: !!shareToken } });
    try {
      // If there's a saved run, claim it against this email so the
      // operator can return to /trial/run/[shareToken].
      if (shareToken) {
        await fetch('/api/trial/claim', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareToken, email, name, restaurantName }),
        });
      } else {
        await fetch('/api/waitlist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email, name, restaurantName,
            agentRequested: mode === 'void' ? 'Void Hunter · trial' : 'Leak Detector · trial',
            sourcePage: '/trial',
          }),
        });
      }
      setLeadSaved(true);
    } catch {}
  }

  function copyShareUrl() {
    if (!shareToken || typeof window === 'undefined') return;
    const url = `${window.location.origin}/trial/run/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {});
  }

  // Sample-data path. Operators landing from LinkedIn often don't have
  // an export ready — let them see the result on our synthetic fixture
  // immediately, then prompt them to drop their own CSV.
  async function runSample() {
    trackEvent('trial_sample_run', { meta: { mode } });
    const SAMPLE_URLS: Record<Mode, { url: string; name: string }> = {
      void:     { url: '/samples/toast-employee-performance.csv', name: 'sample-void-hunter.csv' },
      leak:     { url: '/samples/toast-sales-detail.csv',         name: 'sample-leak-detector.csv' },
      labor:    { url: '/samples/timesheet-labor.csv',            name: 'sample-labor-drift.csv' },
      tips:     { url: '/samples/tips-weekly.csv',                name: 'sample-tip-variance.csv' },
      catering: { url: '/samples/catering-reconciliation.csv',    name: 'sample-catering-leak.csv' },
      bcs:      { url: '/samples/beverage-pour.csv',              name: 'sample-beverage-score.csv' },
      drift:    { url: '/samples/vendor-drift.csv',               name: 'sample-vendor-drift.csv' },
    };
    const s = SAMPLE_URLS[mode];
    if (!s) return;
    try {
      const res = await fetch(s.url);
      const blob = await res.blob();
      const file = new File([blob], s.name, { type: 'text/csv' });
      runFile(file);
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
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {MODES.map((m) => (
                <button key={m.id} type="button" onClick={() => { if (m.id !== mode) trackEvent('trial_agent_selected', { meta: { mode: m.id } }); setMode(m.id); setStatus('idle'); setVoidResult(null); setLeakResult(null); setLaborResult(null); setTipsResult(null); setCateringResult(null); }}
                  className="compass-card text-left transition-colors"
                  style={mode === m.id ? { borderColor: '#0066ff' } : {}}>
                  <p className="compass-card-label" style={mode === m.id ? { color: '#0066ff' } : {}}>{mode === m.id ? 'Selected' : 'Agent'}</p>
                  <h3>{m.label}</h3>
                  <p className="compass-body text-sm mt-2">{m.blurb}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 mb-4">
              <p className="compass-eyebrow-dim">— Don&apos;t have your own export yet?</p>
              <button onClick={runSample} className="btn-secondary text-[13px]" style={{ background: 'transparent', borderColor: '#0066ff', color: '#0066ff' }}>
                Run on sample data →
              </button>
            </div>

            <label
              htmlFor="trial-csv-input"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className="compass-card cursor-pointer text-center transition-all block"
              style={{
                padding: '60px 20px',
                borderStyle: 'dashed',
                borderColor: dragging ? '#0066ff' : '#2c2c2e',
                background: dragging ? 'rgba(0,102,255,0.04)' : '#0a0a0a',
              }}
            >
              <input id="trial-csv-input" type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) runFile(f); }} className="sr-only" />
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
                      : mode === 'leak'
                      ? 'Per-ticket CSV · Location, Employee, Ticket Total, Tender, Void/Comp/Discount columns'
                      : mode === 'labor'
                      ? 'Timesheet CSV · Location, Employee, Scheduled Start/End, Clock In/Out (+ Net Sales for ghost-shift detection)'
                      : mode === 'tips'
                      ? 'Weekly tip CSV · Location, Employee, Week, Net Sales, Net Tips (must cover ≥ 2 weeks)'
                      : mode === 'catering'
                      ? 'Catering recon CSV · Location, Customer, Invoice Amount, POS Amount (+ Order ID + Event Date optional)'
                      : mode === 'bcs'
                      ? 'Beverage close CSV · Location, Category, Consumed, Poured (+ Unit Price optional for revenue-lost calc)'
                      : 'Vendor invoice CSV · Vendor, SKU, Period, Unit Price (must cover ≥ 2 periods · monthly buckets ideal)'}
                  </p>
                </>
              )}
            </label>

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

          {status === 'done' && shareToken && (
            <section className="px-6 pt-4 pb-2">
              <div className="max-w-4xl mx-auto">
                <div className="compass-card flex flex-wrap gap-3 items-center justify-between" style={{ borderColor: '#0066ff' }}>
                  <div>
                    <p className="compass-card-label" style={{ color: '#0066ff' }}>— Saved · bookmark this URL</p>
                    <p className="font-mono text-white text-[13px] mt-2 break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/trial/run/${shareToken}` : `/trial/run/${shareToken}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={copyShareUrl} className="btn-secondary text-[13px]" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>
                      {shareCopied ? '✓ Copied' : 'Copy link'}
                    </button>
                    <a href={`/trial/run/${shareToken}`} target="_blank" rel="noopener" className="btn-primary text-[13px]" style={{ background: '#0066ff' }}>Open →</a>
                  </div>
                </div>
              </div>
            </section>
          )}

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

                  <div className="compass-card" style={leakResult.signals.dowVoidPatterns?.length > 0 ? { borderColor: '#ff453a' } : {}}>
                    <p className="compass-card-label" style={leakResult.signals.dowVoidPatterns?.length > 0 ? { color: '#ff453a' } : {}}>— Day-of-week pattern</p>
                    <h3>{leakResult.signals.dowVoidPatterns?.length || 0} name{leakResult.signals.dowVoidPatterns?.length === 1 ? '' : 's'} flagged</h3>
                    <p className="compass-body text-[13px] mt-2">≥40% of their voids cluster on one weekday. The shift pattern.</p>
                    {leakResult.signals.dowVoidPatterns?.slice(0, 5).map((f) => (
                      <p key={`${f.store}-${f.name}`} className="text-[13px] mt-1 text-white font-mono">{f.name} <span className="text-[#6e6e73]">·</span> {f.dow} <span className="text-[#6e6e73]">·</span> {f.voidsOnDow}/{f.totalVoids}</p>
                    ))}
                  </div>

                  <div className="compass-card" style={leakResult.signals.microCompPatterns?.length > 0 ? { borderColor: '#ff9500' } : {}}>
                    <p className="compass-card-label" style={leakResult.signals.microCompPatterns?.length > 0 ? { color: '#ff9500' } : {}}>— Micro-comp pattern</p>
                    <h3>{leakResult.signals.microCompPatterns?.length || 0} name{leakResult.signals.microCompPatterns?.length === 1 ? '' : 's'} flagged</h3>
                    <p className="compass-body text-[13px] mt-2">10+ comps averaging under $5. Modifier-abuse proxy — &ldquo;no charge add bacon&rdquo; pattern.</p>
                    {leakResult.signals.microCompPatterns?.slice(0, 5).map((f) => (
                      <p key={`${f.store}-${f.name}`} className="text-[13px] mt-1 text-white font-mono">{f.name} <span className="text-[#6e6e73]">·</span> {f.compsCount}× <span className="text-[#6e6e73]">avg</span> ${f.avgComp.toFixed(2)}</p>
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

          {status === 'done' && laborResult && mode === 'labor' && (
            <section className="border-t border-[#1f1f1f] py-16 px-6">
              <div className="max-w-5xl mx-auto">
                <p className="compass-eyebrow mb-4">— Labor Drift · {filename}</p>
                <h2 className="compass-display text-3xl md:text-5xl mb-10">
                  {laborResult.ghostShifts.length > 0
                    ? <>Found <em>{laborResult.ghostShifts.length} ghost shift{laborResult.ghostShifts.length === 1 ? '' : 's'}</em> + {Math.round(laborResult.totalDriftMinutes/60*10)/10} hrs of drift.</>
                    : <><em>{Math.round(laborResult.totalDriftMinutes/60*10)/10} hours</em> of drift across {laborResult.shifts} shifts.</>}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="compass-kpi"><p className="compass-kpi-label">Shifts</p><p className="compass-kpi-val">{laborResult.shifts}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Drift · min</p><p className="compass-kpi-val">{laborResult.totalDriftMinutes}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Drift · est $</p><p className="compass-kpi-val">${laborResult.totalDriftDollars}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Drift ratio</p><p className="compass-kpi-val">{(laborResult.driftRatio * 100).toFixed(2)}<span className="unit">%</span></p></div>
                </div>

                {laborResult.ghostShifts.length > 0 && (
                  <div className="compass-card mb-10" style={{ borderColor: '#ff453a' }}>
                    <p className="compass-card-label" style={{ color: '#ff453a' }}>— Ghost shifts</p>
                    <h3>{laborResult.ghostShifts.length} shift{laborResult.ghostShifts.length === 1 ? '' : 's'} clocked &gt; 60 min · zero sales</h3>
                    <ul className="mt-3 space-y-1">
                      {laborResult.ghostShifts.slice(0, 8).map((g, i) => (
                        <li key={`${g.store}-${g.name}-${i}`} className="text-[13px] text-white font-mono">{g.name} <span className="text-[#6e6e73]">·</span> {g.store} <span className="text-[#6e6e73]">·</span> {g.clockedMinutes} min <span className="text-[#6e6e73]">·</span> {g.shiftStart.slice(0, 10)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="compass-eyebrow mb-3">— Top names · sorted by OT minutes</p>
                <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                  <table className="data-table w-full">
                    <thead><tr>
                      <th className="!text-left">Name</th><th className="!text-left">Store</th>
                      <th>Shifts</th><th>Early in</th><th>Early min</th><th>Late out</th><th>Late min</th><th>OT min</th>
                    </tr></thead>
                    <tbody>
                      {laborResult.perEmployee.map((e) => (
                        <tr key={`${e.store}-${e.name}`} style={{ color: '#d2d2d7' }}>
                          <td className="!text-left text-white font-medium">{e.name}</td>
                          <td className="!text-left">{e.store}</td>
                          <td className="font-mono tabular-nums">{e.shiftsRun}</td>
                          <td className="font-mono tabular-nums">{e.earlyClockIns}</td>
                          <td className="font-mono tabular-nums">{Math.round(e.earlyMinutes)}</td>
                          <td className="font-mono tabular-nums">{e.lateClockOuts}</td>
                          <td className="font-mono tabular-nums">{Math.round(e.lateMinutes)}</td>
                          <td className="font-mono tabular-nums font-semibold" style={{ color: e.totalOtMinutes > 120 ? '#ff453a' : e.totalOtMinutes > 30 ? '#ff9500' : '#86868b' }}>{Math.round(e.totalOtMinutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {status === 'done' && tipsResult && mode === 'tips' && (
            <section className="border-t border-[#1f1f1f] py-16 px-6">
              <div className="max-w-5xl mx-auto">
                <p className="compass-eyebrow mb-4">— Tip Variance · {filename}</p>
                <h2 className="compass-display text-3xl md:text-5xl mb-10">
                  {tipsResult.perEmployee.filter((e) => e.flagged).length > 0
                    ? <>{tipsResult.perEmployee.filter((e) => e.flagged).length} name{tipsResult.perEmployee.filter((e) => e.flagged).length === 1 ? '' : 's'} <em>dropping fast</em>.</>
                    : <>No flagged names <em>this week.</em></>}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="compass-kpi"><p className="compass-kpi-label">Weeks loaded</p><p className="compass-kpi-val">{tipsResult.weeks.length}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Network prev tips</p><p className="compass-kpi-val">${Math.round(tipsResult.networkPrevTips).toLocaleString()}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Network curr tips</p><p className="compass-kpi-val">${Math.round(tipsResult.networkCurrTips).toLocaleString()}</p></div>
                  <div className="compass-kpi">
                    <p className="compass-kpi-label">Network WoW</p>
                    <p className="compass-kpi-val" style={{ color: tipsResult.networkWoW < -0.05 ? '#ff453a' : tipsResult.networkWoW < 0 ? '#ff9500' : '#ffffff' }}>
                      {(tipsResult.networkWoW * 100).toFixed(1)}<span className="unit">%</span>
                    </p>
                  </div>
                </div>

                <p className="compass-eyebrow mb-3">— Per name · sorted by most-negative WoW delta</p>
                <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                  <table className="data-table w-full">
                    <thead><tr>
                      <th className="!text-left">Name</th><th className="!text-left">Store</th>
                      <th>Prev rate</th><th>Curr rate</th><th>Δ pp</th><th>Prev $</th><th>Curr $</th><th>Flag</th>
                    </tr></thead>
                    <tbody>
                      {tipsResult.perEmployee.map((e) => (
                        <tr key={`${e.store}-${e.name}`} style={{ color: '#d2d2d7' }}>
                          <td className="!text-left text-white font-medium">{e.name}</td>
                          <td className="!text-left">{e.store}</td>
                          <td className="font-mono tabular-nums">{(e.prevTipRate * 100).toFixed(2)}%</td>
                          <td className="font-mono tabular-nums">{(e.currTipRate * 100).toFixed(2)}%</td>
                          <td className="font-mono tabular-nums font-semibold" style={{ color: e.deltaPp < -3 ? '#ff453a' : e.deltaPp < -1 ? '#ff9500' : e.deltaPp > 1 ? '#34c759' : '#86868b' }}>
                            {e.deltaPp > 0 ? '+' : ''}{e.deltaPp.toFixed(2)}
                          </td>
                          <td className="font-mono tabular-nums">${Math.round(e.prevTipDollars).toLocaleString()}</td>
                          <td className="font-mono tabular-nums">${Math.round(e.currTipDollars).toLocaleString()}</td>
                          <td className="font-mono">{e.flagged ? <span className="badge badge-unverified">Flag</span> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {status === 'done' && cateringResult && mode === 'catering' && (
            <section className="border-t border-[#1f1f1f] py-16 px-6">
              <div className="max-w-5xl mx-auto">
                <p className="compass-eyebrow mb-4">— Catering Leak · {filename}</p>
                <h2 className="compass-display text-3xl md:text-5xl mb-10">
                  {cateringResult.unmatchedOrders.length > 0
                    ? <>Found <em>{cateringResult.unmatchedOrders.length} unmatched order{cateringResult.unmatchedOrders.length === 1 ? '' : 's'}</em> · ${Math.round(cateringResult.totalGap).toLocaleString()} total gap.</>
                    : <>${Math.round(cateringResult.totalGap).toLocaleString()} total gap <em>across {cateringResult.orders} orders.</em></>}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="compass-kpi"><p className="compass-kpi-label">Orders</p><p className="compass-kpi-val">{cateringResult.orders}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Invoice total</p><p className="compass-kpi-val">${Math.round(cateringResult.totalInvoice).toLocaleString()}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">POS total</p><p className="compass-kpi-val">${Math.round(cateringResult.totalPos).toLocaleString()}</p></div>
                  <div className="compass-kpi">
                    <p className="compass-kpi-label">Gap ratio</p>
                    <p className="compass-kpi-val" style={{ color: cateringResult.gapRatio > 0.1 ? '#ff453a' : cateringResult.gapRatio > 0.03 ? '#ff9500' : '#34c759' }}>
                      {(cateringResult.gapRatio * 100).toFixed(1)}<span className="unit">%</span>
                    </p>
                  </div>
                </div>

                {cateringResult.unmatchedOrders.length > 0 && (
                  <div className="compass-card mb-10" style={{ borderColor: '#ff453a' }}>
                    <p className="compass-card-label" style={{ color: '#ff453a' }}>— Unmatched orders</p>
                    <h3>{cateringResult.unmatchedOrders.length} invoice{cateringResult.unmatchedOrders.length === 1 ? '' : 's'} · no POS ticket</h3>
                    <ul className="mt-3 space-y-1">
                      {cateringResult.unmatchedOrders.slice(0, 10).map((o, i) => (
                        <li key={`${o.orderId}-${i}`} className="text-[13px] text-white font-mono">{o.customer} <span className="text-[#6e6e73]">·</span> {o.store} <span className="text-[#6e6e73]">·</span> ${Math.round(o.invoiceAmount).toLocaleString()} <span className="text-[#6e6e73]">·</span> {o.eventDate}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="compass-eyebrow mb-3">— Top customer concentration</p>
                <div className="compass-card overflow-x-auto mb-10" style={{ padding: 0 }}>
                  <table className="data-table w-full">
                    <thead><tr><th className="!text-left">Customer</th><th>Orders</th><th>Invoice $</th><th>Gap $</th><th>Gap share</th></tr></thead>
                    <tbody>
                      {cateringResult.topCustomerConcentration.slice(0, 10).map((c) => (
                        <tr key={c.customer} style={{ color: '#d2d2d7' }}>
                          <td className="!text-left text-white font-medium">{c.customer}</td>
                          <td className="font-mono tabular-nums">{c.orders}</td>
                          <td className="font-mono tabular-nums">${Math.round(c.totalInvoice).toLocaleString()}</td>
                          <td className="font-mono tabular-nums font-semibold" style={{ color: c.totalGap > 1000 ? '#ff453a' : c.totalGap > 200 ? '#ff9500' : '#86868b' }}>${Math.round(c.totalGap).toLocaleString()}</td>
                          <td className="font-mono tabular-nums">{(c.gapShare * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="compass-eyebrow mb-3">— Per store · sorted by total gap</p>
                <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                  <table className="data-table w-full">
                    <thead><tr><th className="!text-left">Store</th><th>Orders</th><th>Invoice</th><th>POS</th><th>Gap</th><th>Gap ratio</th></tr></thead>
                    <tbody>
                      {cateringResult.perStore.map((s) => (
                        <tr key={s.store} style={{ color: '#d2d2d7' }}>
                          <td className="!text-left text-white font-medium">{s.store}</td>
                          <td className="font-mono tabular-nums">{s.orders}</td>
                          <td className="font-mono tabular-nums">${Math.round(s.totalInvoice).toLocaleString()}</td>
                          <td className="font-mono tabular-nums">${Math.round(s.totalPos).toLocaleString()}</td>
                          <td className="font-mono tabular-nums font-semibold" style={{ color: s.totalGap > 1000 ? '#ff453a' : s.totalGap > 200 ? '#ff9500' : '#86868b' }}>${Math.round(s.totalGap).toLocaleString()}</td>
                          <td className="font-mono tabular-nums">{(s.gapRatio * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {status === 'done' && bcsResult && mode === 'bcs' && (
            <section className="border-t border-[#1f1f1f] py-16 px-6">
              <div className="max-w-5xl mx-auto">
                <p className="compass-eyebrow mb-4">— Beverage Cost Score · {filename}</p>
                <h2 className="compass-display text-3xl md:text-5xl mb-10">
                  Network BCS <em style={{ color: bcsResult.networkBcsScore >= 80 ? '#34c759' : bcsResult.networkBcsScore >= 60 ? '#ff9500' : '#ff453a' }}>{bcsResult.networkBcsScore}</em> / 100.
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="compass-kpi"><p className="compass-kpi-label">Stores</p><p className="compass-kpi-val">{bcsResult.storesCount}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Shrink units</p><p className="compass-kpi-val">{Math.round(bcsResult.networkShrinkUnits).toLocaleString()}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Shrink %</p><p className="compass-kpi-val">{(bcsResult.networkShrinkPct * 100).toFixed(2)}<span className="unit">%</span></p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Revenue lost</p><p className="compass-kpi-val">${Math.round(bcsResult.networkRevenueLost).toLocaleString()}</p></div>
                </div>
                <p className="compass-eyebrow mb-3">— Per store · sorted by BCS ascending (worst first)</p>
                <div className="space-y-3">
                  {bcsResult.perStore.map((s) => (
                    <div key={s.store} className="compass-card">
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                        <h3>{s.store}</h3>
                        <p className="font-mono text-3xl font-bold" style={{ color: s.bcsScore >= 80 ? '#34c759' : s.bcsScore >= 60 ? '#ff9500' : '#ff453a' }}>{s.bcsScore}</p>
                      </div>
                      <p className="compass-body text-[13px]" style={{ color: '#86868b' }}>
                        Consumed {s.consumed} · Poured {s.poured} · Shrink {s.shrinkUnits} ({(s.shrinkPct * 100).toFixed(2)}%) · Lost ${Math.round(s.revenueLost).toLocaleString()}
                      </p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                        {s.byCategory.map((c) => (
                          <div key={c.category} className="px-3 py-2 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #2c2c2e' }}>
                            <p className="text-[11px] uppercase tracking-wider" style={{ color: '#86868b' }}>{c.category}</p>
                            <p className="font-mono text-[14px] font-semibold mt-1" style={{ color: c.shrinkPct > 0.10 ? '#ff453a' : c.shrinkPct > 0.05 ? '#ff9500' : '#d2d2d7' }}>
                              {c.shrinkUnits} <span className="font-normal" style={{ color: '#86868b' }}>({(c.shrinkPct * 100).toFixed(1)}%)</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {status === 'done' && driftResult && mode === 'drift' && (
            <section className="border-t border-[#1f1f1f] py-16 px-6">
              <div className="max-w-5xl mx-auto">
                <p className="compass-eyebrow mb-4">— Vendor Drift · {filename}</p>
                <h2 className="compass-display text-3xl md:text-5xl mb-10">
                  {driftResult.flaggedSkus > 0
                    ? <>{driftResult.flaggedSkus} SKU{driftResult.flaggedSkus === 1 ? '' : 's'} <em>drifted {'>'}5%</em> last period.</>
                    : <>No SKUs <em>drifted &gt; 5%.</em></>}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                  <div className="compass-kpi"><p className="compass-kpi-label">Vendors</p><p className="compass-kpi-val">{driftResult.vendors.length}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">SKUs tracked</p><p className="compass-kpi-val">{driftResult.totalSkus}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Flagged ({'>'} 5%)</p><p className="compass-kpi-val" style={{ color: driftResult.flaggedSkus > 0 ? '#ff453a' : '#34c759' }}>{driftResult.flaggedSkus}</p></div>
                  <div className="compass-kpi"><p className="compass-kpi-label">Upward $ drift / unit</p><p className="compass-kpi-val">${driftResult.totalDriftDollars.toFixed(2)}</p></div>
                </div>
                <p className="compass-eyebrow mb-3">— Per SKU · sorted by drift % descending · {driftResult.prevPeriod} → {driftResult.currPeriod}</p>
                <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                  <table className="data-table w-full">
                    <thead><tr><th className="!text-left">SKU</th><th className="!text-left">Vendor</th><th>Prev $</th><th>Curr $</th><th>Δ $</th><th>Δ %</th><th>Flag</th></tr></thead>
                    <tbody>
                      {driftResult.perSku.map((s) => (
                        <tr key={`${s.vendor}-${s.sku}`} style={{ color: '#d2d2d7' }}>
                          <td className="!text-left text-white font-medium">{s.sku}</td>
                          <td className="!text-left">{s.vendor}</td>
                          <td className="font-mono tabular-nums">${s.prevPrice.toFixed(2)}</td>
                          <td className="font-mono tabular-nums">${s.currPrice.toFixed(2)}</td>
                          <td className="font-mono tabular-nums">${s.driftDollars.toFixed(2)}</td>
                          <td className="font-mono tabular-nums font-semibold" style={{ color: s.driftPct > 0.10 ? '#ff453a' : s.driftPct > 0.05 ? '#ff9500' : s.driftPct < -0.02 ? '#34c759' : '#86868b' }}>
                            {s.driftPct > 0 ? '+' : ''}{(s.driftPct * 100).toFixed(2)}%
                          </td>
                          <td>{s.flagged ? <span className="badge badge-unverified">Flag</span> : '—'}</td>
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
