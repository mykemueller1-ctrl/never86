import { redirect } from 'next/navigation';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';
import OnboardPage from './OnboardClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Returning owners with a valid session skip Claim seat entirely and land
// straight in their owner desk — no re-claiming a seat they already have.
export default async function Onboard() {
  const session = await readOperatorSession();
  if (session) {
    redirect(OWNER_DESK_POST_AUTH_REDIRECT);
  }
  return <OnboardPage />;
}
