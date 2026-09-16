import type { Metadata } from 'next';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { GOLD_RECIPE, money, pctLabel } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Check a recipe cost | Never86’d One Seat',
  description: 'Connect ingredient prices to a recipe. Sample $4 plate / $16 menu is fictional. No count → no food cost.',
  alternates: { canonical: 'https://www.never86.ai/check/menu' },
};

export default function CheckMenuPage() {
  return (
    <OneSeatPublicShell
      eyebrow="ONE SEAT · RECIPE COST"
      title="What does this plate cost now?"
      lede="Bring a recipe and the purchase prices on the last invoices. Invoice ≠ COGS. No count → no food cost."
    >
      <article className={styles.card}>
        <p className={styles.eyebrow}>FICTIONAL SAMPLE</p>
        <div className={styles.prices}>
          <div><small>Plate</small><strong>{money(GOLD_RECIPE.plateCost)}</strong></div>
          <span>on</span>
          <div><small>Menu</small><strong>{money(GOLD_RECIPE.menuPrice)}</strong></div>
        </div>
        <div className={styles.delta}>
          <strong>{pctLabel(GOLD_RECIPE.foodCostPct)}</strong>
          <b>sample food cost</b>
        </div>
        <HonestyLegend
          active="Estimated"
          note="Estimated fictional plate math. No count stays Missing. Invoice ≠ COGS. We do not invent food cost."
        />
        <div className={styles.next}>
          <small>YOUR NEXT MOVE</small>
          <p>{GOLD_RECIPE.nextMove}</p>
        </div>
        <p className={styles.note}>{GOLD_RECIPE.claimBoundary}</p>
      </article>
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.tryRecipes}>See the sample first</Link>
      </div>
    </OneSeatPublicShell>
  );
}
