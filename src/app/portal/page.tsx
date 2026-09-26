import type { Metadata } from 'next';
import Link from 'next/link';
import { HOUSE_CODE_SEAT_DOOR } from '@/lib/houseCode';
import { PortalHouseForm } from './PortalHouseForm';

export const metadata: Metadata = {
  title: "House-code seat | Never 86'd",
  description: 'Community house-code portal. CTAP community seat door. Fail-closed. No private store data.',
  robots: { index: false, follow: false },
};

export default function HouseCodePortalPage() {
  return (
    <main className="owner-portal">
      <div className="owner-portal-wrap">
        <Link href="/" className="owner-portal-brand">
          <span className="owner-desk-brand-mark" aria-hidden>
            86
          </span>
          <span>
            <span className="owner-desk-brand-word">Never86’d</span>
            <p className="owner-desk-hello-store">Community house-code · {HOUSE_CODE_SEAT_DOOR}</p>
          </span>
        </Link>

        <section className="owner-portal-card">
          <p className="owner-desk-kicker">Seat door</p>
          <h1>House code. Then the seat.</h1>
          <p>
            This is the community house-code door. Owner email and password live at{' '}
            <Link href="/portal/login">/portal/login</Link>
            {' '}(same door as /login). A house code opens one seat. No PIN, no staff name, no marketplace password.
            Live codes stay closed until the first code is issued.
          </p>
          <PortalHouseForm />
          <p className="owner-portal-note">
            The free owner seat starts by email at <Link href="/onboard">/onboard</Link>.
            That is the one-seat door. A house code is not the stranger funnel.
          </p>
        </section>
      </div>
    </main>
  );
}
