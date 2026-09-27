import type { Metadata } from 'next';
import Link from 'next/link';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Watch One Seat work | Never86’d',
  description: '68-second product walk. Fictional sample documents. Then try the two-invoice check on never86.ai.',
  alternates: { canonical: 'https://www.never86.ai/try/watch' },
};

export default function TryWatchPage() {
  return (
    <OneSeatPublicShell
      eyebrow="SEE THE ACTUAL EXPERIENCE"
      title="Watch one check. Then run the same move here."
      lede="This film uses fictional sample documents. The live two-invoice win stays on never86.ai. No ChatGPT sign-in."
    >
      <article className={styles.card}>
        <video
          className={styles.area}
          controls
          playsInline
          preload="none"
          poster="/media/never86-landscape-v24-poster.jpg"
          style={{ minHeight: 'auto', aspectRatio: '16 / 9', padding: 0 }}
        >
          <source src="/media/never86-landscape-v24.mp4" type="video/mp4" />
          <track kind="captions" src="/media/never86-landscape-v24.vtt" srcLang="en" label="English" default />
        </video>
        <p className={styles.note}>68 seconds · Real product screens · Fictional sample documents · AI narration</p>
      </article>
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.try}>Try the two-invoice sample</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
      </div>
    </OneSeatPublicShell>
  );
}
