import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google';
import './globals.css';
import { LogicToggle } from '@/components/LogicToggle';

const display = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://never86.ai'),
  title: "Never 86'd — Find the leak. Name who owns it. Keep the receipt.",
  description:
    'Restaurant financial intelligence, built by an operator. For operators.',
  openGraph: {
    title: "Never 86'd",
    description: 'Restaurant financial intelligence, built by an operator. For operators.',
    url: 'https://never86.ai',
    siteName: "Never 86'd",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd",
    description: 'Restaurant financial intelligence, built by an operator. For operators.',
  },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body className="font-sans antialiased" style={{ background: '#000' }}>
        {children}
        <LogicToggle />
      </body>
    </html>
  );
}
