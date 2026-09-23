'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import type { HonestyLabel } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

type Folder = { id?: string; name: string; honesty?: HonestyLabel; status?: string };

type Readiness = {
  honesty?: HonestyLabel;
  error?: string | null;
  missingSecrets?: string[];
  ready?: boolean;
  note?: string;
  connection?: { gmail?: boolean; drive?: boolean };
  lead?: string[];
  folders?: Folder[];
};

const FILE_LINKS: Record<string, { href: string; label: string }> = {
  photo: { href: `${ONE_SEAT_PATHS.chat}#photo`, label: 'Drop a photo' },
  pdf: { href: ONE_SEAT_PATHS.checkInvoices, label: 'Drop a PDF' },
  chat: { href: ONE_SEAT_PATHS.chat, label: 'Chat maps what is still Missing' },
};

export function PapersReadiness({ heading = 'Google papers' }: { heading?: string }) {
  const [honesty, setHonesty] = useState<HonestyLabel>('Missing');
  const [note, setNote] = useState('Checking papers. Gmail is not connected until a pull lands.');
  const [lead, setLead] = useState<string[]>(['photo', 'pdf', 'chat']);
  const [folders, setFolders] = useState<Folder[]>([
    { name: 'Invoices' },
    { name: 'Z-EOD' },
    { name: 'Labor' },
    { name: 'Liquor-Beer' },
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/papers/readiness', { signal: AbortSignal.timeout(8000) });
        const data = (await res.json()) as Readiness;
        if (cancelled) return;
        const gmail = data.connection?.gmail === true;
        const drive = data.connection?.drive === true;
        const names = data.missingSecrets?.length
          ? data.missingSecrets.join(', ')
          : 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET';
        setHonesty('Missing');
        setLead(gmail || drive ? ['gmail', 'photo', 'pdf', 'chat'] : (data.lead?.length ? data.lead : ['photo', 'pdf', 'chat']));
        setFolders(data.folders?.length ? data.folders : [
          { name: 'Invoices' },
          { name: 'Z-EOD' },
          { name: 'Labor' },
          { name: 'Liquor-Beer' },
        ]);
        setNote(
          gmail || drive
            ? 'Each folder stays Missing until a file lands in it. No invented $.'
            : (data.note || data.error || `Missing — ${names} are not on this deploy. Gmail is not connected. Drop a photo, a PDF, or use chat.`),
        );
      } catch {
        if (!cancelled) {
          setHonesty('Missing');
          setNote('Missing — papers readiness did not load. Gmail is not connected. Drop a photo, a PDF, or use chat.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <article aria-label="Google papers readiness">
      <h2>{heading}</h2>
      <HonestyLegend active={honesty} note={note} />
      <p className={styles.note}>Photo, PDF, and chat are the papers while Gmail and Drive are off.</p>
      <div className={styles.actions}>
        {lead.filter((step) => step !== 'gmail').map((step) => {
          const link = FILE_LINKS[step];
          if (!link) return null;
          return (
            <Link key={step} className={step === 'pdf' ? styles.primary : styles.secondary} href={link.href}>
              {link.label}
            </Link>
          );
        })}
      </div>
      <ul className={styles.list}>
        {folders.map((folder) => (
          <li key={folder.id || folder.name}>
            {folder.name} — Missing
          </li>
        ))}
      </ul>
    </article>
  );
}
