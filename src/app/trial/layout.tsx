import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Free owner seat | Never 86'd",
  description: 'The first owner seat is free for one restaurant and one login. Claim it at /onboard. This page also runs a timed CSV check.',
  openGraph: {
    title: "Never 86'd · free owner seat",
    description: 'One restaurant. One login. Claim the free owner seat, or run a timed CSV check on this page.',
    url: 'https://www.never86.ai/trial',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd · free owner seat",
    description: 'One restaurant. One login. Claim the free owner seat.',
  },
  alternates: { canonical: 'https://www.never86.ai/trial' },
};

export default function TrialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
