import type { Metadata } from 'next';
import Link from 'next/link';
import { StaffLoginForm } from '@/components/StaffLoginForm';

export const metadata: Metadata = {
  title: "Staff seat login | Never 86'd",
  description: 'Staff station seats are not live. Operator login remains the owner plane.',
  robots: { index: false, follow: false },
};

export default function StaffLoginPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">
              Never 86&apos;d <span className="italic text-ink-600">· staff seat</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">Not live. No credentials issued.</p>
          </span>
        </Link>
      </div>

      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28">
        <p className="compass-eyebrow mb-4">— Staff seat sign in</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Not issued yet.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          Manager and station seats are drafted. This door does not mint a session, send mail, or copy the operator credential onto staff.
        </p>
        <StaffLoginForm />
      </section>
    </main>
  );
}
