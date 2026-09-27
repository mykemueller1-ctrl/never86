import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';
import OperatorLoginPage from '../login/LoginClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Sign in | Never 86'd",
  description:
    'Sign in with email and password. A community house-code is optional. The free owner seat starts at /onboard.',
  robots: { index: false, follow: false },
};

// Email + password is this door. A store house code stays behind a small link.
export default async function HouseCodePortalPage() {
  const session = await readOperatorSession();
  if (session) {
    redirect(OWNER_DESK_POST_AUTH_REDIRECT);
  }
  return <OperatorLoginPage showHouseCode />;
}
