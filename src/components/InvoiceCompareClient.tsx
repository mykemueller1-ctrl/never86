'use client';

import { useState } from 'react';
import { HonestyLegend } from '@/components/HonestyLegend';
import {
  GOLD_CURRENT_INVOICE_CSV,
  GOLD_PRIOR_INVOICE_CSV,
  GOLD_SAMPLE_HONESTY_NOTE,
  isGoldSampleInvoices,
  money,
  type HonestyLabel,
} from '@/lib/oneSeatPublicWin';
import { INVOICE_UPLOAD_ACCEPT } from '@/lib/invoiceFileIntake';
import { oneSeatStyles as styles } from './OneSeatPublicShell';

type CompareRow = {
  sku: string;
  vendor: string;
  description: string;
  priorPrice: number | null;
  currentPrice: number | null;
  dollarsObserved: number | null;
  flagged: boolean;
  honesty: HonestyLabel;
  missingEvidence: string | null;
};

type CompareResponse = {
  success: boolean;
  error?: string;
  disclosedSample?: boolean;
  result?: {
    summary: string;
    morningActions: Array<{ title: string; move: string; evidence: string; claimBoundary: string }>;
    missingEvidence: string[];
  };
  compare?: { rows: CompareRow[] };
};

export function InvoiceCompareClient() {
  const [prior, setPrior] = useState(GOLD_PRIOR_INVOICE_CSV);
  const [current, setCurrent] = useState(GOLD_CURRENT_INVOICE_CSV);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [actions, setActions] = useState<CompareResponse['result'] | null>(null);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [disclosedSample, setDisclosedSample] = useState(false);
  const [explain, setExplain] = useState('');
  const [papersHonesty, setPapersHonesty] = useState<HonestyLabel | null>(null);
  const [papersNote, setPapersNote] = useState('');
  const [priorName, setPriorName] = useState('prior.csv');
  const [currentName, setCurrentName] = useState('current.csv');
  const [priorFile, setPriorFile] = useState<{ honesty: HonestyLabel; note: string } | null>(null);
  const [currentFile, setCurrentFile] = useState<{ honesty: HonestyLabel; note: string } | null>(null);

  async function ingestFile(slot: 'prior' | 'current', file: File) {
    setStatus('loading');
    setMessage('');
    try {
      const body = new FormData();
      body.set('file', file);
      const persist = new FormData();
      persist.set('file', file);
      void fetch('/api/papers/upload', { method: 'POST', body: persist });
      const res = await fetch('/api/one-seat/invoice-file', { method: 'POST', body });
      const data = (await res.json()) as {
        honesty?: HonestyLabel;
        note?: string;
        text?: string;
        filename?: string;
        error?: string;
      };
      const honesty: HonestyLabel = data.honesty === 'Estimated' ? 'Estimated' : 'Missing';
      const note = data.note || data.error || 'Invoice text is Missing. No invented $.';
      const landed = { honesty, note };
      if (slot === 'prior') {
        setPriorFile(landed);
        setPriorName(data.filename || file.name || 'prior');
        setPrior(honesty === 'Estimated' && data.text?.trim() ? data.text : '');
      } else {
        setCurrentFile(landed);
        setCurrentName(data.filename || file.name || 'current');
        setCurrent(honesty === 'Estimated' && data.text?.trim() ? data.text : '');
      }
      setStatus('idle');
    } catch {
      const landed = { honesty: 'Missing' as const, note: 'Missing — that file did not read. No invented $.' };
      if (slot === 'prior') setPriorFile(landed);
      else setCurrentFile(landed);
      setStatus('error');
      setMessage(landed.note);
    }
  }

  async function loadFromPapers() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/papers/invoices', { method: 'POST', signal: AbortSignal.timeout(20000) });
      const data = (await res.json()) as {
        success?: boolean;
        honesty?: HonestyLabel;
        error?: string | null;
        code?: string;
        missingSecrets?: string[];
        requiredEnv?: string[];
        documents?: Array<{ text: string; filename: string }>;
        invoices?: Array<{ text: string; filename: string; note?: string }>;
      };
      const honesty = data.honesty ?? 'Missing';
      setPapersHonesty(honesty);
      const names = data.missingSecrets?.length
        ? data.missingSecrets
        : data.requiredEnv?.length
          ? data.requiredEnv
          : ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
      if (!res.ok || data.code === 'papers_google_closed' || data.error) {
        setStatus('error');
        const note = `Missing — ${names.join(', ')} are not on this deploy. No invented $.`;
        setPapersNote(data.error ? `${data.error} Need: ${names.join(', ')}.` : note);
        setMessage(data.error || note);
        return;
      }
      const docs = data.documents?.filter((doc) => doc.text.trim()) ?? [];
      if (docs.length >= 2) {
        setPrior(docs[0].text);
        setCurrent(docs[1].text);
        setPapersNote('Loaded two invoices from connected papers. Compare uses formulas, not invented $.');
      } else if (docs.length === 1) {
        setCurrent(docs[0].text);
        setPapersNote('One invoice loaded. Prior stays Missing — not $0.');
      } else if (data.invoices?.[0]) {
        setCurrent(data.invoices[0].text);
        setPapersNote(data.invoices[0].note || 'Invoice landed. Second paper is Missing.');
      } else {
        setPapersHonesty('Missing');
        setPapersNote('Missing — Gmail is not connected. No invoice PDF matched. Drop a PDF above, or a photo in chat. No invented $.');
      }
      setStatus('idle');
    } catch {
      setStatus('error');
      setPapersHonesty('Missing');
      setPapersNote('Missing — papers invoice load failed. No invented $.');
      setMessage('Missing — could not load connected papers.');
    }
  }

  async function runCompare() {
    setStatus('loading');
    setMessage('');
    setExplain('');
    setRows([]);
    setDisclosedSample(false);
    try {
      const res = await fetch('/api/one-seat/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: 'Your store',
          documents: [
            { text: prior, filename: priorName },
            { text: current, filename: currentName },
          ],
        }),
      });
      const data = (await res.json()) as CompareResponse;
      if (!res.ok || !data.success || !data.result) {
        throw new Error(data.error || 'Could not compare those invoices.');
      }
      setActions(data.result);
      setRows(data.compare?.rows ?? []);
      setDisclosedSample(Boolean(data.disclosedSample));
      setStatus('done');
      const first = data.result.morningActions[0];
      if (first) {
        const explained = await fetch('/api/one-seat/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fact: first.evidence,
            nextMove: first.move,
            claimBoundary: first.claimBoundary,
          }),
        });
        const voice = (await explained.json()) as { text?: string };
        if (voice.text) setExplain(voice.text);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Could not compare those invoices.');
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>YOUR PAPERS · FORMULAS FIRST</p>
      <h2>Paste two invoices, or drop a PDF or CSV.</h2>
      <p className={styles.note}>
        Native CSV, TXT, or invoice PDF text. HEIC photos stay Missing — no OCR, no invented $. Same SKU and pack. Missing prior stays Missing — not $0.
        The boxes below start with a fictional demo. Gmail is not connected on this page.
        Grok can explain the card when <code>XAI_API_KEY</code> is set. It does not invent the dollars.
      </p>
      {isGoldSampleInvoices(prior, current) ? (
        <HonestyLegend demo active="Estimated" note={GOLD_SAMPLE_HONESTY_NOTE} />
      ) : null}
      {papersHonesty ? <HonestyLegend active={papersHonesty} note={papersNote} /> : null}
      <div className={styles.grid}>
        <label>
          Prior invoice
          <input
            className={styles.file}
            type="file"
            accept={INVOICE_UPLOAD_ACCEPT}
            aria-label="Prior invoice file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void ingestFile('prior', file);
            }}
          />
          <textarea className={styles.area} value={prior} onChange={(e) => setPrior(e.target.value)} />
          {priorFile ? <HonestyLegend active={priorFile.honesty} note={priorFile.note} /> : null}
        </label>
        <label>
          Current invoice
          <input
            className={styles.file}
            type="file"
            accept={INVOICE_UPLOAD_ACCEPT}
            aria-label="Current invoice file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void ingestFile('current', file);
            }}
          />
          <textarea className={styles.area} value={current} onChange={(e) => setCurrent(e.target.value)} />
          {currentFile ? <HonestyLegend active={currentFile.honesty} note={currentFile.note} /> : null}
        </label>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => void runCompare()} disabled={status === 'loading'}>
          {status === 'loading' ? 'Comparing…' : 'Compare these two'}
        </button>
        <button type="button" className={styles.secondary} onClick={() => void loadFromPapers()} disabled={status === 'loading'}>
          Load from connected papers
        </button>
      </div>
      {status === 'error' ? <p className={styles.note}>{message}</p> : null}
      {actions ? (
        <div>
          <p>{actions.summary}</p>
          {disclosedSample ? <HonestyLegend demo active="Estimated" note={GOLD_SAMPLE_HONESTY_NOTE} /> : null}
          {rows.map((row) => {
            const demoRow = disclosedSample || isGoldSampleInvoices(prior, current);
            const honesty: HonestyLabel = demoRow ? 'Estimated' : row.honesty;
            return (
            <div className={styles.next} key={`${row.vendor}-${row.sku}`}>
              <HonestyLegend
                demo={demoRow}
                active={honesty}
                note={
                  demoRow
                    ? 'Demo · Estimated. Fictional sample. Not a live store. Not recovered cash.'
                    : honesty === 'Missing'
                    ? (row.missingEvidence || 'Prior invoice is Missing. That is not $0.')
                    : honesty === 'Estimated'
                      ? 'Estimated from the papers on this compare. Not invented dollars.'
                      : `${row.vendor} ${row.sku} is Verified from the two matching invoices. A price increase is not recovered cash.`
                }
              />
              <p>
                {row.sku} · {row.description || row.vendor}
                {row.priorPrice != null && row.currentPrice != null
                  ? ` · ${money(row.priorPrice)} → ${money(row.currentPrice)}`
                  : ' · no invented $'}
                {row.flagged && row.dollarsObserved != null ? ` · +${money(row.dollarsObserved)}` : ''}
              </p>
            </div>
            );
          })}
          {actions.morningActions.map((action) => (
            <div className={styles.next} key={action.title}>
              <small>ONE NEXT MOVE</small>
              <p>{action.title}</p>
              <p>{action.move}</p>
              <p className={styles.note}>{action.evidence}</p>
              <p className={styles.note}>{action.claimBoundary}</p>
            </div>
          ))}
          {explain ? <p className={styles.note}>{explain}</p> : null}
          {actions.missingEvidence.length ? (
            <ul className={styles.list}>
              {actions.missingEvidence.map((line) => <li key={line}>{line}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
