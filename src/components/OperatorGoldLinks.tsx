import { NEVER86_ONBOARD_URL, NEVER86_SEAT_URL, NEVER86_TRY_URL } from '@/lib/selectedSites';
import { oneSeatStyles as styles } from './OneSeatPublicShell';

/** Operator copy: one door only — never86.ai. */
export function OperatorGoldLinks() {
  return (
    <p className={styles.note}>
      One door: the free seat lives on never86.ai.
      {' '}
      <a href={NEVER86_TRY_URL}>Try it free</a>
      {' · '}
      <a href={NEVER86_SEAT_URL}>One Seat</a>
      {' · '}
      <a href={NEVER86_ONBOARD_URL}>Claim free owner seat</a>
    </p>
  );
}
