import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.never86.ai/' },
  openGraph: { url: 'https://www.never86.ai/' },
};

export default function Page() {
  return <HomePage />;
}
