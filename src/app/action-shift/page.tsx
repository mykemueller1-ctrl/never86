import type { Metadata } from 'next';
import { ActionShiftMorning } from '@/components/ActionShiftMorning';

export const metadata: Metadata = {
  title: "Action Shift — one owner, one free seat | Never86'd",
  description:
    'One owner. One restaurant. One free seat. Example data only: mozzarella $48 to $56. No card.',
  alternates: { canonical: 'https://www.never86.ai/action-shift' },
};

export default function ActionShiftPage() {
  return <ActionShiftMorning page="home" />;
}
