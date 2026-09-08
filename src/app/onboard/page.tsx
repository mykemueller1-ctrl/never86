import { redirect } from 'next/navigation';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';
import OnboardPage from './OnboardClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Returning owners with a valid session skip Claim seat and land on the desk.
export default async function Onboard() {
  const session = await readOperatorSession();
  if (session) {
    redirect(OWNER_DESK_POST_AUTH_REDIRECT);
  }
  return <OnboardPage />;
}
