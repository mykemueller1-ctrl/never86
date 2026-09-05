import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { HOUSE_CODE_SEAT_DOOR } from '@/lib/houseCode';

export const metadata: Metadata = {
  title: "House-code seat | Never 86'd",
  description: 'The community house-code portal is the only seat door. /communities redirects there.',
  robots: { index: false, follow: false },
};

/** Open-play communities door is retired. House-code /portal is the only seat. */
export default function CommunitiesPage() {
  redirect(HOUSE_CODE_SEAT_DOOR);
}
