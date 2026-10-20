import { ActionShiftMorning } from '@/components/ActionShiftMorning';
import { publicPageMetadata } from '@/lib/seoAeo';

export const metadata = publicPageMetadata({
  path: '/try',
  title: "Try the sample — Action Shift | Never86'd",
  description:
    'Sample restaurant, four steps: invoices, menu, sales, then one morning move. Mozzarella $48 to $56. Open the app.',
});

export default function TryPage() {
  return <ActionShiftMorning page="try" />;
}
