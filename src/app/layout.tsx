import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Never 86\'d — Restaurant Ops, Finally Fixed',
  description: 'Invoice OCR, Z-Report processing, and morning briefings for independent restaurant operators. Built by an operator, for operators.',
  openGraph: {
    title: 'Never 86\'d',
    description: 'Restaurant ops platform built by an operator, for operators.',
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
