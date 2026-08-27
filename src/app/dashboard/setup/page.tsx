import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ActionShiftSetupDesk from '@/components/ActionShiftSetupDesk';
import { OPERATOR_COOKIE, verifyOperatorSession } from '@/lib/operatorSession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: "Workforce setup | Never 86'd" };

export default async function OperatorActionShiftSetupPage() {
  const token = (await cookies()).get(OPERATOR_COOKIE)?.value;
  const session = await verifyOperatorSession(token, Date.now());
  if (!session) redirect('/login?next=/dashboard/setup');

  return (
    <main className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/dashboard" className="hover:text-white">← Dashboard</Link>
          <Link href="/dashboard/manager" className="hover:text-white">Manager board</Link>
          <Link href="/action-shift" className="hover:text-white">Action Shift desk</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">Manager setup · operator {session.operatorId}</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">Build the workforce packet without guessing who worked.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">Import the active roster and published schedule. Every assignment is matched by the provider&apos;s immutable worker ID, then given the correct role checklist. Employee files stay in this browser during staging.</p>
        <div className="mt-10"><ActionShiftSetupDesk /></div>
      </div>
    </main>
  );
}
