import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: "One seat free — restaurant OS for operators | Never 86'd",
  description:
    "Yesterday's numbers, today's move, source attached. One location and one seat free. Start at /trial or prove it with a free DoorDash statement audit.",
  alternates: { canonical: 'https://www.never86.ai/' },
  openGraph: {
    title: "One seat free — restaurant OS for operators | Never 86'd",
    description:
      "Operator job: yesterday → one action → night proof. Free seat past invoice-only tools. 3P audit when you want the 60-second DoorDash receipt.",
    url: 'https://www.never86.ai/',
  },
};

export default function Page() {
  return <HomePage />;
}
