import type { Metadata } from 'next';
import Link from 'next/link';
import { InvoiceCompareClient } from '@/components/InvoiceCompareClient';
import { InvoiceWinCard } from '@/components/InvoiceWinCard';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { GOLD_MOZZARELLA, ONE_SEAT_EQUALS, ONE_SEAT_ICP } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Try the two-invoice price check | Never86’d One Seat',
  description:
    'Two sample invoices. One clear mozzarella price change. Fictional sample dollars. First owner seat free on never86.ai.',
  alternates: { canonical: 'https://www.never86.ai/try' },
};

export default function TryPage() {
  return (
    <OneSeatPublicShell
      eyebrow={`ONE SEAT · ${ONE_SEAT_ICP.toUpperCase()}`}
      title="Two sample invoices. One clear price change."
      lede={`${ONE_SEAT_EQUALS}. Community proved the habit on real paper. This public card uses a fictional mozzarella sample so you can see the move before you claim the free owner seat. Operators stay on never86.ai — not ChatGPT.`}
    >
      <InvoiceWinCard heading={`${GOLD_MOZZARELLA.item} moved.`} />
      <InvoiceCompareClient />
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.tryLabor}>See the labor sample</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.tryRecipes}>See the plate sample</Link>
      </div>
    </OneSeatPublicShell>
  );
}
