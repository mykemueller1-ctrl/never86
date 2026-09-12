import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';
import OperatorLoginPage from './LoginClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Sign in | Never86'd",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

// Returning owners with a valid session skip the login form and land on the desk.
export default async function LoginPage() {
  const session = await readOperatorSession();
  if (session) {
    redirect(OWNER_DESK_POST_AUTH_REDIRECT);
  }
  return <OperatorLoginPage />;
}
