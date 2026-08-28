import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { StaffSeatReadinessDesk } from '@/components/StaffSeatReadinessDesk';
import { OPERATOR_COOKIE, verifyOperatorSession } from '@/lib/operatorSession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = {
  title: "Staff seats | Never 86'd",
  robots: { index: false, follow: false },
};

export default async function OperatorStaffSeatsPage() {
  const token = (await cookies()).get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) redirect('/login?next=/dashboard/staff');

  return <StaffSeatReadinessDesk signedInOperatorId={session.operatorId} />;
}
