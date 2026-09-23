'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { INVOICE_UPLOAD_ACCEPT } from '@/lib/invoiceFileIntake';
import type { HonestyLabel } from '@/lib/oneSeatPublicWin';
import {
  CHAT_INTAKE_SLOTS,
  chatIntakeMap,
  chatReplyForLine,
  readChatIntakeLine,
  type ChatPaperMark,
  type ChatSlotId,
} from '@/lib/papersChatIntake';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

type ThreadLine = { id: string; text: string };

export function PapersChatIntake() {
  const [googleReady, setGoogleReady] = useState(false);
  const [marks, setMarks] = useState<Partial<Record<ChatSlotId, ChatPaperMark>>>({});
  const [draft, setDraft] = useState('');
  const [thread, setThread] = useState<ThreadLine[]>([
    {
      id: 'open',
      text: 'Gmail, then a photo, then this chat. I map what is still Missing. I do not invent dollars.',
    },
  ]);
  const [busy, setBusy] = useState(false);

  const rows = chatIntakeMap({ googleReady, marks });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/papers/readiness', { signal: AbortSignal.timeout(8000) });
        const data = (await res.json()) as { ready?: boolean; honesty?: HonestyLabel };
        if (!cancelled) setGoogleReady(Boolean(data.ready));
      } catch {
        if (!cancelled) setGoogleReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function push(text: string) {
    setThread((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, text }].slice(-12));
  }

  function nameSlot(id: ChatSlotId) {
    const next = { ...marks, [id]: 'named' as const };
    setMarks(next);
    const label = CHAT_INTAKE_SLOTS.find((slot) => slot.id === id)?.label ?? id;
    push(chatReplyForLine(label, chatIntakeMap({ googleReady, marks: next })));
  }

  function clearSlot(id: ChatSlotId) {
    const next = { ...marks, [id]: 'absent' as const };
    setMarks(next);
    const label = CHAT_INTAKE_SLOTS.find((slot) => slot.id === id)?.label ?? id;
    push(`${label} stays Missing. No invented $.`);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    push(text);
    const read = readChatIntakeLine(text);
    if (read.slot && read.slot !== 'google') {
      const next = {
        ...marks,
        [read.slot]: marks[read.slot] === 'parsed' ? 'parsed' as const : 'named' as const,
      };
      setMarks(next);
      push(chatReplyForLine(text, chatIntakeMap({ googleReady, marks: next })));
      return;
    }
    push(chatReplyForLine(text, chatIntakeMap({ googleReady, marks })));
  }

  async function onFile(slot: ChatSlotId, file: File) {
    setBusy(true);
    try {
      const body = new FormData();
      body.set('file', file);
      const res = await fetch('/api/one-seat/invoice-file', { method: 'POST', body });
      const data = (await res.json()) as { honesty?: HonestyLabel; note?: string; text?: string };
      const parsed = data.honesty === 'Estimated' && Boolean(data.text?.trim());
      const next = { ...marks, [slot]: parsed ? 'parsed' as const : 'named' as const };
      setMarks(next);
      push(data.note || 'File landed. Text is Missing. No invented $.');
    } catch {
      push('Missing — that file did not read. No invented $.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>GMAIL → PHOTO → CHAT</p>
      <h2>What is still Missing</h2>
      <p className={styles.note}>
        Naming a paper does not make it Verified. A parsed file is Estimated. A ready Google client is not a connected inbox. Papers stay Missing until Gmail connects. No invented $.
      </p>
      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.id}>
            <HonestyLegend active={row.honesty} note={`${row.label}. ${row.note}`} />
            {row.id !== 'google' ? (
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={() => nameSlot(row.id)}>
                  I have {row.label}
                </button>
                <button type="button" className={styles.ghost} onClick={() => clearSlot(row.id)}>
                  Still missing
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <form onSubmit={onSubmit} className={styles.grid}>
        <label>
          Name the paper you are holding
          <input
            className={styles.line}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Invoice, labor, menu, Z, or photo"
            maxLength={240}
          />
        </label>
        <button type="submit" className={styles.primary}>Map it</button>
      </form>
      <div className={styles.grid}>
        <label>
          Invoice PDF, CSV, or TXT
          <input
            className={styles.file}
            type="file"
            accept={INVOICE_UPLOAD_ACCEPT}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile('invoices', file);
            }}
          />
        </label>
        <label>
          Photo (HEIC stays Missing — no OCR)
          <input
            className={styles.file}
            type="file"
            accept={INVOICE_UPLOAD_ACCEPT}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile('photo', file);
            }}
          />
        </label>
      </div>
      <div aria-live="polite">
        {thread.map((line) => (
          <p className={styles.note} key={line.id}>{line.text}</p>
        ))}
      </div>
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.checkInvoices}>Compare two invoices</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.try}>Back to the sample walk</Link>
      </div>
    </div>
  );
}
