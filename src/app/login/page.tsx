import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';
import { safeOwnerReturnTo } from '@/lib/ownerSeatGate';
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

// Returning owners with a valid session skip the login form and land on the owner seat.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const session = await readOperatorSession();
  const params = await searchParams;
  const rawReturn = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = safeOwnerReturnTo(rawReturn);
  if (session) {
    redirect(returnTo ?? OWNER_DESK_POST_AUTH_REDIRECT);
  }
  return <OperatorLoginPage returnTo={returnTo} />;
}
