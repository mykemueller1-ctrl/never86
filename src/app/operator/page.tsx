import type { Metadata } from 'next';
import { SimpleOwnerDemo } from '@/components/FreeOperatorPhone';
import OperatorStoreSwitcher from '@/components/OperatorStoreSwitcher';
import { listAccessibleSeats } from '@/lib/personAuth';
import { cache } from 'react';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { deskSeatLabel } from '@/lib/seatIsolation';

const currentDesk = cache(async () => {
  const session = await readOperatorSession();
  const seats = session ? await listAccessibleSeats(session.email).catch(() => []) : [];
  const selected = seats.find((seat) => seat.operatorId === session?.operatorId);
  return { session, restaurantName: selected?.restaurantName ?? null };
});

export async function generateMetadata(): Promise<Metadata> {
  const { restaurantName } = await currentDesk();
  return {
    title: restaurantName ? `${deskSeatLabel(restaurantName)} | Never 86'd` : "Owner seat | Never 86'd",
    robots: { index: false, follow: false },
    description:
      "You're not crazy. The stack is. Weight off the plate. No back-office homework. Not a dashboard.",
    alternates: { canonical: 'https://www.never86.ai/operator' },
    openGraph: {
      title: "Owner seat — 1–3 unit Action Shift | Never 86'd",
      description: 'Not a dashboard. Need or Ready from stored files. No invented close. No private CTAP data.',
      url: 'https://www.never86.ai/operator',
    },
  };
}

export default async function OperatorPhonePage() {
  const { session, restaurantName: initialRestaurantName } = await currentDesk();

  return (
    <main className="owner-desk-page min-h-screen">
      <OperatorStoreSwitcher />
      <SimpleOwnerDemo initialRestaurantName={initialRestaurantName} signedIn={Boolean(session)} />
    </main>
  );
}
