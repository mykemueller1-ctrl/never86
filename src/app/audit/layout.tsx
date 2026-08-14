import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Free Marketplace Statement Audit | Never 86'd",
  description:
    'Send one redacted DoorDash, Uber Eats, Grubhub, or ezCater statement. See commission, fees, promotions, error charges, true marketplace cost, and payout math.',
  alternates: {
    canonical: '/audit',
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

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
