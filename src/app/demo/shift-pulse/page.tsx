import { ShiftPulseFrame, ShiftPulseBody } from '@/components/ShiftPulseView';
import { DEMO_SHIFT_PULSE } from '@/lib/demoData';

export const metadata = {
  title: "Shift Pulse (Demo) | Never 86'd",
  description: 'Explore a clearly labeled sample restaurant shift-close workflow.',
  alternates: { canonical: 'https://www.never86.ai/demo/shift-pulse' },
};

export default function ShiftPulseDemoPage() {
  return (
    <ShiftPulseFrame sample>
      <ShiftPulseBody data={DEMO_SHIFT_PULSE} sample />
    </ShiftPulseFrame>
  );
}
