import { LaborLeakFrame, LaborLeakBody } from '@/components/LaborLeakView';
import { DEMO_LABOR_LEAK } from '@/lib/demoData';

export const metadata = { title: "Labor Leak (Demo) | Never 86'd" };

export default function LaborLeakDemoPage() {
  return (
    <LaborLeakFrame sample>
      <LaborLeakBody data={DEMO_LABOR_LEAK} sample />
    </LaborLeakFrame>
  );
}
