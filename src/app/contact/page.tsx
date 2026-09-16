import type { Metadata } from 'next';
import Link from 'next/link';
import OnboardPage from '@/app/onboard/OnboardClient';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: 'Claim the free owner seat | Never86’d',
  description: 'One location + one owner seat is free. Operators claim the seat on never86.ai — not ChatGPT.',
  alternates: { canonical: 'https://www.never86.ai/contact' },
};

export default function ContactPage() {
  return (
    <>
      <OnboardPage />
      <p style={{ textAlign: 'center', padding: '0 24px 48px', color: '#526175' }}>
        Already have a password? <Link href={ONE_SEAT_PATHS.login}>Sign in on this site</Link>.
        {' '}This door stays on never86.ai.
      </p>
    </>
  );
}
