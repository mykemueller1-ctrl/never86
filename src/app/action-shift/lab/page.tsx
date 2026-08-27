import type { Metadata } from 'next';
import { CtapLabPackDesk } from '@/components/CtapLabPackDesk';

export const metadata: Metadata = {
  title: 'CTap lab templates',
  robots: { index: false, follow: false },
};

export default function CtapLabPackPage() {
  return <CtapLabPackDesk />;
}
