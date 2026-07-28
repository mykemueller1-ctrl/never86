import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Connect · 30-second Void Hunter on your CSV · Never 86'd",
  description: 'Drop a Toast / Square / Clover / PDQ employee-performance CSV. Void Hunter runs in 30 seconds. No signup, no card, no human in the loop.',
  openGraph: {
    title: "Never 86'd · Drop a CSV, see the leak in 30 seconds",
    description: 'No signup. No POS wiring. Drop your employee-performance export — Void Hunter runs on real data.',
    url: 'https://never86.ai/connect',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd · 30-second CSV → leak read",
    description: 'No signup. Drop a CSV. See the leak.',
  },
  alternates: { canonical: 'https://never86.ai/connect' },
};

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
