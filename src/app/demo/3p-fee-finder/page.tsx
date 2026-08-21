import { ThreePFeeFinderFrame, ThreePFeeFinderBody } from '@/components/ThreePFeeFinderView';
import { DEMO_THREE_P } from '@/lib/demoData';

export const metadata = {
  title: "3P Fee Finder (Demo) | Never 86'd",
  description: 'Explore a clearly labeled sample delivery-marketplace cost breakdown without uploading restaurant data.',
  alternates: { canonical: 'https://www.never86.ai/demo/3p-fee-finder' },
};

// Public, no login. Renders the real 3P Fee Finder UI on clearly-labeled sample
// data so cold traffic can try the tool without exposing any operator's data.
export default function ThreePFeeFinderDemoPage() {
  return (
    <ThreePFeeFinderFrame sample>
      <ThreePFeeFinderBody data={DEMO_THREE_P} sample />
    </ThreePFeeFinderFrame>
  );
}
