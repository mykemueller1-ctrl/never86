import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { LogicToggle } from '@/components/LogicToggle';

const display = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Never 86'd — Restaurant Financial Intelligence",
  description:
    'Built by an operator, for operators. The only restaurant platform that ships every figure source-tagged — and shows its work on every number.',
  openGraph: {
    title: "Never 86'd",
    description: 'Operator-turned-founder native AI for multi-unit restaurants.',
    url: 'https://never86.ai',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased bg-dark-900 text-dark-50">
        {children}
        <LogicToggle />
      </body>
    </html>
  );
}
