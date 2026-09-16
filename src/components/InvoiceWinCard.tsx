import { HonestyLegend } from '@/components/HonestyLegend';
import {
  GOLD_MOZZARELLA,
  GOLD_SAMPLE_HONESTY,
  GOLD_SAMPLE_HONESTY_NOTE,
  money,
  pctLabel,
} from '@/lib/oneSeatPublicWin';
import { oneSeatStyles as styles } from './OneSeatPublicShell';

export function InvoiceWinCard({ heading = 'Same cheese. Higher price.' }: { heading?: string }) {
  return (
    <article className={styles.card}>
      <div className={styles.eyebrow}>SAME VENDOR · SAME SKU · SAME PACK · FICTIONAL EXAMPLE</div>
      <h2>{heading}</h2>
      <p className={styles.note}>
        {GOLD_MOZZARELLA.vendor} · {GOLD_MOZZARELLA.sku} · {GOLD_MOZZARELLA.pack} · {GOLD_MOZZARELLA.days} days
      </p>
      <div className={styles.prices}>
        <div>
          <small>Previous case</small>
          <strong>{money(GOLD_MOZZARELLA.priorPrice)}</strong>
        </div>
        <span>→</span>
        <div>
          <small>Latest case</small>
          <strong>{money(GOLD_MOZZARELLA.currentPrice)}</strong>
        </div>
      </div>
      <div className={styles.delta}>
        <strong>+{money(GOLD_MOZZARELLA.delta)} <small>per case</small></strong>
        <b>+{pctLabel(GOLD_MOZZARELLA.driftPct)}</b>
      </div>
      <HonestyLegend active={GOLD_SAMPLE_HONESTY} note={GOLD_SAMPLE_HONESTY_NOTE} />
      <div className={styles.next}>
        <small>YOUR NEXT MOVE</small>
        <p>{GOLD_MOZZARELLA.nextMove}</p>
        <p className={styles.note}>{GOLD_MOZZARELLA.suggestedWording}</p>
      </div>
      <details>
        <summary>Show the math and source rules</summary>
        <p className={styles.note}>
          {money(GOLD_MOZZARELLA.currentPrice)} − {money(GOLD_MOZZARELLA.priorPrice)} = {money(GOLD_MOZZARELLA.delta)}.
          {' '}{money(GOLD_MOZZARELLA.delta)} ÷ {money(GOLD_MOZZARELLA.priorPrice)} = {pctLabel(GOLD_MOZZARELLA.driftPct)}.
          {' '}Flour stayed {money(25)} → {money(25)} so a flat line is not a leak.
          {' '}{GOLD_MOZZARELLA.claimBoundary}
        </p>
      </details>
    </article>
  );
}
