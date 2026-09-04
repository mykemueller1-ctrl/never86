import type { Metadata } from 'next';
import { SimpleOwnerDemo } from '@/components/FreeOperatorPhone';

export const metadata: Metadata = {
  title: "Owner desk — 1–3 unit Action Shift | Never 86'd",
  description:
    'Phone-first owner seat for 1–3 unit operators: Action Shift, Prime Cost Coach, labor and beverage asks. Asks and files persist tenant-scoped with source tags.',
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
