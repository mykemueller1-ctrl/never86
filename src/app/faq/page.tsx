import Link from 'next/link';
import { FunnelLink } from '@/components/FunnelLink';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';
import { PUBLIC_FAQ } from '@/lib/publicFaq';
import { publicPageMetadata } from '@/lib/seoAeo';

export const metadata = publicPageMetadata({
  path: '/faq',
  title: "FAQ · Never 86'd",
  description:
    "What Never86 is, who it is for, how it differs from a POS, DoorDash and Uber Eats, and what it costs. First owner seat is free. No card.",
});

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PUBLIC_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <main className="human-page min-h-screen">
      <HumanSiteHeader />
      <article className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-20">
        <p className="human-kicker mb-6">FAQ · operators</p>
        <h1 className="font-serif text-5xl font-medium leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl mb-6">
          Questions owners <span className="italic text-[#005de8]">actually ask.</span>
        </h1>
        <p className="compass-body text-lg mb-12" style={{ color: '#515154' }}>
          Plain answers. If a price or a result is not on this site in writing, we do not invent it.
        </p>
        <div className="space-y-8">
          {PUBLIC_FAQ.map((item) => (
            <section key={item.question}>
              <h2 className="font-serif text-2xl text-[#171717]">{item.question}</h2>
              <p className="mt-3 text-lg leading-relaxed text-[#3a3a3c]">{item.answer}</p>
            </section>
          ))}
        </div>
        <div className="mt-16 pt-10 border-t border-[#e8e8ed] flex flex-wrap gap-3">
          <FunnelLink href="/try" event="cta_try" className="human-button human-button-primary">Try it free — no card</FunnelLink>
          <FunnelLink href="/onboard" event="onboard_start" className="human-button human-button-secondary">Claim free owner seat</FunnelLink>
          <Link href="/login" className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>Sign in</Link>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HumanSiteFooter />
    </main>
  );
}
