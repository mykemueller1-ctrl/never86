import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Rate Card Audit (Demo) | Never 86'd",
  description: 'Explore a clearly labeled delivery rate-card comparison without uploading restaurant data.',
  alternates: { canonical: 'https://www.never86.ai/demo/rate-card-audit' },
};

export default function RateCardAuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
