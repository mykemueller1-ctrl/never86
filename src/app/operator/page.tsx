import type { Metadata } from 'next';
import { FreeOperatorPhone } from '@/components/FreeOperatorPhone';

export const metadata: Metadata = {
  title: "Owner desk — 1–3 unit Action Shift | Never 86'd",
  description:
    'Phone-first owner seat for 1–3 unit operators: Action Shift, Prime Cost Coach, labor and beverage asks. Sample answers stay fictional. Files stay on this phone.',
  alternates: { canonical: 'https://www.never86.ai/operator' },
  openGraph: {
    title: "Owner desk — 1–3 unit Action Shift | Never 86'd",
    description: 'Not a dashboard. Need or Ready only. No invented close. No private restaurant data yet.',
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
