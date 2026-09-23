import type { Metadata } from 'next';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { GOLD_LABOR } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Check labor drift | Never86’d One Seat',
  description: 'Compare scheduled hours with the time clock. Sample 1.50 h is fictional. First owner seat free.',
  alternates: { canonical: 'https://www.never86.ai/check/labor' },
};

export default function CheckLaborPage() {
  return (
    <OneSeatPublicShell
      eyebrow="ONE SEAT · LABOR DRIFT"
      title="Why did the shift run over?"
      lede="Compare the posted schedule with the matching time clock. Punch ≠ schedule. Missing clock stays Missing. Operators stay on never86.ai."
    >
      <article className={styles.card}>
        <p className={styles.eyebrow}>FICTIONAL SAMPLE</p>
        <div className={styles.prices}>
          <div><small>Scheduled</small><strong>{GOLD_LABOR.scheduledHours.toFixed(2)} h</strong></div>
          <span>→</span>
          <div><small>Clocked</small><strong>{GOLD_LABOR.clockedHours.toFixed(2)} h</strong></div>
        </div>
        <div className={styles.delta}>
          <strong>+{GOLD_LABOR.driftHours.toFixed(2)} h</strong>
          <b>sample ${GOLD_LABOR.sampleDollars}</b>
        </div>
        <HonestyLegend
          demo
          active="Estimated"
          note="Demo · Estimated. Fictional sample hours and dollars. A missing punch stays Missing — not $0."
        />
        <div className={styles.next}>
          <small>YOUR NEXT MOVE</small>
          <p>{GOLD_LABOR.nextMove}</p>
        </div>
        <p className={styles.note}>{GOLD_LABOR.claimBoundary}</p>
      </article>
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.operator}>Open the owner seat</Link>
      </div>
    </OneSeatPublicShell>
  );
}
