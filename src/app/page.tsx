import type { Metadata } from 'next';
import HomePage from '@/components/OwnerHome';

export const metadata: Metadata = {
  title: "Check invoice prices, labor drift and recipe costs | Never86’d",
  description:
    "Check invoice price changes, compare schedules with time clock reports, and understand recipe costs. Built by restaurant operator Myke Mueller. First owner seat free.",
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
