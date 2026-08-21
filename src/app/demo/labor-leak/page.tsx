import { LaborLeakFrame, LaborLeakBody } from '@/components/LaborLeakView';
import { DEMO_LABOR_LEAK } from '@/lib/demoData';

export const metadata = {
  title: "Labor Leak (Demo) | Never 86'd",
  description: 'Explore a clearly labeled sample restaurant labor-variance workflow.',
  alternates: { canonical: 'https://www.never86.ai/demo/labor-leak' },
};

export default function LaborLeakDemoPage() {
  return (
    <LaborLeakFrame sample>
      <LaborLeakBody data={DEMO_LABOR_LEAK} sample />
    </LaborLeakFrame>
  );
}
