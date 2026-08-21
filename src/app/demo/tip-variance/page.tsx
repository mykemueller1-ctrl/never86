import { TipVarianceFrame, TipVarianceBody } from '@/components/TipVarianceView';
import { DEMO_TIP_VARIANCE } from '@/lib/demoData';

export const metadata = {
  title: "Tip Variance (Demo) | Never 86'd",
  description: 'Explore a clearly labeled sample restaurant tip-variance workflow.',
  alternates: { canonical: 'https://www.never86.ai/demo/tip-variance' },
};

export default function TipVarianceDemoPage() {
  return (
    <TipVarianceFrame sample>
      <TipVarianceBody data={DEMO_TIP_VARIANCE} sample />
    </TipVarianceFrame>
  );
}
