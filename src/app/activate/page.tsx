import { Suspense } from 'react';
import type { Metadata } from 'next';
import ActivateClient from './ActivateClient';

export const metadata: Metadata = {
  title: "Open your operator | Never 86'd",
  description: 'Use the secure email link to open your Never 86’d operator.',
  robots: { index: false, follow: false },
};

export default function ActivateRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0c1210] text-[#e8ebe6] p-10">Loading…</main>}>
      <ActivateClient />
    </Suspense>
  );
}
