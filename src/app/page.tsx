import { ActionShiftMorning } from '@/components/ActionShiftMorning';
import { publicPageMetadata } from '@/lib/seoAeo';

export const metadata = {
  ...publicPageMetadata({
    path: '/',
    title: "Action Shift — One Seat, one move every morning | Never86'd",
    description:
      'One Seat. One free restaurant. A sample morning: mozzarella $48 to $56, $0.20 more a pizza, 385 sold, $77 a week. Open the app.',
  }),
  alternates: { canonical: 'https://www.never86.ai/' },
};

export default function RootPage() {
  return <ActionShiftMorning page="home" />;
}
