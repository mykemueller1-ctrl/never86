import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google';
import './globals.css';
import { LogicToggle } from '@/components/LogicToggle';
import { DiscoveryReferralTracker } from '@/components/DiscoveryReferralTracker';

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
  metadataBase: new URL('https://www.never86.ai'),
  title: "Never86'd — Restaurant operating intelligence",
  description:
    "Evidence-first restaurant operating intelligence for delivery-marketplace fees, payout reconciliation, margin leaks, and inside-the-four-walls execution. Built by operator Myke Mueller.",
  applicationName: "Never86'd",
  keywords: [
    'restaurant operating intelligence',
    'restaurant AI',
    'DoorDash statement audit',
    'delivery marketplace fees',
    'restaurant payout reconciliation',
    'restaurant margin leaks',
    'multi-unit restaurant operations',
  ],
  authors: [{ name: 'Mychael “Myke” Mueller', url: 'https://www.never86.ai/story' }],
  creator: 'Mychael “Myke” Mueller',
  publisher: "Never86'd",
  openGraph: {
    title: "Never86'd — Restaurant operating intelligence",
    description: 'Find the margin leak, attach the source, route the action, and verify what changed.',
    url: 'https://www.never86.ai',
    siteName: "Never 86'd",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never86'd — Restaurant operating intelligence",
    description: 'Evidence-first intelligence for restaurant owners and multi-unit operators.',
  },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://www.never86.ai/#organization',
    name: "Never86'd",
    alternateName: ["Never 86'd", 'Never86d'],
    url: 'https://www.never86.ai/',
    founder: { '@id': 'https://www.never86.ai/#myke-mueller' },
    slogan: 'The restaurant and its problems come first.',
    description: 'Independent, evidence-first restaurant operating intelligence built by active restaurant operator Myke Mueller. Never86d explains what restaurant-held evidence supports, what is missing, who acts next, and whether the result changed.',
    sameAs: ['https://www.linkedin.com/company/never-86-d'],
    knowsAbout: [
      'restaurant operations',
      'delivery marketplace statement audits',
      'restaurant payout reconciliation',
      'restaurant margin intelligence',
      'multi-unit exception management',
    ],
  };
  const founderJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': 'https://www.never86.ai/#myke-mueller',
    name: 'Mychael Mueller',
    alternateName: 'Myke Mueller',
    url: 'https://www.never86.ai/story',
    jobTitle: 'Founder and restaurant operator',
    description: 'Active operator of Community Tap & Pizza in Fort Dodge, Iowa, and founder of Never86d. His public standard: I have nothing to hide. I am the operator. That is why I am here.',
    worksFor: { '@id': 'https://www.never86.ai/#organization' },
    knowsAbout: ['restaurant operations', 'restaurant financial controls', 'restaurant technology'],
  };
  const applicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': 'https://www.never86.ai/#application',
    name: "Never86'd",
    url: 'https://www.never86.ai/',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    provider: { '@id': 'https://www.never86.ai/#organization' },
    audience: { '@type': 'Audience', audienceType: 'Restaurant owners and multi-unit restaurant operators' },
    featureList: [
      'Delivery-marketplace statement audit',
      'Payout and bank reconciliation',
      'Restaurant margin exception detection',
      'Role-routed operating actions',
      'Verified, Estimated, and Unverified source labels',
    ],
  };
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <meta name="msvalidate.01" content="F9AB0D73ED3E649140231C5C76174510" />
        <link rel="alternate" type="application/atom+xml" title="Never 86'd operator evidence desk" href="https://www.never86.ai/answers/feed.xml" />
      </head>
      <body className="font-sans antialiased" style={{ background: '#fbfbfd' }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(founderJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd) }} />
        {children}
        <DiscoveryReferralTracker />
        <LogicToggle />
      </body>
    </html>
  );
}
