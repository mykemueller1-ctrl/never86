import { CateringLeakFrame, CateringLeakBody } from '@/components/CateringLeakView';
import { DEMO_CATERING_LEAK } from '@/lib/demoData';

export const metadata = { title: "Catering Leak (Demo) | Never 86'd" };

export default function CateringLeakDemoPage() {
  return (
    <CateringLeakFrame sample>
      <CateringLeakBody data={DEMO_CATERING_LEAK} sample />
    </CateringLeakFrame>
  );
}
