import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Never 86\'d — Operator OS for Hospitality',
  description:
    'One location plus the owner seat is free. Never 86\'d is the operator OS for hospitality: invoices, Z/POS, 3P, labor, and morning briefs with proof.',
  openGraph: {
    title: 'Never 86\'d',
    description:
      'Operator OS for hospitality with one free owner seat for a single location.',
    url: 'https://never86.ai',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
