import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Restaurant people and shift execution | Never 86'd",
  description: 'Restaurant shift execution, operating knowledge, and practical accountability for the people inside the four walls.',
  alternates: { canonical: 'https://www.never86.ai/people' },
};

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
