import type { Metadata } from 'next';
import { OperatorDemo } from '@/components/OperatorDemo';

export const metadata: Metadata = {
  title: "Try the operator desk | Never86’d",
  description: 'Try three restaurant checks with fictional sample records. Compare invoice prices, scheduled hours and the cost of a pour. No account required.',
  robots: { index: false, follow: true },
  openGraph: {
    title: "See what changed. Know what to do. | Never86’d",
    description: 'An interactive restaurant operator demo. Fictional sample records. One useful check, one next action.',
  },
};

export default function OperatorDemoPage() {
  return <OperatorDemo />;
}
