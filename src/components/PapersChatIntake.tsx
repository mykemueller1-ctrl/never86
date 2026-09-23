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

function FileDrops({
  busy,
  onFile,
}: {
  busy: boolean;
  onFile: (slot: ChatSlotId, file: File) => void;
}) {
  return (
    <div className={styles.grid} id="photo">
      <label>
        Photo (HEIC stays Missing — no OCR)
        <input
          className={styles.file}
          type="file"
          accept={INVOICE_UPLOAD_ACCEPT}
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile('photo', file);
          }}
        />
      </label>
      <label>
        Invoice PDF, CSV, or TXT
        <input
          className={styles.file}
          type="file"
          accept={INVOICE_UPLOAD_ACCEPT}
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile('invoices', file);
          }}
        />
      </label>
    </div>
  );
}

export function PapersChatIntake() {
  const [googleReady, setGoogleReady] = useState(false);
  const [marks, setMarks] = useState<Partial<Record<ChatSlotId, ChatPaperMark>>>({});
  const [draft, setDraft] = useState('');
  const [fileFirst, setFileFirst] = useState(true);
  const [thread, setThread] = useState<ThreadLine[]>([
    {
      id: 'open',
      text: 'Gmail is not connected. Drop a photo or a PDF, or name the paper here. Folders stay Missing. No invented $.',
    },
  ]);
  const [busy, setBusy] = useState(false);

  const rows = chatIntakeMap({ googleReady, marks });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/papers/readiness', { signal: AbortSignal.timeout(8000) });
        const data = (await res.json()) as {
          ready?: boolean;
          connection?: { gmail?: boolean; drive?: boolean };
        };
        if (!cancelled) {
          setGoogleReady(Boolean(data.ready));
          setFileFirst(!(data.connection?.gmail === true || data.connection?.drive === true));
        }
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
    void fetch('/api/papers/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
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
      const path = slot === 'photo' ? '/api/papers/photo' : '/api/papers/upload';
      const res = await fetch(path, { method: 'POST', body });
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
      <p className={styles.eyebrow}>{fileFirst ? 'PHOTO → PDF → CHAT' : 'GMAIL → PHOTO → CHAT'}</p>
      <h2>What is still Missing</h2>
      <p className={styles.note}>
        {fileFirst
          ? 'Gmail is not connected. Drive is not connected. A photo, a PDF, or this chat is the paper. A named paper stays Missing. No invented $.'
          : 'Naming a paper does not make it Verified. A parsed file is Estimated. Each folder stays Missing until a file lands. No invented $.'}
      </p>
      {fileFirst ? <FileDrops busy={busy} onFile={onFile} /> : null}
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
      {fileFirst ? null : <FileDrops busy={busy} onFile={onFile} />}
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
