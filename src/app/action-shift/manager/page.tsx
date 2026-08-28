import type { Metadata } from 'next';
import Link from 'next/link';
import ActionShiftManagerDesk from '@/components/ActionShiftManagerDesk';

export const metadata: Metadata = {
  title: "Manager seat | Action Shift | Never 86'd",
  description: 'Manager-first Action Shift operating board: checklist ownership, proof, and escalation. Synthetic lab fixture only.',
  robots: { index: false, follow: false },
};

export default function ActionShiftManagerPage() {
  return (
    <main className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/action-shift" className="hover:text-white">← Action Shift desk</Link>
          <Link href="/action-shift/setup" className="hover:text-white">Payroll join</Link>
          <Link href="/action-shift/lab" className="hover:text-white">CTap lab templates</Link>
          <Link href="/staff/seats" className="hover:text-white">Staff seats</Link>
          <Link href="/staff/desk" className="hover:text-white">Role-day desk</Link>
          <Link href="/dashboard/setup" className="hover:text-white">Workforce setup</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">CTAP · Action Shift · manager seat</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">One manager sees the stations. Proof closes the shift.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          Owner seat stays on the desk. This is the manager operating UI: ownership, completion, proof, and escalation.
          Extra station logins are paid later and are not turned on here.
        </p>
        <div className="mt-10"><ActionShiftManagerDesk /></div>
      </div>
    </main>
  );
}
