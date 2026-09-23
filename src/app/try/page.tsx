import type { Metadata } from 'next';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { InvoiceCompareClient } from '@/components/InvoiceCompareClient';
import { InvoiceWinCard } from '@/components/InvoiceWinCard';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { PapersReadiness } from '@/components/PapersReadiness';
import { GOLD_LABOR, GOLD_MOZZARELLA, GOLD_RECIPE, ONE_SEAT_EQUALS, ONE_SEAT_ICP, money, pctLabel } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Try the operator walk | Never86’d One Seat',
  description:
    'Sample papers, invoice drift, labor and menu hooks, then Google papers. Fictional sample dollars. Google stays Missing until client secrets exist.',
  alternates: { canonical: 'https://www.never86.ai/try' },
};

export default function TryPage() {
  return (
    <OneSeatPublicShell
      eyebrow={`ONE SEAT · ${ONE_SEAT_ICP.toUpperCase()}`}
      title="Sample papers, then the next papers."
      lede={`${ONE_SEAT_EQUALS}. Walk the seat: a disclosed fictional invoice, the price-change formula, labor and plate hooks, then Google. Operators stay on never86.ai.`}
    >
      <ol className={styles.list}>
        <li>Sample papers — fictional mozzarella, labeled Estimated.</li>
        <li>Invoice drift — same SKU and pack. Paste or drop a PDF. HEIC stays Missing.</li>
        <li>Labor and menu hooks — disclosed sample hours and plate math.</li>
        <li>Google papers — Missing until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET exist.</li>
      </ol>

      <p className={styles.eyebrow}>STEP 1 · SAMPLE PAPERS</p>
      <InvoiceWinCard heading={`${GOLD_MOZZARELLA.item} moved.`} />

      <p className={styles.eyebrow}>STEP 2 · INVOICE DRIFT</p>
      <InvoiceCompareClient />

      <p className={styles.eyebrow}>STEP 3 · LABOR AND MENU</p>
      <article className={styles.card}>
        <h2>Labor hook</h2>
        <p>
          Scheduled {GOLD_LABOR.scheduledHours.toFixed(2)} h → clocked {GOLD_LABOR.clockedHours.toFixed(2)} h.
          Sample ${GOLD_LABOR.sampleDollars}. Fictional.
        </p>
        <HonestyLegend
          active="Estimated"
          note="Estimated fictional sample. A missing punch stays Missing. Matching live clock and schedule become Verified."
        />
        <p className={styles.note}>{GOLD_LABOR.claimBoundary}</p>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.tryLabor}>Open the labor sample</Link>
      </article>
      <article className={styles.card}>
        <h2>Menu hook</h2>
        <p>
          Plate {money(GOLD_RECIPE.plateCost)} on menu {money(GOLD_RECIPE.menuPrice)}. Sample food cost {pctLabel(GOLD_RECIPE.foodCostPct)}.
        </p>
        <HonestyLegend
          active="Estimated"
          note="Estimated fictional plate math. No count stays Missing. Invoice ≠ COGS. We do not invent food cost."
        />
        <p className={styles.note}>{GOLD_RECIPE.claimBoundary}</p>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.tryRecipes}>Open the plate sample</Link>
      </article>

      <p className={styles.eyebrow}>STEP 4 · GOOGLE PAPERS</p>
      <PapersReadiness heading="Google stays Missing until the client exists" />

      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.chat}>Open the Missing map</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.checkLabor}>Check labor papers</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.checkMenu}>Check a plate</Link>
      </div>
    </OneSeatPublicShell>
  );
}
