import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Free DoorDash Statement Audit | Never 86'd",
  description:
    'Send one redacted DoorDash, Uber Eats, or Grubhub statement. See commission, fees, promotions, refunds, true marketplace cost, and payout math.',
  alternates: {
    canonical: '/audit',
  },
  openGraph: {
    title: 'Your DoorDash commission is not your DoorDash cost.',
    description:
      'Restaurant owners: send one redacted marketplace statement. Never 86\'d will audit it free.',
    type: 'website',
    url: 'https://never86.ai/audit',
    siteName: "Never 86'd",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your DoorDash commission is not your DoorDash cost.',
    description: 'Send one redacted marketplace statement. Free audit. No login. No integration.',
  },
};

export default function AuditLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
