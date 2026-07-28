import { TipVarianceFrame, TipVarianceBody } from '@/components/TipVarianceView';
import { DEMO_TIP_VARIANCE } from '@/lib/demoData';

export const metadata = { title: "Tip Variance (Demo) | Never 86'd" };

export default function TipVarianceDemoPage() {
  return (
    <TipVarianceFrame sample>
      <TipVarianceBody data={DEMO_TIP_VARIANCE} sample />
    </TipVarianceFrame>
  );
}
