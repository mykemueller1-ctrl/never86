import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SimpleOwnerDemo } from '@/components/FreeOperatorPhone';
import OperatorStoreSwitcher from '@/components/OperatorStoreSwitcher';
import { isCtapSeat1Email } from '@/lib/ctapSeat1';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OWNER_SEAT_LOGIN_HREF } from '@/lib/ownerSeatGate';
import { deskSeatLabel } from '@/lib/seatIsolation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  const session = await readOperatorSession();
  const ctapEmail = session ? isCtapSeat1Email(session.email) : false;
  return {
    title: ctapEmail
      ? "Owner seat — Community Tap seat 1 | Never 86'd"
      : "Owner seat — Action Shift | Never 86'd",
    description:
      "You're not crazy. The stack is. Weight off the plate. No back-office homework. Not a dashboard.",
    alternates: { canonical: 'https://www.never86.ai/operator' },
    openGraph: {
      title: "Owner seat — 1–3 unit Action Shift | Never 86'd",
      description: 'Not a dashboard. Need or Ready from stored files. No invented close. No private staff data.',
      url: 'https://www.never86.ai/operator',
    },
  };
}

export default async function OperatorPhonePage() {
  const session = await readOperatorSession();
  if (!session) redirect(OWNER_SEAT_LOGIN_HREF);
  const ctapEmail = isCtapSeat1Email(session.email);
  const initialRestaurantName = ctapEmail ? deskSeatLabel('Community Tap') : null;

  return (
    <main className="owner-desk-page min-h-screen">
      <OperatorStoreSwitcher />
      <SimpleOwnerDemo
        initialRestaurantName={initialRestaurantName}
        signedIn
        ctapOwner={ctapEmail}
      />
    </main>
  );
}
