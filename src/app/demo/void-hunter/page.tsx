import { VoidHunterFrame, VoidHunterBody } from '@/components/VoidHunterView';
import { DEMO_VOID_HUNTER } from '@/lib/demoData';

export const metadata = {
  title: "Void Hunter (Demo) | Never 86'd",
  description: 'Explore a clearly labeled sample restaurant void-control workflow.',
  alternates: { canonical: 'https://www.never86.ai/demo/void-hunter' },
};

// Public, no login. Renders the real Void Hunter UI on clearly-labeled sample
// data so cold traffic can try the tool without exposing any operator's data.
export default function VoidHunterDemoPage() {
  return (
    <VoidHunterFrame sample>
      <VoidHunterBody data={DEMO_VOID_HUNTER} sample />
    </VoidHunterFrame>
  );
}
