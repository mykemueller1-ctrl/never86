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
        const names = data.missingSecrets?.length
          ? data.missingSecrets.join(', ')
          : 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET';
        setHonesty('Missing');
        setNote(
          data.ready
            ? 'Google client is ready. Gmail is not connected on this page. Papers stay Missing until a pull lands. No invented $.'
            : (data.error || `Missing — ${names} are not on this deploy. No invented papers.`),
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
