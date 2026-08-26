import { Suspense } from 'react';
import type { Metadata } from 'next';
import ActivateClient from './ActivateClient';

export const metadata: Metadata = {
  title: "Activate your free seat | Never 86'd",
  description: 'Set your password and activate one free restaurant seat. No starter password is emailed.',
  robots: { index: false, follow: false },
};

export default function ActivateRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0c1210] text-[#e8ebe6] p-10">Loading…</main>}>
      <ActivateClient />
    </Suspense>
  );
}
