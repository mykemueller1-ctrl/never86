import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Seat request pending | Never 86'd",
  description: 'Your identity is verified. You have no store access until Myke or Tom approve the request.',
  robots: { index: false, follow: false },
};

export default function OneSeatPendingPage() {
  return (
    <main className="compass min-h-screen">
      <section className="max-w-md mx-auto px-6 pt-28">
        <p className="compass-eyebrow mb-4">— Pending</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Waiting on approval.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          You are signed in as a verified person, not a store seat. No checklists, schedule, or money until Myke or Tom match you to the roster.
        </p>
        <p className="text-[13px]" style={{ color: '#6e6e73' }}>
          Owner door:{' '}
          <Link href="/login" className="underline">/login</Link>
          . Approvals:{' '}
          <Link href="/staff/approvals" className="underline">/staff/approvals</Link>.
        </p>
      </section>
    </main>
  );
}
