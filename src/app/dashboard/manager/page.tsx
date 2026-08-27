import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ActionShiftManagerDesk from '@/components/ActionShiftManagerDesk';
import { OPERATOR_COOKIE, verifyOperatorSession } from '@/lib/operatorSession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = {
  title: "Manager board | Never 86'd",
  robots: { index: false, follow: false },
};

export default async function OperatorManagerBoardPage() {
  const token = (await cookies()).get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) redirect('/login?next=/dashboard/manager');

  return (
    <main className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/dashboard" className="hover:text-white">← Dashboard</Link>
          <Link href="/dashboard/setup" className="hover:text-white">Workforce setup</Link>
          <Link href="/action-shift/manager" className="hover:text-white">Public manager proof</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">Manager seat · operator {session.operatorId}</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">Operate the shift from one manager seat.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          Signed-in operator {session.operatorId} stays on this side of the tenant line. The board below is the synthetic lab until an approved roster is loaded privately.
        </p>
        <div className="mt-10"><ActionShiftManagerDesk signedInOperatorId={session.operatorId} /></div>
      </div>
    </main>
  );
}
