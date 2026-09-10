import type { Metadata } from 'next';
import { OperatorDemo } from '@/components/OperatorDemo';

export const metadata: Metadata = {
  title: "Try the owner seat | Never86’d",
  description: 'Try three restaurant checks with fictional sample records. Compare vendor price drift, whole case orders and delivery, scheduled hours and the cost of a pour. No account required.',
  robots: { index: false, follow: true },
  openGraph: {
    title: "The price moved. Let’s find out why. | Never86’d",
    description: 'An interactive restaurant operator demo. Fictional sample records. One useful check, one next action.',
  },
};

export default function OperatorDemoPage() {
  return <OperatorDemo />;
}
