'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';

type Store = { name: string; net: number; voids: number; voidRate: number; excessYr: number; flagged: boolean };
type Employee = { store: string; name: string; net: number; voidAmount: number; voidRate: number; flagged: boolean };
type Result = {
  ok: true;
  rowsParsed: number;
  networkNet: number;
  networkVoids: number;
  networkVoidRate: number;
  medianStoreVoidRate: number;
  storesFlagged: number;
  stores: Store[];
  employees: Employee[];
};
type Err = { ok: false; error: string; hint?: string; detectedColumns?: string[] };

const usd = (n: number) =>
  n >= 1000
    ? '$' + Math.round(n).toLocaleString()
    : '$' + n.toFixed(0);
const pct = (n: number) => (n * 100).toFixed(2) + '%';

export default function ConnectPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<Result | null>(null);
  const [errMsg, setErrMsg] = useState<string>('');
  const [errHint, setErrHint] = useState<string>('');
  const [detectedCols, setDetectedCols] = useState<string[]>([]);
  const [filename, setFilename] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lead-capture after they see the result.
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function runFile(file: File) {
    setFilename(file.name);
    setStatus('running');
    setErrMsg('');
    setErrHint('');
    setDetectedCols([]);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/connect/void-hunter', { method: 'POST', body: form });
      const data: Result | Err = await res.json();
      if (data.ok) {
        setResult(data);
        setStatus('done');
      } else {
        setErrMsg(data.error || 'Failed to parse');
        setErrHint(data.hint || '');
        setDetectedCols(data.detectedColumns || []);
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
    const file = e.dataTransfer.files?.[0];
    if (file) runFile(file);
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) runFile(file);
  }

  async function saveResult(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus('sending');
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          restaurantName,
          agentRequested: 'Void Hunter · CSV',
          sourcePage: '/connect',
        }),
      });
      setSaveStatus('sent');
    } catch {
      setSaveStatus('error');
    }
  }

  const networkLeakYr = result
    ? Math.max(0, result.networkVoids - result.medianStoreVoidRate * result.networkNet) * 3
    : 0;

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· connect</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · Void Hunter · CSV upload</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/onboard" className="compass-pill"><span className="avatar">O</span><span>Full onboard</span></Link>
            <Link href="/" className="btn-primary" style={{ background: '#0066ff' }}>Home</Link>
          </nav>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 pt-12 md:pt-16 pb-8">
        <p className="compass-eyebrow mb-6">— Drop a CSV · run an agent · 30 seconds</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          Drop. <em>Run.</em> See the leak.
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl mb-10">
          No signup. No POS wiring. Drop your employee-performance export from Toast, Square, or Clover — Void Hunter runs on it in real time and tells you which store and which name to look at first.
        </p>

        {status === 'idle' || status === 'error' || status === 'running' ? (
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
            <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handlePick} className="hidden" />
            {status === 'running' ? (
              <>
                <p className="compass-eyebrow mb-3">— Running</p>
                <p className="font-serif text-2xl text-white">Analyzing <em>{filename}</em>…</p>
                <p className="compass-body text-sm mt-3">Should be done in a moment.</p>
              </>
            ) : (
              <>
                <p className="compass-eyebrow mb-3">— Drop a CSV here</p>
                <p className="font-serif text-3xl text-white mb-2">Click to choose · or drag a file</p>
                <p className="compass-body text-sm">Required columns: Location · Employee · Net Sales · Void Amount</p>
              </>
            )}
          </div>
        ) : null}

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
            <button
              onClick={() => { setStatus('idle'); setErrMsg(''); }}
              className="btn-secondary mt-5"
              style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}
            >
              Try another file
            </button>
          </div>
        )}
      </section>

      {status === 'done' && result && (
        <>
          <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <p className="compass-eyebrow mb-4">— Result · {filename}</p>
              <h2 className="compass-display text-3xl md:text-5xl mb-10">
                {result.storesFlagged > 0
                  ? <>Found <em>{result.storesFlagged} store{result.storesFlagged === 1 ? '' : 's'}</em> above the peer band.</>
                  : <>No stores <em>above the peer band.</em></>}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="compass-kpi">
                  <p className="compass-kpi-label">Network net sales</p>
                  <p className="compass-kpi-val">{usd(result.networkNet)}</p>
                </div>
                <div className="compass-kpi">
                  <p className="compass-kpi-label">Network voids</p>
                  <p className="compass-kpi-val">{usd(result.networkVoids)}</p>
                </div>
                <div className="compass-kpi">
                  <p className="compass-kpi-label">Network void rate</p>
                  <p className="compass-kpi-val">{pct(result.networkVoidRate)}</p>
                </div>
                <div className="compass-kpi">
                  <p className="compass-kpi-label">Peer-median rate</p>
                  <p className="compass-kpi-val">{pct(result.medianStoreVoidRate)}</p>
                </div>
              </div>

              {networkLeakYr > 0 && (
                <div className="compass-card mb-10" style={{ borderColor: '#0066ff' }}>
                  <p className="compass-card-label" style={{ color: '#0066ff' }}>— The lever</p>
                  <h3>Excess voids above the peer band, annualized: <em style={{ color: '#0066ff' }}>{usd(networkLeakYr)}</em></h3>
                  <p className="compass-body text-sm mt-3">
                    What the network would recover if the above-band stores ran at the median rate. Pattern, not verdict — the next step is a 5-minute review of the names below.
                  </p>
                </div>
              )}

              {result.stores.length > 0 && (
                <>
                  <p className="compass-eyebrow mb-3">— Stores · sorted by void rate</p>
                  <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                    <table className="data-table w-full">
                      <thead>
                        <tr>
                          <th className="!text-left">Store</th>
                          <th>Net sales</th>
                          <th>Voids</th>
                          <th>Void rate</th>
                          <th>Excess vs peer / yr</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.stores.map((s) => (
                          <tr key={s.name} style={{ color: '#d2d2d7' }}>
                            <td className="!text-left text-white font-medium">
                              {s.name}
                              {s.flagged ? <span className="badge badge-unverified ml-2">Above band</span> : null}
                            </td>
                            <td className="font-mono tabular-nums">{usd(s.net)}</td>
                            <td className="font-mono tabular-nums">{usd(s.voids)}</td>
                            <td className="font-mono tabular-nums">{pct(s.voidRate)}</td>
                            <td className="font-mono tabular-nums">{s.excessYr > 0 ? usd(s.excessYr) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {result.employees.length > 0 && (
                <div className="mt-10">
                  <p className="compass-eyebrow mb-3">— Top 15 names · sorted by void $</p>
                  <div className="compass-card overflow-x-auto" style={{ padding: 0 }}>
                    <table className="data-table w-full">
                      <thead>
                        <tr>
                          <th className="!text-left">Name</th>
                          <th className="!text-left">Store</th>
                          <th>Net sales</th>
                          <th>Void $</th>
                          <th>Void rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.employees.map((e, i) => (
                          <tr key={`${e.store}-${e.name}-${i}`} style={{ color: '#d2d2d7' }}>
                            <td className="!text-left text-white font-medium">
                              {e.name}
                              {e.flagged ? <span className="badge badge-unverified ml-2">Review</span> : null}
                            </td>
                            <td className="!text-left">{e.store}</td>
                            <td className="font-mono tabular-nums">{usd(e.net)}</td>
                            <td className="font-mono tabular-nums">{usd(e.voidAmount)}</td>
                            <td className="font-mono tabular-nums">{pct(e.voidRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <p className="compass-eyebrow-dim mt-8">— {result.rowsParsed.toLocaleString()} rows parsed · runs locally · we don&apos;t persist your CSV</p>
            </div>
          </section>

          <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
            <div className="max-w-xl mx-auto">
              <p className="compass-eyebrow mb-4 text-center">— Want this on every shift</p>
              <h2 className="compass-display text-3xl md:text-5xl mb-8 text-center">
                Wire it <em>to your live data.</em>
              </h2>
              {saveStatus === 'sent' ? (
                <div className="compass-card text-center">
                  <p className="font-serif text-2xl text-white">You&apos;re in.</p>
                  <p className="compass-body mt-3">Myke will reach out within 24 hours to wire Void Hunter to your live POS feed.</p>
                </div>
              ) : (
                <form onSubmit={saveResult} className="compass-card space-y-3">
                  <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
                  <input type="text" placeholder="Restaurant or group" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#0066ff] transition-colors" />
                  <button
                    type="submit"
                    disabled={saveStatus === 'sending'}
                    className="btn-primary w-full disabled:opacity-50"
                    style={{ background: '#0066ff' }}
                  >
                    {saveStatus === 'sending' ? 'Sending…' : 'Wire it to live data →'}
                  </button>
                  {saveStatus === 'error' && <p className="text-[#ff453a] text-sm text-center">Something went wrong — try again.</p>}
                </form>
              )}
            </div>
          </section>
        </>
      )}

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/onboard"  className="hover:text-white transition-colors">Full onboard</Link>
            <Link href="/answers"  className="hover:text-white transition-colors">Answers</Link>
            <Link href="/"         className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
