'use client';

import { useState } from 'react';
import { GOLD_CURRENT_INVOICE_CSV, GOLD_PRIOR_INVOICE_CSV } from '@/lib/oneSeatPublicWin';
import { oneSeatStyles as styles } from './OneSeatPublicShell';

type CompareResponse = {
  success: boolean;
  error?: string;
  result?: {
    summary: string;
    morningActions: Array<{ title: string; move: string; evidence: string; claimBoundary: string }>;
    missingEvidence: string[];
  };
};

export function InvoiceCompareClient() {
  const [prior, setPrior] = useState(GOLD_PRIOR_INVOICE_CSV);
  const [current, setCurrent] = useState(GOLD_CURRENT_INVOICE_CSV);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [actions, setActions] = useState<CompareResponse['result'] | null>(null);
  const [explain, setExplain] = useState('');

  async function runCompare() {
    setStatus('loading');
    setMessage('');
    setExplain('');
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
        Native CSV or invoice text. Same SKU and pack. Missing prior stays Missing — not $0.
        Grok can explain the card when <code>XAI_API_KEY</code> is set. It does not invent the dollars.
      </p>
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
      </div>
      {status === 'error' ? <p className={styles.note}>{message}</p> : null}
      {actions ? (
        <div>
          <p>{actions.summary}</p>
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
