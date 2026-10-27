import type { Metadata } from 'next';
import { ActionShiftMorning } from '@/components/ActionShiftMorning';

export const metadata: Metadata = {
  title: "Action Shift — one owner, one free seat | Never86'd",
  description:
    'One product. One owner. One free seat. Example data only: mozzarella $48 to $56. ChatGPT, Gemini, and Grok open this seat.',
  alternates: { canonical: 'https://www.never86.ai/action-shift' },
};

export default function SeatPage() {
  return <ActionShiftMorning page="home" />;
}
