import Link from 'next/link';
import type { Metadata } from 'next';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: "Pricing · Never 86'd",
  description: 'Three tiers. No contact-us-for-pricing nonsense.',
  alternates: { canonical: 'https://never86.ai/pricing' },
  openGraph: {
    title: "Never 86'd · Pricing",
    description: 'Three tiers. Free trial. Transparent. Built by operators.',
    url: 'https://never86.ai/pricing',
  },
};

const TIERS = [
  {
    name: 'Trial',
    tag: '60 minutes',
    price: 'Free',
    blurb: 'Drop a CSV. See your real leak. No card.',
    features: [
      'Void Hunter on your live POS export',
      'Per-store + per-name breakdown',
      'Source-tagged Verified figures',
      'No signup required',
    ],
    cta: { label: 'Start the hour →', href: '/trial' },
    accent: false,
  },
  {
    name: 'Pulse',
    tag: '1–2 unit independents',
    price: '$199/mo',
    blurb: 'Your office. In your pocket. Daily food cost · cross-vendor cheapest-price · one coach card per leak.',
    features: [
      'All 7 production agents wired to your live POS',
      'Daily food cost · 30/60/90-day prime cost trend',
      'Cross-vendor cheapest-price compare (PFG vs Sysco vs Nicholas & Co)',
      'One coach card per leak — telling you what to do, not just showing it',
      'Per-name alerts (email + SMS)',
      '90-day history · operator_id isolation today, DB-per-operator Q3',
    ],
    cta: { label: 'Join the Pulse waitlist →', href: '/onboard' },
    accent: true,
  },
  {
    name: 'Operator Suite',
    tag: '3–9 unit small chains',
    price: '$999/mo',
    blurb: 'The compass view. Network-level peer bands. Roll-up + drill-down. (Pricing TBD — flagged for Myke 2026-06-27.)',
    features: [
      'Everything in Pulse',
      'Peer-band analysis across your fleet',
      'Per-role lens · CEO / CFO / COO / Owner',
      'Slack + Teams integration',
      'Unlimited history',
      'Dedicated onboarding call with Myke',
    ],
    cta: { label: 'Talk to us →', href: '/onboard' },
    accent: false,
  },
  {
    name: 'Enterprise',
    tag: '10+ units · PE-backed · multi-brand',
    price: 'Contact us',
    blurb: 'Multi-brand · SSO · custom integrations · dedicated environment.',
    features: [
      'Everything in Operator Suite',
      'Per-brand isolation',
      'SSO (Okta · Azure AD · Google)',
      'Custom POS integration · NCR Aloha · PDQ · proprietary',
      'API access · MCP endpoint',
      'Quarterly business review',
    ],
    cta: { label: 'Email myke@n86.app', href: 'mailto:myke@n86.app?subject=Enterprise%20pricing%20-%20never86' },
    accent: false,
  },
];

const FAQS = [
  {
    q: 'What if my POS isn\'t supported yet?',
    a: 'Drop a CSV export from any POS — if the columns map (Location / Employee / Net / Voids), we run on it today. OAuth wiring for Toast / Lightspeed / Aloha is in motion — join the waitlist on /trial.',
  },
  {
    q: 'Are figures audited?',
    a: 'Every number ships source-tagged: Verified (re-pullable from a primary source), Estimated (modeled from a benchmark, assumption named), Unverified (illustrative, source not wired). The trail is on the page next to every figure.',
  },
  {
    q: 'How does the free trial work?',
    a: 'Hit /trial, click Start. You get 60 minutes to drop as many CSVs as you want. After the hour, the read is saved if you entered an email — no credit card required to keep the saved read.',
  },
  {
    q: 'What about data security?',
    a: 'Your CSV uploads are processed in memory and never persisted on the trial path. On a paid plan today: operator_id isolation across one Neon Postgres (every query scoped per tenant). Q3 roadmap: full DB-per-operator (one Neon project per signed operator). We never train models on your data.',
  },
];

export default function PricingPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· pricing</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Pulse · Operator Suite · Enterprise · transparent tiers</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <TrackedLink href="/trial"   event="pricing_nav_click" meta={{ target: '/trial',   label: 'Try free' }} className="compass-pill"><span className="avatar">T</span><span>Try free</span></TrackedLink>
            <TrackedLink href="/onboard" event="pricing_nav_click" meta={{ target: '/onboard', label: 'Onboard your store' }} className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</TrackedLink>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-12">
        <p className="compass-eyebrow mb-6">— Pricing</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          Pulse $199. <em>The back-office a small operator never had.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl">
          Built by an operator. Priced like one. Try it free for an hour — see your real leak before you decide. Pulse is for 1–2 unit independents; Operator Suite for 3–9 units; Enterprise for 10+ unit multi-brand groups.
        </p>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="compass-card flex flex-col"
              style={t.accent ? { borderColor: '#0066ff' } : {}}
            >
              <p className="compass-card-label" style={t.accent ? { color: '#0066ff' } : {}}>{t.tag}</p>
              <h3>{t.name}</h3>
              <p className="font-serif text-4xl text-white mt-4 mb-2" style={{ letterSpacing: '-0.02em' }}>
                {t.price}
              </p>
              <p className="compass-body text-[14px] mb-6">{t.blurb}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="compass-body text-[14px] flex gap-2">
                    <span style={{ color: t.accent ? '#0066ff' : '#34c759' }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <TrackedLink
                href={t.cta.href}
                event="pricing_tier_cta_click"
                meta={{ tier: t.name.toLowerCase(), target: t.cta.href, label: t.cta.label, price: t.price, accent: !!t.accent }}
                className="btn-primary mt-auto"
                style={t.accent
                  ? { background: '#0066ff' }
                  : { background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff', border: '1px solid #2c2c2e' }}
              >
                {t.cta.label}
              </TrackedLink>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="compass-eyebrow mb-4">— Questions</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            FAQ.
          </h2>
          <div className="space-y-8">
            {FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-serif text-xl md:text-2xl text-white mb-3">{f.q}</h3>
                <p className="compass-body leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <TrackedLink href="/trial"   event="pricing_footer_click" meta={{ target: '/trial',   label: 'Trial' }}   className="hover:text-white transition-colors">Trial</TrackedLink>
            <TrackedLink href="/onboard" event="pricing_footer_click" meta={{ target: '/onboard', label: 'Onboard' }} className="hover:text-white transition-colors">Onboard</TrackedLink>
            <TrackedLink href="/"        event="pricing_footer_click" meta={{ target: '/',        label: 'Home' }}    className="hover:text-white transition-colors">Home</TrackedLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
