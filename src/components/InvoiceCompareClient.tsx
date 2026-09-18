'use client';

import { useState } from 'react';
import { HonestyLegend } from '@/components/HonestyLegend';
import {
  GOLD_CURRENT_INVOICE_CSV,
  GOLD_PRIOR_INVOICE_CSV,
  GOLD_SAMPLE_HONESTY_NOTE,
  money,
  type HonestyLabel,
} from '@/lib/oneSeatPublicWin';
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

  async function loadFromPapers() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/papers/invoices', { method: 'GET', signal: AbortSignal.timeout(8000) });
      const data = (await res.json()) as {
        success?: boolean;
        honesty?: HonestyLabel;
        error?: string | null;
        missingSecrets?: string[];
        documents?: Array<{ text: string; filename: string }>;
        invoices?: Array<{ text: string; filename: string; note?: string }>;
      };
      const honesty = data.honesty ?? 'Missing';
      setPapersHonesty(honesty);
      if (!res.ok || data.error) {
        setStatus('error');
        setPapersNote(
          data.error
            ?? (data.missingSecrets?.length
              ? `Missing — ${data.missingSecrets.join(', ')} are not on this deploy.`
              : 'Missing — Connect Gmail + Drive first.'),
        );
        setMessage(data.error || 'Missing — papers are not connected.');
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
        setPapersNote('Missing — no invoice PDFs matched on this seat. Connect Gmail + Drive, then pull.');
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
            { text: prior, filename: 'prior.csv' },
            { text: current, filename: 'current.csv' },
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
      <h2>Paste two invoices from the same vendor.</h2>
      <p className={styles.note}>
        Native CSV or invoice PDF text. Same SKU and pack. Missing prior stays Missing — not $0.
        Connect Gmail + Drive on the owner seat, then load the last two invoices. No homework form.
        Grok can explain the card when <code>XAI_API_KEY</code> is set. It does not invent the dollars.
      </p>
      {papersHonesty ? <HonestyLegend active={papersHonesty} note={papersNote} /> : null}
      <div className={styles.grid}>
        <label>
          Prior invoice
          <textarea className={styles.area} value={prior} onChange={(e) => setPrior(e.target.value)} />
        </label>
        <label>
          Current invoice
          <textarea className={styles.area} value={current} onChange={(e) => setCurrent(e.target.value)} />
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
          {disclosedSample ? <HonestyLegend active="Estimated" note={GOLD_SAMPLE_HONESTY_NOTE} /> : null}
          {rows.map((row) => (
            <div className={styles.next} key={`${row.vendor}-${row.sku}`}>
              <HonestyLegend
                active={row.honesty}
                note={
                  row.honesty === 'Missing'
                    ? (row.missingEvidence || 'Prior invoice is Missing. That is not $0.')
                    : row.honesty === 'Estimated'
                      ? 'Estimated from partial or disclosed sample papers. Not invented dollars.'
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
          ))}
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
