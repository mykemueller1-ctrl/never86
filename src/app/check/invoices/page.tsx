import type { Metadata } from 'next';
import Link from 'next/link';
import { HashScroll } from '@/components/HashScroll';
import { InvoiceCompareClient } from '@/components/InvoiceCompareClient';
import { InvoiceWinCard } from '@/components/InvoiceWinCard';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Check invoice prices | Never86’d One Seat',
  description: 'Compare the same vendor SKU and pack across two invoices. Sample mozzarella $48 → $56 is fictional. First owner seat free.',
  alternates: { canonical: 'https://www.never86.ai/check/invoices' },
};

export default function CheckInvoicesPage() {
  return (
    <OneSeatPublicShell
      eyebrow="ONE SEAT · VENDOR PRICES"
      title="What went up on my invoice?"
      lede="Bring two invoices from the same vendor. The formula flags the same SKU and pack when unit price jumps more than 5%. A price increase is not money recovered. No ChatGPT sign-in."
    >
      <div id="pdf" style={{ scrollMarginTop: 24 }}>
        <HashScroll id="pdf" />
        <InvoiceCompareClient />
      </div>
      <InvoiceWinCard />
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.try}>See the sample first</Link>
      </div>
    </OneSeatPublicShell>
  );
}
