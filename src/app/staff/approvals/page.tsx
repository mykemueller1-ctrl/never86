import type { Metadata } from 'next';
import Link from 'next/link';
import { OneSeatApprovalDesk } from '@/components/OneSeatApprovalDesk';

export const metadata: Metadata = {
  title: "Seat approvals | Never 86'd",
  description: 'Myke or Tom match a verified person to the live roster and assign a role, or reject the request.',
  robots: { index: false, follow: false },
};

export default function OneSeatApprovalsPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/staff/desk" className="compass-eyebrow-dim">Worker home</Link>
      </div>
      <section className="max-w-2xl mx-auto px-6 pt-16">
        <p className="compass-eyebrow mb-4">— Myke / Tom only</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Approval inbox.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          Match the person to the roster. Assign the seat or reject. Verified identity alone is not enough.
        </p>
        <OneSeatApprovalDesk />
      </section>
    </main>
  );
}
