import type { Metadata } from 'next';
import Link from 'next/link';
import { StaffLoginForm } from '@/components/StaffLoginForm';

export const metadata: Metadata = {
  title: "Staff seat login | Never 86'd",
  description: 'Staff station seats fail closed without DATABASE_URL. Owner /login remains the owner plane.',
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
            <p className="compass-eyebrow-dim mt-2">Fails closed until Neon apply. Owner /login stays owner-only.</p>
          </span>
        </Link>
      </div>

      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28">
        <p className="compass-eyebrow mb-4">— Staff seat sign in</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Staff seat sign in.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          This door never copies the owner credential. It fails closed without DATABASE_URL, hashes invite tokens only, and does not send mail.
        </p>
        <StaffLoginForm />
      </section>
    </main>
  );
}
