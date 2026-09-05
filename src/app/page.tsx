import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: "Claim the free owner seat | Never 86'd",
  description:
    "Email-first free owner seat. Watch the recorded demo, then give your email. Payroll. Prices. Process. Not another dashboard.",
  alternates: { canonical: 'https://www.never86.ai/' },
  openGraph: {
    title: "Find the leak. Run the fix. | Never 86'd",
    description:
      'Watch the recorded demo, then give your email to claim the free owner seat. Payroll. Prices. Process.',
    url: 'https://www.never86.ai/',
  },
};

export default function RootPage() {
  return <HomePage />;
}
