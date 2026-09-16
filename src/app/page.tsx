import type { Metadata } from 'next';
import HomePage from '@/components/OwnerHome';

export const metadata: Metadata = {
  title: "One Seat — invoice, labor, and plate checks | Never86’d",
  description:
    "One Seat is Action Shift for 1–5 unit independents. Try the two-invoice mozzarella sample, then claim the free owner seat on never86.ai. No ChatGPT onboarding.",
  alternates: { canonical: 'https://www.never86.ai/' },
  openGraph: {
    title: "You run the restaurant. Let’s check the numbers. | Never86’d",
    description:
      'Bring one real restaurant problem and the evidence you already have. Never86’d helps find the leak, show the source, and work through the next move.',
    url: 'https://www.never86.ai/',
    images: [{url:'https://www.never86.ai/media/never86-landscape-v24-poster.jpg',alt:'Never86 operator demo'}],
  },
};

export default function RootPage() {
  return <HomePage />;
}
