import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Action Shift by Never 86'd",
  description: 'You run the place. Know what to check next. First owner seat is free for one restaurant and one login.',
  openGraph: {
    title: "Action Shift by Never 86'd",
    description: 'You run the place. Know what to check next. First owner seat is free for one restaurant and one login.',
    url: 'https://www.never86.ai/trial',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Action Shift by Never 86'd",
    description: 'You run the place. Know what to check next. One restaurant. One login.',
  },
  alternates: { canonical: 'https://www.never86.ai/trial' },
};

export default function TrialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
