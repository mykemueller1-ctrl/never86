import { ThreePFeeFinderFrame, ThreePFeeFinderBody } from '@/components/ThreePFeeFinderView';
import { DEMO_THREE_P } from '@/lib/demoData';

export const metadata = { title: "3P Fee Finder (Demo) | Never 86'd" };

// Public, no login. Renders the real 3P Fee Finder UI on clearly-labeled sample
// data so cold traffic can try the tool without exposing any operator's data.
export default function ThreePFeeFinderDemoPage() {
  return (
    <ThreePFeeFinderFrame sample>
      <ThreePFeeFinderBody data={DEMO_THREE_P} sample />
    </ThreePFeeFinderFrame>
  );
}
