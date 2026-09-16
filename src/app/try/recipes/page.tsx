import type { Metadata } from 'next';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { GOLD_MOZZARELLA, GOLD_RECIPE, money, pctLabel } from '@/lib/oneSeatPublicWin';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Try the plate-cost sample | Never86’d One Seat',
  description: 'Fictional plate cost $4 on a $16 menu. No count → no food cost.',
  alternates: { canonical: 'https://www.never86.ai/try/recipes' },
};

export default function TryRecipesPage() {
  return (
    <OneSeatPublicShell
      eyebrow="ACTION SHIFT · PLATE SAMPLE"
      title="What does this plate cost now?"
      lede="Connect a recipe to purchase prices. If the cheese case moved, the plate moves. Sample math only."
    >
      <article className={styles.card}>
        <div className={styles.prices}>
          <div><small>Plate cost</small><strong>{money(GOLD_RECIPE.plateCost)}</strong></div>
          <span>on</span>
          <div><small>Menu price</small><strong>{money(GOLD_RECIPE.menuPrice)}</strong></div>
        </div>
        <div className={styles.delta}>
          <strong>{pctLabel(GOLD_RECIPE.foodCostPct)} food cost</strong>
          <b>sample only</b>
        </div>
        <HonestyLegend
          active="Estimated"
          note="Estimated fictional plate math. No count stays Missing. Invoice ≠ COGS. We do not invent food cost."
        />
        <p className={styles.note}>
          Uses the fictional mozzarella case at {money(GOLD_MOZZARELLA.currentPrice)}. {GOLD_RECIPE.nextMove}
        </p>
        <p className={styles.note}>{GOLD_RECIPE.claimBoundary}</p>
      </article>
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.checkMenu}>Check a recipe</Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.onboard}>Claim free owner seat</Link>
      </div>
    </OneSeatPublicShell>
  );
}
