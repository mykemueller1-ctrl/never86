import type { Metadata } from 'next';
import Link from 'next/link';
import ActionShiftSetupDesk from '@/components/ActionShiftSetupDesk';

export const metadata: Metadata = {
  title: "Workforce setup | Action Shift | Never 86'd",
  description: 'Browser-only payroll census and weekly sheet join. Synthetic examples only. Noindex.',
  robots: { index: false, follow: false },
};

export default function ActionShiftSetupProofPage() {
  return (
    <main className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/action-shift" className="hover:text-white">← Action Shift desk</Link>
          <Link href="/action-shift/manager" className="hover:text-white">Manager seat</Link>
          <Link href="/action-shift/lab" className="hover:text-white">CTap lab templates</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">Action Shift · payroll join · browser only</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">Drop the payroll census. Weekly sheets join on the ID.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          File / employee ID is the stored key. Names stay display-only. SSN and wage columns are dropped in this browser.
          Nothing is uploaded. Live staff names do not belong in Git.
        </p>
        <div className="mt-10"><ActionShiftSetupDesk /></div>
      </div>
    </main>
  );
}
