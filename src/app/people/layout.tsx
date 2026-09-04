import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Restaurant communities and shift execution | Never 86'd",
  description:
    'Communities is the Never 86\'d floor OS — live Shift Pulse, station jobs, and cohort notify. No staff PINs or private store numbers on this page.',
  alternates: {
    canonical: 'https://www.never86.ai/people',
  },
  openGraph: {
    title: "Communities — the crew sees what the back office sees | Never 86'd",
    description: 'Live Shift Pulse demo plus the Communities cohort door for restaurant floor teams.',
    url: 'https://www.never86.ai/people',
  },
};

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
