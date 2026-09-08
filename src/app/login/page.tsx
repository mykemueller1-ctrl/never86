import { redirect } from 'next/navigation';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';
import OperatorLoginPage from './LoginClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Returning owners with a valid session skip the login form entirely and
// land straight in their owner desk — no re-entering email every visit.
export default async function LoginPage() {
  const session = await readOperatorSession();
  if (session) {
    redirect(OWNER_DESK_POST_AUTH_REDIRECT);
  }
  return <OperatorLoginPage />;
}
