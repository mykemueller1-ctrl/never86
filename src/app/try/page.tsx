import Link from 'next/link';
import { FunnelLink } from '@/components/FunnelLink';
import { publicPageMetadata } from '@/lib/seoAeo';
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

export const metadata = publicPageMetadata({
  path: '/try',
  title: "Try it free — no card | Never86'd",
  description:
    "A public sample with fictional dollars. No account. No card. Then claim the free owner seat or sign in.",
});

export default function TryPage() {
  return (
    <OneSeatPublicShell
      eyebrow={`ONE SEAT · ${ONE_SEAT_ICP.toUpperCase()}`}
      title="What’s missing, then the next paper."
      lede={`${ONE_SEAT_EQUALS}. Five papers on one seat: what’s missing, invoices, labor, menu, and Ask. Operators stay on never86.ai.`}
    >
      <ol className={styles.list}>
        <li>
          <a href="#missing">STEP 1 · What’s missing — Gmail is not connected. Drop a photo, a PDF, or use chat.</a>
          <HonestyLegend active="Missing" note="Gmail is not connected. Folders stay Missing. No invented $." />
        </li>
        <li>
          <a href="#invoices">STEP 2 · Invoices — paste or drop a PDF. HEIC stays Missing. Sample dollars are Demo · Estimated.</a>
          <HonestyLegend demo active="Estimated" note={GOLD_SAMPLE_HONESTY_NOTE} />
        </li>
        <li>
          <a href="#labor">STEP 3 · Labor and menu — disclosed sample hours and plate math. Demo · Estimated.</a>
          {' '}
          <a href="#menu">Open the menu step.</a>
          <HonestyLegend demo active="Estimated" note="Demo · Estimated. Fictional sample hours and plate math. A missing punch stays Missing — not $0." />
        </li>
        <li>
          <a href="#ask">STEP 4 · Ask — a typed dollar is Estimated. It is not a SKU price.</a>
          <HonestyLegend active="Missing" note="A named paper stays Missing until a file parses." />
          <HonestyLegend active="Estimated" note="A typed dollar is Estimated. It is not a SKU price. No invented $." />
        </li>
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
        <FunnelLink className={styles.primary} href={ONE_SEAT_PATHS.onboard} event="onboard_start">Claim free owner seat</FunnelLink>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.login}>Sign in</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.chat}>Open the Missing map</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.seat}>Open the seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.checkLabor}>Check labor papers</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.checkMenu}>Check a plate</Link>
      </div>
    </OneSeatPublicShell>
  );
}
