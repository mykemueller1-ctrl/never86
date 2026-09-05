import type { Metadata } from 'next';
import { NagVendorPortal } from '@/components/NagVendorPortal';

export const metadata: Metadata = {
  title: "Vendor photo intake | Never 86'd",
  description:
    'Add food and liquor vendors and attach delivery, invoice, or product photos. Every photo is source-tagged and tied to the vendor record forever.',
  alternates: { canonical: 'https://www.never86.ai/nag/vendors' },
};

export default function NagVendorsPage() {
  return <NagVendorPortal />;
}
