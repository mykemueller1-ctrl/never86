import type { Metadata } from 'next';
import Link from 'next/link';
import { OperatorGoldLinks } from '@/components/OperatorGoldLinks';
import { InvoiceCompareClient } from '@/components/InvoiceCompareClient';
import { InvoiceWinCard } from '@/components/InvoiceWinCard';
import { OneSeatPanels } from '@/components/OneSeatPanels';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { PapersChatIntake } from '@/components/PapersChatIntake';
import { PapersReadiness } from '@/components/PapersReadiness';
import { GOLD_MOZZARELLA, ONE_SEAT_EQUALS, ONE_SEAT_ICP } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'One Seat | Never86’d',
  description:
    'What’s missing, invoices, labor, menu, and Ask Never86’d. Fictional sample dollars. Gmail stays Missing until a pull lands.',
  alternates: { canonical: 'https://www.never86.ai/seat' },
};

export default function SeatPage() {
  return (
    <OneSeatPublicShell
      eyebrow={`ONE SEAT · ${ONE_SEAT_ICP.toUpperCase()}`}
      title="One seat. Five papers."
      lede={`${ONE_SEAT_EQUALS}. What’s missing, invoices, labor, menu, and Ask. A ready Google client is not a connected inbox. No invented $.`}
    >
      <OneSeatPanels
        sample={<InvoiceWinCard heading={`${GOLD_MOZZARELLA.item} moved.`} />}
        invoices={<InvoiceCompareClient />}
        papers={<PapersReadiness heading="Gmail stays Missing until a pull lands" />}
        ask={<PapersChatIntake />}
      />
      <OperatorGoldLinks />
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.chat}>Open the Missing map</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.checkInvoices}>Check invoices</Link>
      </div>
    </OneSeatPublicShell>
  );
}
