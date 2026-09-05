import type { Metadata } from 'next';
import { SimpleOwnerDemo } from '@/components/FreeOperatorPhone';

export const metadata: Metadata = {
  title: "Owner desk — Community Tap seat 1 | Never 86'd",
  description:
    'Operator V2 plates desk for Community Tap seat 1: schedule, labor cards, menu, order guide. Chat composer. Not a dashboard.',
  alternates: { canonical: 'https://www.never86.ai/operator' },
  openGraph: {
    title: "Owner desk — 1–3 unit Action Shift | Never 86'd",
    description: 'Not a dashboard. Need or Ready from stored files. No invented close. No private CTAP data.',
    url: 'https://www.never86.ai/operator',
  },
};

export default function OperatorPhonePage() {
  return (
    <main className="owner-desk-page min-h-screen">
      <SimpleOwnerDemo />
    </main>
  );
}
