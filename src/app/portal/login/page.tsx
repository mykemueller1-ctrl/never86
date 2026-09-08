import { redirect } from 'next/navigation';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';
import OperatorLoginPage from '../../login/LoginClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// CTAP portal login = the same owner email+password door as /login.
// House-code stays at /portal. Magic link is set-password only.

export default async function PortalLoginPage() {
  const session = await readOperatorSession();
  if (session) {
    redirect(OWNER_DESK_POST_AUTH_REDIRECT);
  }
  return <OperatorLoginPage />;
}
