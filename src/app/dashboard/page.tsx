import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyOperatorSession, OPERATOR_COOKIE } from '@/lib/operatorSession';
import OperatorDashboard from '@/components/OperatorDashboard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = { title: "Your dashboard | Never 86'd" };

// The operator's own home. Reads their operator_id from the signed session
// cookie (set at login) and renders THEIR clean, coaching-first dashboard —
// only their stores. Middleware also gates this route; the redirect here is
// belt-and-suspenders.
export default async function DashboardPage() {
  const token = cookies().get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) redirect('/login?next=/dashboard');

  return <OperatorDashboard operatorId={session.operatorId} />;
}
