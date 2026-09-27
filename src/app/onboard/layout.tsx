import type { Metadata } from 'next';
import { OnboardStartBeacon } from '@/components/OnboardStartBeacon';
import { publicPageMetadata } from '@/lib/seoAeo';

export const metadata: Metadata = {
  ...publicPageMetadata({
    path: '/onboard',
    title: "Claim the free owner seat | Never 86'd",
    description: "One restaurant. One owner seat. Free to start. No card. Bring the papers you already have.",
  }),
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OnboardStartBeacon />
      {children}
    </>
  );
}
