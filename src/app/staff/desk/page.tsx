import type { Metadata } from 'next';
import Link from 'next/link';
import { StaffRoleDayDesk } from '@/components/StaffRoleDayDesk';

export const metadata: Metadata = {
  title: "Staff role-day desk | Never 86'd",
  description: 'Today\'s station checklist and policies by role. Live staff credentials are not issued.',
  robots: { index: false, follow: false },
};

export default function StaffRoleDayPage() {
  return (
    <main className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/staff/seats" className="hover:text-white">← Staff seats</Link>
          <Link href="/staff/login" className="hover:text-white">Staff login</Link>
          <Link href="/action-shift/lab" className="hover:text-white">Wall templates</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">Staff desk · noindex · not live</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
          Today&apos;s station. The policies this seat needs.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          FOH manager sees the bar whip and coverage. Kitchen manager sees fry rotation, dough by 3, and the
          late-delivery four questions. Crew sees only their station card plus that day&apos;s extras.
        </p>
        <div className="mt-10">
          <StaffRoleDayDesk />
        </div>
      </div>
    </main>
  );
}
