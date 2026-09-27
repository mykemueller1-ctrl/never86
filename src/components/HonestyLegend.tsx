import { HONESTY_LABELS, type HonestyLabel } from '@/lib/oneSeatPublicWin';
import styles from './HonestyLegend.module.css';

export function HonestyLegend({
  active,
  note,
  demo = false,
}: {
  active: HonestyLabel;
  note?: string;
  /** Sample dollars. Shows Demo · Estimated and does not render a Verified pill. */
  demo?: boolean;
}) {
  const labels = demo ? HONESTY_LABELS.filter((label) => label !== 'Verified') : HONESTY_LABELS;
  return (
    <div className={styles.wrap}>
      <p className={styles.row} aria-label={demo ? 'Honesty Demo Estimated' : `Honesty ${active}`}>
        {labels.map((label) => (
          <span
            key={label}
            className={`${styles.pill} ${styles[label.toLowerCase()]} ${active === label ? styles.on : ''}`}
          >
            {demo && label === 'Estimated' ? 'Demo · Estimated' : label}
          </span>
        ))}
      </p>
      {note ? <p className={styles.note}>{note}</p> : null}
    </div>
  );
}
