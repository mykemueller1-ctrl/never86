import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyOperatorSession, OPERATOR_COOKIE } from '@/lib/operatorSession';
import UnifiedCommandCenter from '@/components/UnifiedCommandCenter';
import SignOutButton from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = { title: "Your Command Center | Never 86'd" };

// The operator's own home. Reads their operator_id from the signed session
// cookie (set at login) and renders the same command-center UI the design
// partner gets — but scoped to THIS operator only. Middleware also gates this
// route; the redirect here is belt-and-suspenders.
export default async function DashboardPage() {
  const token = cookies().get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) redirect('/login?next=/dashboard');

  return (
    <div className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="compass-mark">N</span>
          <span className="font-serif text-[20px] text-white">
            Never 86&apos;d <span className="italic text-white/60">· your command center</span>
          </span>
        </Link>
        <SignOutButton />
      </div>
      <UnifiedCommandCenter operatorId={session.operatorId} />
    </div>
  );
}
