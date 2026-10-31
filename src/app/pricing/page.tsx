import Link from 'next/link';
import { ActionShiftFooter, ActionShiftHeader } from '@/components/ActionShiftDoor';
import { publicPageMetadata } from '@/lib/seoAeo';

export const metadata = publicPageMetadata({
  path: '/pricing',
  title: 'Your first owner seat is free | Never86’d',
  description: 'One restaurant and one login. A second location stays closed until it is paid. No card required to start.',
});

export default function Pricing() {
  return (
    <div className="as-home">
      <ActionShiftHeader />
      <main className="as-wrap" style={{ paddingTop: 56, paddingBottom: 72 }}>
        <p className="as-kicker">ONE RESTAURANT. ONE LOGIN.</p>
        <h1 style={{ letterSpacing: '-0.05em', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 600, lineHeight: 1.08, margin: '0 0 16px' }}>
          Your first seat is free.
        </h1>
        <p className="as-lead">
          Start with invoice prices, labor hours, or a plate cost. Bring the records you already have. No card required to start.
        </p>
        <div className="as-price-grid">
          <section className="as-panel">
            <p className="as-kicker">OWNER SEAT</p>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>One restaurant</h2>
            <p className="as-price">Free</p>
            <p className="as-fine">
              One restaurant. One login. A second location stays closed on the free plan. Sign in before uploading private records.
            </p>
            <Link className="as-button" href="/onboard" style={{ marginTop: 22 }}>
              Claim the free owner seat
            </Link>
          </section>
          <section className="as-panel">
            <p className="as-kicker">MORE SEATS</p>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Managers and more locations</h2>
            <p className="as-price" style={{ fontSize: 22 }}>Explained before you commit</p>
            <p className="as-fine">
              Additional seats are paid expansion. Availability and pricing are not finalized. We explain the terms before you commit.
            </p>
            <Link className="as-button" href="/contact" style={{ marginTop: 22, background: 'transparent', color: 'var(--as-ink)', border: '1px solid var(--as-line)', boxShadow: 'none' }}>
              Leave your email
            </Link>
          </section>
        </div>
        <p className="as-fine" style={{ marginTop: 28 }}>
          A price increase is not recovered savings. Recipe ingredient cost is not full profit. Every result depends on the evidence you provide.
        </p>
      </main>
      <ActionShiftFooter />
    </div>
  );
}
