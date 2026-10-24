import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Never86.ai | Operator OS for 1 to 5 units',
  description:
    'One location and the owner seat are free. Never86.ai turns yesterday\'s close into a week tally and at most three moves for up to 9 units.',
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
