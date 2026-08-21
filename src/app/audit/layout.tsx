import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The campaign page reads UTM parameters with useSearchParams. Forcing dynamic
// rendering prevents Next.js production builds from requiring a separate
// Suspense wrapper for the page-level client component.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Free Marketplace Statement Audit | Never 86'd",
  description:
    'Send one redacted DoorDash statement. See what the evidence supports, what is missing, and what to do next. Uber Eats and Grubhub are early access.',
  alternates: {
    canonical: 'https://never86.ai/audit',
  },
  openGraph: {
    title: 'Your DoorDash commission is not your DoorDash cost.',
    description:
      'One redacted statement. Free audit. No portal password, no integration, and no fake recovery claim.',
    url: 'https://never86.ai/audit',
    siteName: "Never 86'd",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Where did your delivery money go?',
    description: 'Send one redacted statement. Never 86’d will audit it free.',
  },
};

export default function AuditLayout({ children }: { children: ReactNode }) {
  return children;
}
