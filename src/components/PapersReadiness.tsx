'use client';

import { useEffect, useState } from 'react';
import { HonestyLegend } from '@/components/HonestyLegend';
import type { HonestyLabel } from '@/lib/oneSeatPublicWin';

type Readiness = {
  honesty?: HonestyLabel;
  error?: string | null;
  missingSecrets?: string[];
  ready?: boolean;
};

export function PapersReadiness({ heading = 'Google papers' }: { heading?: string }) {
  const [honesty, setHonesty] = useState<HonestyLabel>('Missing');
  const [note, setNote] = useState('Checking whether Gmail can open…');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/papers/readiness', { signal: AbortSignal.timeout(8000) });
        const data = (await res.json()) as Readiness;
        if (cancelled) return;
        const label: HonestyLabel = data.honesty === 'Estimated' ? 'Estimated' : 'Missing';
        const names = data.missingSecrets?.length
          ? data.missingSecrets.join(', ')
          : 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET';
        setHonesty(label);
        setNote(
          label === 'Missing'
            ? (data.error || `Missing — ${names} are not on this deploy. No invented papers.`)
            : 'Google client is present. This page does not pull mail. Papers are not Verified until an owner connects. No invented $.',
        );
      } catch {
        if (!cancelled) {
          setHonesty('Missing');
          setNote('Missing — papers readiness did not load. No invented papers.');
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
    </article>
  );
}
