import type { Metadata } from 'next';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { POS_CAPTURE } from '@/lib/captureLandings';
import { ONE_SEAT_CLAIM, ONE_SEAT_ICP } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: `${POS_CAPTURE.title} | Never86’d One Seat`,
  description: POS_CAPTURE.description,
  alternates: { canonical: POS_CAPTURE.canonical },
  openGraph: {
    title: POS_CAPTURE.title,
    description: POS_CAPTURE.description,
    url: POS_CAPTURE.canonical,
  },
};

export default function RestaurantPosAlternativePage() {
  return (
    <OneSeatPublicShell eyebrow={POS_CAPTURE.eyebrow} title={POS_CAPTURE.title} lede={POS_CAPTURE.geo}>
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.try}>
          Try the sample check
        </Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.onboard}>
          Claim free owner seat
        </Link>
      </div>

      <article className={styles.card}>
        <p className={styles.eyebrow}>POS PAIN IN THEIR MOUTH</p>
        <h2>The floor still runs on Toast, Aloha, or PDQ. The leak is in the papers.</h2>
        <p className={styles.note}>
          Another tab will not close last night. You already have a close, a CSV, or a paper Z.
          Keep that POS. Export-first. One Seat names the next move for {ONE_SEAT_ICP}.
        </p>
        <HonestyLegend
          active="Missing"
          note="No export yet stays Missing — not an invented close. A disclosed sample stays Estimated. Matching live papers become Verified."
        />
        <div className={styles.next}>
          <small>ONE NEXT MOVE</small>
          <p>Drop the export or paper you already have. We label the evidence and name one action for tonight.</p>
        </div>
        <p className={styles.note}>{ONE_SEAT_CLAIM} This is free One Seat, not a second operating system.</p>
      </article>

      <article className={styles.card}>
        <p className={styles.eyebrow}>KEEP THE POS · EXPORT-FIRST</p>
        <ul className={styles.list}>
          <li>Toast, Aloha, and PDQ stay on the floor. POS proves what the restaurant recorded.</li>
          <li>POS is not marketplace payout, not invoice COGS, and not a reason to cancel a contract.</li>
          <li>Start with the file you already export. Ask for an account only when you want the seat to remember.</li>
        </ul>
      </article>

      <article className={styles.card}>
        <p className={styles.eyebrow}>WHAT THIS IS NOT</p>
        <ul className={styles.list}>
          {POS_CAPTURE.kill.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className={styles.note}>{POS_CAPTURE.alreadyOnToast}</p>
        <div className={styles.actions}>
          <Link className={styles.ghost} href="/connect/toast">
            Already on Toast →
          </Link>
        </div>
      </article>

      <div className={styles.grid}>
        {POS_CAPTURE.related.map((link) => (
          <Link key={link.href} className={styles.tile} href={link.href}>
            <strong>RELATED</strong>
            {link.label}
          </Link>
        ))}
      </div>
    </OneSeatPublicShell>
  );
}
