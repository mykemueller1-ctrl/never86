import type { Metadata } from 'next';
import Link from 'next/link';
import { OneSeatClaimForm } from '@/components/OneSeatClaimForm';

export const metadata: Metadata = {
  title: "Request a seat | Never 86'd",
  description: 'Verify email or Google to request a CTAP seat. Verified identity does not grant store access until Myke or Tom approve.',
  robots: { index: false, follow: false },
};

export default function OneSeatClaimPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">
              Never 86&apos;d <span className="italic text-ink-600">· one seat</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">Verify first. Approval second. No private store data until then.</p>
          </span>
        </Link>
      </div>
      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28">
        <p className="compass-eyebrow mb-4">— One human, one seat</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Request a seat.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          Email or Google only. Phone and X wait. A verified login creates a pending request. Myke or Tom match the roster. This page does not send mail.
        </p>
        <OneSeatClaimForm />
      </section>
    </main>
  );
}
