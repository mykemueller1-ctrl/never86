import { HONESTY_LABELS, type HonestyLabel } from '@/lib/oneSeatPublicWin';
import styles from './HonestyLegend.module.css';

export function HonestyLegend({
  active,
  note,
}: {
  active: HonestyLabel;
  note?: string;
}) {
  return (
    <div className={styles.wrap}>
      <p className={styles.row} aria-label={`Honesty ${active}`}>
        {HONESTY_LABELS.map((label) => (
          <span
            key={label}
            className={`${styles.pill} ${styles[label.toLowerCase()]} ${active === label ? styles.on : ''}`}
          >
            {label}
          </span>
        ))}
      </p>
      {note ? <p className={styles.note}>{note}</p> : null}
    </div>
  );
}
