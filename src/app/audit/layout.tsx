import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The campaign page reads UTM parameters with useSearchParams. Forcing dynamic
// rendering prevents Next.js production builds from requiring a separate
// Suspense wrapper for the page-level client component.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "What did this DoorDash statement actually cost? · Never 86'd",
  description:
    'Paste one redacted statement. See eligible sales, documented deductions, expected payout, and whether variance is $0. No portal password. $0 clean math is a feature.',
  alternates: {
    canonical: 'https://www.never86.ai/audit',
  },
  openGraph: {
    title: 'What did this DoorDash statement actually cost?',
    description:
      'One redacted statement. No portal password. $0 payout variance means the statement math is clean.',
    url: 'https://www.never86.ai/audit',
    siteName: "Never 86'd",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What did this DoorDash statement actually cost?',
    description: 'Paste one redacted statement. $0 variance is a feature when the file is complete.',
  },
};

export default function AuditLayout({ children }: { children: ReactNode }) {
  return children;
}
