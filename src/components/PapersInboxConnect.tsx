'use client';

import { useEffect, useState } from 'react';
import { papersIntakeCopy } from '@/lib/papersInbox';

type PapersStatus = {
  ready?: boolean;
  error?: string | null;
  connection?: { gmail: boolean; drive: boolean; email: string | null };
  nextAction?: string;
};

export function PapersInboxConnect({ onPulled }: { onPulled?: (line: string) => void }) {
  const copy = papersIntakeCopy();
  const [status, setStatus] = useState<PapersStatus>({});
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/papers/status', { method: 'GET' });
        const body = (await res.json()) as PapersStatus;
        if (!cancelled && res.ok) setStatus(body);
      } catch {
        /* unsigned seat stays quiet */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function connectGoogle() {
    setBusy(true);
    setLine(null);
    try {
      const res = await fetch('/api/papers/google/start', { method: 'POST' });
      const body = (await res.json()) as { success?: boolean; authorizationUrl?: string; error?: string };
      if (!res.ok || !body.authorizationUrl) {
        setLine(body.error ?? status.error ?? 'Gmail stays off until Google is connected.');
        return;
      }
      window.location.assign(body.authorizationUrl);
    } catch {
      setLine('Gmail did not open. Add a photo instead.');
    } finally {
      setBusy(false);
    }
  }

  async function pullPapers() {
    setBusy(true);
    setLine('Going to get last-week papers…');
    try {
      const res = await fetch('/api/papers/pull', { method: 'POST' });
      const body = (await res.json()) as { success?: boolean; nextAction?: string; landed?: string[] };
      const next = body.nextAction ?? 'No last-week paper matched.';
      setLine(next);
      onPulled?.(next);
    } catch {
      setLine('Pull missed. Snap the paper instead.');
    } finally {
      setBusy(false);
    }
  }

  const connected = Boolean(status.connection?.gmail || status.connection?.drive);

  return (
    <article className="owner-seat-papers" aria-label="Go get last-week papers">
      <p className="owner-desk-kicker">Papers in</p>
      <h2 className="owner-seat-papers-title">{copy.headline}</h2>
      <p className="owner-desk-poetry">{copy.promise}</p>
      <div className="owner-seat-papers-actions">
        <button type="button" className="owner-desk-primary" disabled={busy} onClick={() => void connectGoogle()}>
          {busy ? 'Opening…' : 'Connect Gmail'}
        </button>
        <button type="button" className="owner-desk-secondary" disabled={busy} onClick={() => void connectGoogle()}>
          Connect Drive
        </button>
        {connected ? (
          <button type="button" className="owner-desk-secondary" disabled={busy} onClick={() => void pullPapers()}>
            Pull last week
          </button>
        ) : null}
      </div>
      <p className="owner-seat-papers-outlook">{copy.outlook}</p>
      {line ? (
        <p className="owner-seat-receipt" role="status" aria-live="polite">
          {line}
        </p>
      ) : null}
    </article>
  );
}
