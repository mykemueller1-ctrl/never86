import type { Metadata } from 'next';
import Link from 'next/link';
import { StaffWorkerHome } from '@/components/StaffWorkerHome';

export const metadata: Metadata = {
  title: "Staff Worker Home | Never 86'd",
  description: 'CTap Worker Home: Schedule with week strip, my shifts, time off, swap/cover, standing availability, coverage counts, Needs Approval. Ask, comms, miss board. Live staff credentials wait on Neon apply.',
  robots: { index: false, follow: false },
};

export default function StaffWorkerHomePage() {
  return (
    <main className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/staff/seats" className="hover:text-white">← Staff seats</Link>
          <Link href="/staff/login" className="hover:text-white">Staff login</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">Worker Home · noindex · not live</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
          Worker Home. Schedule. Ask the house.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          Schedule is the week strip, my shifts, time off (full or partial day, date, note), same-house same-seat swap or cover,
          standing availability, and coverage counts as slots — never invented names. Friday/Saturday night is 5 pizza, 3 line,
          1 dish, 3 drivers. Weekday 11–1 is an unnamed driver slot. Needs Approval is the manager inbox.
          Ask stays on the waitress quiz, dress SOP, Community Special, and pour spec. Comms rooms All / FOH / BOH.
          Miss board is Myke, Tom, and Kenzy only. Staff login fails closed without DATABASE_URL. Owner /login stays owner-only.
        </p>
        <div className="mt-10">
          <StaffWorkerHome />
        </div>
      </div>
    </main>
  );
}
