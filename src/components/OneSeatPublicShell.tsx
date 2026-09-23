import Link from 'next/link';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';
import styles from './OneSeatPublic.module.css';

export function OneSeatPublicShell({
  children,
  eyebrow,
  title,
  lede,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Never86 home">
          <b>86</b> Never86’d
        </Link>
        <nav className={styles.nav} aria-label="One Seat">
          <Link href={ONE_SEAT_PATHS.seat}>Seat</Link>
          <Link href={ONE_SEAT_PATHS.try}>Try the sample</Link>
          <Link href={ONE_SEAT_PATHS.chat}>Missing map</Link>
          <Link href={ONE_SEAT_PATHS.checkInvoices}>Check invoices</Link>
          <Link href={ONE_SEAT_PATHS.checkLabor}>Check labor</Link>
          <Link href={ONE_SEAT_PATHS.checkMenu}>Check a plate</Link>
        </nav>
        <Link className={styles.cta} href={ONE_SEAT_PATHS.onboard}>
          Claim free owner seat
        </Link>
      </header>
      <section className={styles.wrap}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.lede}>{lede}</p>
        {children}
      </section>
      <footer className={styles.footer}>
        <Link href="/">Home</Link>
        <Link href={ONE_SEAT_PATHS.onboard}>Free owner seat</Link>
        <Link href={ONE_SEAT_PATHS.chat}>Missing map</Link>
        <Link href={ONE_SEAT_PATHS.login}>Sign in</Link>
        <Link href="/privacy">Privacy</Link>
        <p>One Seat = Action Shift. Operators stay on never86.ai. Grok explains. Formulas decide.</p>
      </footer>
    </main>
  );
}

export { styles as oneSeatStyles };
