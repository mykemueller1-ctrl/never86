import { Suspense } from 'react';
import type { Metadata } from 'next';
import ActivateClient from './ActivateClient';

export const metadata: Metadata = {
  title: "Set your password | Never 86'd",
  description: 'Use the secure email link to set your Never 86’d password.',
  robots: { index: false, follow: false },
};

export default function ActivateRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f5f7] p-10 text-[#475569]">Loading…</main>}>
      <ActivateClient />
    </Suspense>
  );
}
