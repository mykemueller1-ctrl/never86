import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Live trial · 60 minutes · Never 86'd",
  description: 'Drop a Toast / Square / Clover / PDQ export. Void Hunter and Leak Detector run on your real data in 30 seconds. 60-minute trial, no card.',
  openGraph: {
    title: "Never 86'd · 60-minute live trial",
    description: 'One hour. Your real numbers. Drop a CSV, see the leak, no human in the loop.',
    url: 'https://never86.ai/trial',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd · 60-minute live trial",
    description: 'Drop a CSV, see the leak. No card. No human in the loop.',
  },
  alternates: { canonical: 'https://never86.ai/trial' },
};

export default function TrialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
