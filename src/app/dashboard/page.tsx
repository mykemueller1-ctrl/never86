import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyOperatorSession, OPERATOR_COOKIE } from '@/lib/operatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from '@/lib/ownerDeskAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = { title: "Your dashboard | Never 86'd" };

// Signed-in owners land on the /operator chat composer, not the
// Payroll / Prices / Process card picker. /dashboard is no longer first paint.
export default async function DashboardPage() {
  const token = (await cookies()).get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) redirect(`/login?next=${OWNER_DESK_POST_AUTH_REDIRECT}`);
  redirect(OWNER_DESK_POST_AUTH_REDIRECT);
}
