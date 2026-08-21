import { CateringLeakFrame, CateringLeakBody } from '@/components/CateringLeakView';
import { DEMO_CATERING_LEAK } from '@/lib/demoData';

export const metadata = {
  title: "Catering Leak (Demo) | Never 86'd",
  description: 'Explore a clearly labeled sample catering-reconciliation workflow for restaurant operators.',
  alternates: { canonical: 'https://www.never86.ai/demo/catering-leak' },
};

export default function CateringLeakDemoPage() {
  return (
    <CateringLeakFrame sample>
      <CateringLeakBody data={DEMO_CATERING_LEAK} sample />
    </CateringLeakFrame>
  );
}
