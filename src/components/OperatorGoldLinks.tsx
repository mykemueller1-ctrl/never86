import Link from 'next/link';
import { NEVER86_TRY_URL } from '@/lib/selectedSites';
import { oneSeatStyles as styles } from './OneSeatPublicShell';

/** Same Action Shift seat. ChatGPT, Gemini, and Grok are connectors, not a second product. */
export function OperatorGoldLinks() {
  return (
    <p className={styles.note}>
      Action Shift is the product. ChatGPT, Gemini, and Grok open this seat.
      {' '}
      <Link href="/llm-shells">Connectors</Link>
      {' · '}
      <a href={NEVER86_TRY_URL}>www.never86.ai/try</a>
    </p>
  );
}
