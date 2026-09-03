import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: "Payroll, prices, process — restaurant operator | Never 86'd",
  description:
    "Never 86'd reads labor, invoice, and operating evidence to find the leak, keep the receipt, and give restaurant operators the next move.",
  alternates: { canonical: 'https://www.never86.ai/' },
  openGraph: {
    title: "Find the leak. Run the fix. | Never 86'd",
    description:
      "Payroll. Prices. Process. Open with one verified email and try the real restaurant operator.",
    url: 'https://www.never86.ai/',
  },
};

export default function Page() {
  return <HomePage />;
}
