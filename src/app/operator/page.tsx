import type { Metadata } from 'next';
import { FreeOperatorPhone } from '@/components/FreeOperatorPhone';

export const metadata: Metadata = {
  title: "Ask the house — free operator phone | Never 86'd",
  description:
    'Phone-first operator seat: talk, type, photo, or file. One leak, one coach tomorrow, needs named. Sample answers stay fictional. Files stay on this phone.',
  alternates: { canonical: 'https://www.never86.ai/operator' },
  openGraph: {
    title: "Ask the house — free operator phone | Never 86'd",
    description: 'Not a dashboard. WHAT I KNOW stays NEED or READY. No invented close. No private restaurant data yet.',
    url: 'https://www.never86.ai/operator',
  },
};

export default function OperatorPhonePage() {
  return (
    <main className="human-page min-h-screen">
      <FreeOperatorPhone />
    </main>
  );
}
