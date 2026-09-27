import type { Metadata } from 'next';
import Link from 'next/link';
import { InvoiceWinCard } from '@/components/InvoiceWinCard';
import { HonestyLegend } from '@/components/HonestyLegend';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { INVOICE_CAPTURE } from '@/lib/captureLandings';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: `${INVOICE_CAPTURE.title} | Never86’d One Seat`,
  description: INVOICE_CAPTURE.description,
  alternates: { canonical: INVOICE_CAPTURE.canonical },
  openGraph: {
    title: INVOICE_CAPTURE.title,
    description: INVOICE_CAPTURE.description,
    url: INVOICE_CAPTURE.canonical,
  },
};

export default function RestaurantInvoicePriceIncreasePage() {
  return (
    <OneSeatPublicShell eyebrow={INVOICE_CAPTURE.eyebrow} title={INVOICE_CAPTURE.title} lede={INVOICE_CAPTURE.geo}>
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.checkInvoices}>
          Open Two Invoice Catcher
        </Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.try}>
          Try the sample first
        </Link>
        <Link className={styles.ghost} href={ONE_SEAT_PATHS.onboard}>
          Claim free owner seat
        </Link>
      </div>

      <article className={styles.card}>
        <p className={styles.eyebrow}>TRUCK PAPER VS MENU</p>
        <h2>The case on the dock moved. The menu did not get a vote yet.</h2>
        <p className={styles.note}>
          Compare two invoices before you treat a price as food cost. Same vendor, same SKU, same pack.
          One readable invoice is a summary. A price check needs the matching later paper.
        </p>
        <HonestyLegend
          active="Missing"
          note="Matching papers = Verified. A disclosed sample stays Estimated. One invoice or an unknown pack stays Missing, not $0."
        />
      </article>

      <InvoiceWinCard heading="Same cheese. Higher price. Not recovered cash." />

      <article className={styles.card}>
        <p className={styles.eyebrow}>WHAT THIS IS NOT</p>
        <ul className={styles.list}>
          {INVOICE_CAPTURE.kill.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className={styles.note}>
          Invoice ≠ COGS. No count → no food cost. This door is the two-invoice catch, not a full prime-cost close.
        </p>
      </article>

      <div className={styles.grid}>
        {INVOICE_CAPTURE.related.map((link) => (
          <Link key={link.href} className={styles.tile} href={link.href}>
            <strong>NEXT</strong>
            {link.label}
          </Link>
        ))}
      </div>
    </OneSeatPublicShell>
  );
}
