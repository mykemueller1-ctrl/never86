import type { Metadata } from 'next';
import { SimpleOwnerDemo } from '@/components/FreeOperatorPhone';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { OperatorSignIn } from './OperatorSignIn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Owner desk — Community Tap seat 1 | Never 86'd",
  description:
    "You're not crazy. The stack is. Weight off the plate for Community Tap seat 1. No back-office homework. Not a dashboard.",
  alternates: { canonical: 'https://www.never86.ai/operator' },
  openGraph: {
    title: "Owner desk — 1–3 unit Action Shift | Never 86'd",
    description: 'Not a dashboard. Need or Ready from stored files. No invented close. No private CTAP data.',
    url: 'https://www.never86.ai/operator',
  },
};

export default async function OperatorPhonePage() {
  const session = await readOperatorSession();
  if (!session) {
    return <OperatorSignIn />;
  }
  return (
    <main className="owner-desk-page min-h-screen">
      <SimpleOwnerDemo />
    </main>
  );
}
