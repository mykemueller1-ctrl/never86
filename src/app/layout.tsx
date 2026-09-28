import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google';
import './globals.css';
import { LogicToggle } from '@/components/LogicToggle';
import { DiscoveryReferralTracker } from '@/components/DiscoveryReferralTracker';
import { SiteAnalytics } from '@/components/SiteAnalytics';
import { SHARE_IMAGE } from '@/lib/seoAeo';

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
  title: {
    default: "Never86'd — Find the leak. Keep the receipt.",
    template: "%s",
  },
  description:
    "Back office for independent restaurants. Drop invoices and Z reports. The owner seat answers from your papers. Try a sample free. No card. First owner seat is free.",
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
    title: "Never86'd — Find the leak. Keep the receipt.",
    description: 'Drop invoices and Z reports. The owner seat answers from your papers. First seat is free. No card.',
    url: 'https://www.never86.ai',
    siteName: "Never 86'd",
    type: 'website',
    images: [{ url: SHARE_IMAGE, width: 1200, height: 630, alt: "Never 86'd operator demo" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never86'd — Find the leak. Keep the receipt.",
    description: 'Independent restaurant back office. Try it free. No card. First owner seat is free.',
    images: [SHARE_IMAGE],
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
    employee: [
      { '@type': 'Person', name: 'Victor Hatungimana', jobTitle: 'Field storytelling and On the Line 515' },
      { '@type': 'Person', name: 'Kristin Aduna', jobTitle: 'Product discipline and operator discovery' },
      { '@type': 'Person', name: 'Rik Reinhardt', jobTitle: 'Cofounder and hospitality systems' },
    ],
    slogan: 'The restaurant and its problems come first.',
    description: "Back office for independent restaurants, built by Myke Mueller while he runs Community Tap & Pizza in Fort Dodge, Iowa. An owner drops in invoices and Z reports. The seat answers from those papers and tags every figure Verified, Estimated, or Missing.",
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
    sameAs: ['https://www.linkedin.com/in/myke-mueller-341b1b2a8/'],
    knowsAbout: ['restaurant operations', 'restaurant financial controls', 'restaurant technology'],
  };
  const applicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': 'https://www.never86.ai/#application',
    name: "Never86'd",
    url: 'https://www.never86.ai/',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    provider: { '@id': 'https://www.never86.ai/#organization' },
    audience: { '@type': 'Audience', audienceType: 'Independent restaurant owners' },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'First owner seat is free. No card to start. Extra seats are not priced yet.',
    },
    featureList: [
      'Invoice and Z-report owner seat',
      'Verified, Estimated, and Missing labels',
      'DoorDash statement math from totals you type',
      'Free sample with no account',
    ],
  };
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <meta name="google-site-verification" content="7_Mp6149Pt9P_7j3fun78FYuHlDliqm2sDVLW3kqTDs" />
        <meta name="msvalidate.01" content="F9AB0D73ED3E649140231C5C76174510" />
        <link rel="alternate" type="application/atom+xml" title="Never 86'd operator evidence seat" href="https://www.never86.ai/answers/feed.xml" />
      </head>
      <body className="font-sans antialiased" style={{ background: '#fbfbfd' }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(founderJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd) }} />
        {children}
        <DiscoveryReferralTracker />
        <LogicToggle />
        <SiteAnalytics />
      </body>
    </html>
  );
}
