import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Restaurant operators | Never 86'd",
  description: 'Restaurant operating intelligence and free evidence-first checks for independent and multi-unit operators.',
  alternates: { canonical: 'https://www.never86.ai/operators' },
};

export default function OperatorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
