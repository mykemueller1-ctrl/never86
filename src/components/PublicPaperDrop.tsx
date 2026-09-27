'use client';

import { useState } from 'react';
import { HonestyLegend } from '@/components/HonestyLegend';
import { oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { INVOICE_UPLOAD_ACCEPT } from '@/lib/invoiceFileIntake';
import type { HonestyLabel } from '@/lib/oneSeatPublicWin';

export function PublicPaperDrop({ label }: { label: string }) {
  const [honesty, setHonesty] = useState<HonestyLabel | null>(null);
  const [note, setNote] = useState('');

  async function onChange(list: FileList | null) {
    const files = Array.from(list ?? []).filter((file) => file.size > 0);
    if (!files.length) return;
    const body = new FormData();
    for (const file of files) body.append('files', file);
    try {
      const res = await fetch('/api/papers/upload', { method: 'POST', body });
      const data = (await res.json()) as { honesty?: HonestyLabel; note?: string };
      const next: HonestyLabel = data.honesty === 'Verified' || data.honesty === 'Estimated' ? data.honesty : 'Missing';
      setHonesty(next);
      setNote(
        `${data.note || 'File landed.'} Files dropped here without signing in are saved on the server for this browser. Sign in to keep them on your owner account.`,
      );
    } catch {
      setHonesty('Missing');
      setNote('That file did not land. Missing stays Missing. No invented $.');
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>YOUR PAPER</p>
      <label>
        {label}
        <input
          className={styles.file}
          type="file"
          accept={INVOICE_UPLOAD_ACCEPT}
          multiple
          aria-label={label}
          onChange={(event) => void onChange(event.target.files)}
        />
      </label>
      <p className={styles.note}>
        You can add more than one file, including JPG and PNG. A photo with no readable text stays Missing.
      </p>
      {honesty ? <HonestyLegend active={honesty} note={note} /> : null}
    </div>
  );
}
