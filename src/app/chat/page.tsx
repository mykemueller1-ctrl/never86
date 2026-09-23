import type { Metadata } from 'next';
import { OneSeatPanels } from '@/components/OneSeatPanels';
import { OneSeatPublicShell } from '@/components/OneSeatPublicShell';
import { PapersChatIntake } from '@/components/PapersChatIntake';

export const metadata: Metadata = {
  title: 'Ask Never86’d | One Seat',
  description:
    'Ask maps invoices, labor, menu, and what is still Missing. A sentence is not a price. Gmail stays Missing until a pull lands.',
  alternates: { canonical: 'https://www.never86.ai/chat' },
};

export default function ChatPage() {
  return (
    <OneSeatPublicShell
      eyebrow="ONE SEAT · ASK"
      title="Ask what is still Missing."
      lede="Ask routes to a paper. Name a file or drop a PDF. A typed dollar is Estimated. It is not a SKU price. Honesty stays Verified, Estimated, or Missing."
    >
      <OneSeatPanels initial="ask" ask={<PapersChatIntake />} />
    </OneSeatPublicShell>
  );
}
