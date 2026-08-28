import type { Metadata } from 'next';
import Link from 'next/link';
import { StaffRoleDayDesk } from '@/components/StaffRoleDayDesk';

export const metadata: Metadata = {
  title: "Staff role-day desk | Never 86'd",
  description: "Today's station checklist, schedule board, and in-app comms by role. Live staff credentials wait on Neon apply.",
  robots: { index: false, follow: false },
};

export default function StaffRoleDayPage() {
  return (
    <main className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/staff/seats" className="hover:text-white">← Staff seats</Link>
          <Link href="/staff/login" className="hover:text-white">Staff login</Link>
          <Link href="/login" className="hover:text-white">Owner login</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">Staff desk · noindex · not live</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
          Myke, Tom, Kenzy, line, dish.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          Ticket out of the printer, bag and tag, driver area, grab, hit dispatch, leave, come back.
          Kenzy is FOH only. Myke owns the drawer and the bank. The 11–1 weekday slot has no name on this desk.
          Owner /login stays owner-only. Staff login fails closed.
        </p>
        <div className="mt-10">
          <StaffRoleDayDesk />
        </div>
      </div>
    </main>
  );
}
