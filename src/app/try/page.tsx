import type { Metadata } from 'next';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { InvoiceCompareClient } from '@/components/InvoiceCompareClient';
import { InvoiceWinCard } from '@/components/InvoiceWinCard';
import { OneSeatPanels } from '@/components/OneSeatPanels';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { OperatorGoldLinks } from '@/components/OperatorGoldLinks';
import { PapersChatIntake } from '@/components/PapersChatIntake';
import { PapersReadiness } from '@/components/PapersReadiness';
import { GOLD_MOZZARELLA, GOLD_SAMPLE_HONESTY_NOTE, ONE_SEAT_EQUALS, ONE_SEAT_ICP } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Try the operator walk | Never86’d One Seat',
  description:
    'What’s missing, invoices, labor, menu, and Ask. Fictional sample dollars. Gmail stays Missing until a pull lands.',
  alternates: { canonical: 'https://www.never86.ai/try' },
};

export default function TryPage() {
  return (
    <OneSeatPublicShell
      eyebrow={`ONE SEAT · ${ONE_SEAT_ICP.toUpperCase()}`}
      title="What’s missing, then the next paper."
      lede={`${ONE_SEAT_EQUALS}. Five papers on one seat: what’s missing, invoices, labor, menu, and Ask. Operators stay on never86.ai.`}
    >
      <ol className={styles.list}>
        <li>STEP 1 · What’s missing — Gmail is not connected. Drop a photo, a PDF, or use chat.</li>
        <li>STEP 2 · Invoices — paste or drop a PDF. HEIC stays Missing. Sample dollars are Demo · Estimated.</li>
        <li>STEP 3 · Labor and menu — disclosed sample hours and plate math. Demo · Estimated.</li>
        <li>STEP 4 · Ask — a typed dollar is Estimated. It is not a SKU price.</li>
      </ol>
      <HonestyLegend demo active="Estimated" note={GOLD_SAMPLE_HONESTY_NOTE} />
      <OperatorGoldLinks />
      <OneSeatPanels
        sample={<InvoiceWinCard heading={`${GOLD_MOZZARELLA.item} moved.`} />}
        invoices={<InvoiceCompareClient />}
        papers={<PapersReadiness heading="Gmail stays Missing until a pull lands" />}
        ask={<PapersChatIntake />}
      />
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.chat}>Open the Missing map</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.seat}>Open the seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.checkLabor}>Check labor papers</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.checkMenu}>Check a plate</Link>
      </div>
    </OneSeatPublicShell>
  );
}
