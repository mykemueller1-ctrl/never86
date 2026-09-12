import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: "Restaurant operator intelligence for payroll, prices & process | Never86'd",
  description:
    "Operator-built restaurant intelligence for independent owners. Bring schedules, labor records, invoices, closes, or marketplace statements and get a source-backed next action. One owner seat is free for one store.",
  alternates: { canonical: 'https://www.never86.ai/' },
  openGraph: {
    title: "Too many hats. Start with one problem. | Never86'd",
    description:
      'Bring one real restaurant problem and the evidence you already have. Never86’d helps find the leak, show the source, and work through the next move.',
    url: 'https://www.never86.ai/',
  },
};

export default function RootPage() {
  return <HomePage />;
}
