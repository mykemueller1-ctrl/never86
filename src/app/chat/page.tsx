import type { Metadata } from 'next';
import { PapersChatIntake } from '@/components/PapersChatIntake';
import { OneSeatPublicShell } from '@/components/OneSeatPublicShell';

export const metadata: Metadata = {
  title: 'Chat maps Missing papers | Never86’d One Seat',
  description:
    'Gmail, then a photo, then chat. The map labels each paper Verified, Estimated, or Missing. No invented dollars. Google stays Missing until client secrets exist.',
  alternates: { canonical: 'https://www.never86.ai/chat' },
};

export default function ChatPage() {
  return (
    <OneSeatPublicShell
      eyebrow="ONE SEAT · PAPERS CHAT"
      title="Chat maps what is still Missing."
      lede="This is the third papers step: Gmail, then a photo, then chat. Name a paper or drop a file. Honesty stays Verified, Estimated, or Missing. A sentence is not a price."
    >
      <PapersChatIntake />
    </OneSeatPublicShell>
  );
}
