import HomePage from '@/components/OwnerHome';
import { publicPageMetadata } from '@/lib/seoAeo';

export const metadata = {
  ...publicPageMetadata({
    path: '/',
    title: "Find the leak. Keep the receipt. | Never86'd",
    description:
      "One Seat for independent restaurants. Drop invoices and Z reports. Try a free sample with no card, then claim the free owner seat.",
  }),
  alternates: { canonical: 'https://www.never86.ai/' },
};

export default function RootPage() {
  return <HomePage />;
}
