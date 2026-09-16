import type { Metadata } from 'next';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { GOLD_LABOR } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Try the labor drift sample | Never86’d One Seat',
  description: 'Fictional schedule vs clock sample. 1.50 extra hours. Not recovered cash.',
  alternates: { canonical: 'https://www.never86.ai/try/labor' },
};

export default function TryLaborPage() {
  return (
    <OneSeatPublicShell
      eyebrow="ACTION SHIFT · LABOR SAMPLE"
      title="The shift ran long. Here is the hour, not a guess."
      lede="Compare the posted schedule with the time clock. Missing punch stays Missing. This card is a fictional sample."
    >
      <article className={styles.card}>
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
          active="Estimated"
          note="Estimated fictional sample. A missing punch stays Missing. Matching live clock and schedule become Verified."
        />
        <div className={styles.next}>
          <small>YOUR NEXT MOVE</small>
          <p>{GOLD_LABOR.nextMove}</p>
        </div>
        <p className={styles.note}>{GOLD_LABOR.claimBoundary}</p>
      </article>
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.checkLabor}>Check your labor papers</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
      </div>
    </OneSeatPublicShell>
  );
}
