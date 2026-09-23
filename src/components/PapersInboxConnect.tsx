'use client';

import { useEffect, useState } from 'react';
import { papersIntakeCopy, type PapersHonesty } from '@/lib/papersInbox';

type PapersStatus = {
  ready?: boolean;
  honesty?: PapersHonesty;
  error?: string | null;
  missingSecrets?: string[];
  requiredEnv?: string[];
  connection?: { gmail: boolean; drive: boolean; email: string | null };
  folders?: Array<{ id: string; name: string; status: string; honesty: PapersHonesty }>;
  nextAction?: string;
};

function missingGoogleLine(status: Pick<PapersStatus, 'error' | 'missingSecrets' | 'requiredEnv'>): string {
  const names = status.missingSecrets?.length
    ? status.missingSecrets
    : status.requiredEnv?.length
      ? status.requiredEnv
      : ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  return status.error
    ? `${status.error} Need: ${names.join(', ')}.`
    : `Missing — ${names.join(', ')} are not on this deploy. No homework form. No invented papers.`;
}

export function PapersInboxConnect({
  onPulled,
  variant = 'seat',
}: {
  onPulled?: (line: string) => void;
  variant?: 'seat' | 'claim';
}) {
  const copy = papersIntakeCopy();
  const [status, setStatus] = useState<PapersStatus>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const papers = params.get('papers');
    void (async () => {
      try {
        const res = await fetch('/api/papers/status', { method: 'GET', signal: AbortSignal.timeout(8000) });
        const body = (await res.json()) as PapersStatus;
        if (cancelled) return;
        setStatus(body);
        if (!body.ready || papers === 'closed' || papers === 'token') {
          setLine(missingGoogleLine(body));
        } else if (papers === 'connected' && (body.connection?.gmail || body.connection?.drive)) {
          setLine('Gmail + Drive connected. Pulling last-week invoices…');
          setBusy(true);
          try {
            const pullRes = await fetch('/api/papers/pull', { method: 'POST', signal: AbortSignal.timeout(20000) });
            const pullBody = (await pullRes.json()) as {
              nextAction?: string;
              honesty?: PapersHonesty;
              error?: string;
              missingSecrets?: string[];
              requiredEnv?: string[];
            };
            if (cancelled) return;
            if (!pullRes.ok) {
              setLine(missingGoogleLine(pullBody));
            } else {
              setLine(pullBody.nextAction ?? 'Gmail + Drive connected. Last-week pull finished.');
              if (pullBody.honesty) setStatus((prev) => ({ ...prev, honesty: pullBody.honesty }));
              if (pullBody.nextAction) onPulled?.(pullBody.nextAction);
            }
          } catch {
            if (!cancelled) setLine('Connected. Pull missed — tap Pull last-week invoices. No invented $.');
          } finally {
            if (!cancelled) setBusy(false);
          }
        } else if (papers === 'connected') {
          setLine('Gmail + Drive connected. Pull last-week invoices when you are ready.');
        }
      } catch {
        if (!cancelled) {
          const closed = {
            ready: false,
            honesty: 'Missing' as const,
            error: 'Missing — papers status did not load. No invented files.',
            missingSecrets: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
            requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
          };
          setStatus(closed);
          setLine(missingGoogleLine(closed));
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // onPulled is optional parent flash only — do not re-run Connect/status on parent render.
  }, []);

  const ready = Boolean(status.ready);
  const honesty: PapersHonesty = status.honesty ?? (ready ? 'Estimated' : 'Missing');
  const connected = Boolean(status.connection?.gmail || status.connection?.drive);
  const missingSecrets = status.missingSecrets ?? [];

  async function connectGoogle() {
    if (!ready) {
      setLine(missingGoogleLine(status));
      return;
    }
    setBusy(true);
    setLine(null);
    try {
      const res = await fetch('/api/papers/google/start', { method: 'POST' });
      const body = (await res.json()) as {
        success?: boolean;
        authorizationUrl?: string;
        error?: string;
        missingSecrets?: string[];
      };
      if (!res.ok || !body.authorizationUrl) {
        setLine(missingGoogleLine({
          error: body.error,
          missingSecrets: body.missingSecrets,
          requiredEnv: missingSecrets.length ? missingSecrets : ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
        }));
        return;
      }
      window.location.assign(body.authorizationUrl);
    } catch {
      setLine('Missing — Gmail did not open. Add a photo instead.');
    } finally {
      setBusy(false);
    }
  }

  async function pullPapers() {
    if (!ready) {
      setLine(missingGoogleLine(status));
      return;
    }
    setBusy(true);
    setLine('Going to get last-week invoices…');
    try {
      const res = await fetch('/api/papers/pull', { method: 'POST', signal: AbortSignal.timeout(20000) });
      const body = (await res.json()) as { success?: boolean; nextAction?: string; honesty?: PapersHonesty };
      const next = body.nextAction ?? 'No last-week paper matched.';
      setLine(next);
      if (body.honesty) setStatus((prev) => ({ ...prev, honesty: body.honesty }));
      onPulled?.(next);
    } catch {
      setLine('Pull missed. Snap the paper instead. No invented $.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      id="papers-settings"
      className={`owner-seat-papers ${variant === 'claim' ? 'is-claim' : ''}`}
      aria-label="Go get last-week papers"
    >
      <p className="owner-desk-kicker">Papers in</p>
      <p className={`owner-seat-honesty is-${honesty.toLowerCase()}`} role="status">
        {honesty}
      </p>
      <h2 className="owner-seat-papers-title">{copy.headline}</h2>
      <p className="owner-desk-poetry">{copy.promise}</p>
      {!loaded ? (
        <p className="owner-seat-papers-outlook">Checking Google papers…</p>
      ) : !ready ? (
        <p className="owner-seat-receipt" role="status">
          {missingGoogleLine(status)}
        </p>
      ) : connected && status.connection?.email ? (
        <p className="owner-seat-papers-outlook">Connected as {status.connection.email}</p>
      ) : null}
      <div className="owner-seat-papers-actions">
        <button
          type="button"
          className="owner-desk-primary"
          disabled={busy || !ready}
          onClick={() => void connectGoogle()}
        >
          {busy && ready ? 'Opening…' : 'Connect Gmail'}
        </button>
        <button
          type="button"
          className="owner-desk-secondary"
          disabled={busy || !ready}
          onClick={() => void connectGoogle()}
        >
          Connect Drive
        </button>
        {connected && ready ? (
          <button type="button" className="owner-desk-secondary" disabled={busy} onClick={() => void pullPapers()}>
            Pull last-week invoices
          </button>
        ) : null}
      </div>
      {status.folders?.length ? (
        <ul className="owner-seat-papers-folders">
          {status.folders.map((folder) => (
            <li key={folder.id}>
              <span>{folder.name}</span>
              <span className={`owner-seat-honesty is-${folder.honesty.toLowerCase()}`}>{folder.honesty}</span>
              <span>{folder.status}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="owner-seat-papers-outlook">{copy.outlook}</p>
      <p className="owner-seat-papers-outlook">
        <a href="/chat">Chat maps what is still Missing</a>
      </p>
      {line ? (
        <p className="owner-seat-receipt" role="status" aria-live="polite">
          {line}
        </p>
      ) : null}
    </article>
  );
}
