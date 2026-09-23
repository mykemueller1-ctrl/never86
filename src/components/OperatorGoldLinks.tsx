import { CHATGPT_ONE_SEAT_GOLD_URL, NEVER86_TRY_URL } from '@/lib/selectedSites';
import { oneSeatStyles as styles } from './OneSeatPublicShell';

/** Operator copy: ChatGPT One Seat gold and the same walk on never86.ai. */
export function OperatorGoldLinks() {
  return (
    <p className={styles.note}>
      Operators: ChatGPT One Seat gold and the same walk on never86.ai.
      {' '}
      <a href={CHATGPT_ONE_SEAT_GOLD_URL}>ChatGPT One Seat gold</a>
      {' · '}
      <a href={NEVER86_TRY_URL}>www.never86.ai/try</a>
    </p>
  );
}
