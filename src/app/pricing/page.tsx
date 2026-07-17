import Link from 'next/link';
import type { Metadata } from 'next';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: "Pricing · Never 86'd",
  description: 'Owner $199/mo. Command $499/location. Enterprise custom. Free leak audit first — no contact-us-for-pricing nonsense.',
  alternates: { canonical: 'https://never86.ai/pricing' },
  openGraph: {
    title: "Never 86'd · Pricing",
    description: 'Owner $199/mo. Command $499/location. Enterprise custom. Free leak audit first.',
    url: 'https://never86.ai/pricing',
  },
};

const TIERS = [
  {
    name: 'Free Leak Audit',
    tag: '60 minutes',
    price: 'Free',
    blurb: 'Send one sales report. See your real leak. No card.',
    features: [
      'Void Hunter on your own sales report',
      'Broken down by store and by name',
      'Every number labeled — confirmed, estimated, or a guess',
      'No signup required',
    ],
    cta: { label: 'Start the free leak audit →', href: '/trial' },
    accent: false,
  },
  {
    name: "Never 86'd Owner",
    tag: '1–2 location independents',
    price: '$199/mo',
    blurb: 'A ranked Morning Brief from your own numbers: where margin leaked, who owns the fix, what happens next. Charter rate for the first 100 operators · 30-day refund.',
    features: [
      'The Morning Brief, every day, from your own register',
      'Food cost every day, plus your prime cost trend over 30/60/90 days',
      'Cheapest-price compare across your vendors (PFG vs Sysco vs Nicholas & Co)',
      'One plain fix per leak — what to do, not just what broke',
      'Per-name alerts (email + text)',
      '90 days of history · your data walled off from every other operator',
    ],
    cta: { label: 'Become a Charter Operator →', href: '/onboard' },
    accent: true,
  },
  {
    name: "Never 86'd Command",
    tag: '3–9 location groups',
    price: '$499/location/mo',
    blurb: 'The whole-group view. Every store next to the others — roll up to the top or drill into one. Entry: a three-location, 90-day paid pilot.',
    features: [
      'Everything in Owner, for every store',
      'Every store compared against the rest of your group',
      'A screen built for each person · CEO / CFO / COO / Chef / Owner',
      'Accountable actions — every fix assigned to a name',
      'Unlimited history',
      'Dedicated onboarding call with Myke',
    ],
    cta: { label: 'Start a three-store pilot →', href: '/onboard' },
    accent: false,
  },
  {
    name: "Never 86'd Enterprise",
    tag: '10+ locations · multi-brand',
    price: 'Custom',
    blurb: 'Custom integrations, controls, and deployment scope — sized to how your group actually runs.',
    features: [
      'Everything in Command',
      'Custom scope: SSO (one company login) · custom POS · per-brand controls',
      'Scoped and priced with you — no off-the-shelf promises',
      'Quarterly business review with the founder',
    ],
    cta: { label: 'Email myke@n86.app', href: 'mailto:myke@n86.app?subject=Enterprise%20pricing%20-%20never86' },
    accent: false,
  },
];

const FAQS = [
  {
    q: 'What if my POS isn\'t supported yet?',
    a: 'Send a report from any POS — if it has the columns we need (store, employee, sales, voids), we run on it today. Direct connections to Toast, Lightspeed, and Aloha are on the way — join the waitlist on the trial page.',
  },
  {
    q: 'Can I trust the numbers?',
    a: 'Every number is labeled: Verified (we can pull it straight from the source), Estimated (our best math, and we name the assumption), or Unverified (illustrative only). The label sits right next to the figure, so you always know what\'s solid.',
  },
  {
    q: 'How does the free trial work?',
    a: 'Go to the trial page and click Start. You get 60 minutes to run as many reports as you want. After the hour, your read is saved if you entered an email — no credit card needed to keep it.',
  },
  {
    q: 'What about data security?',
    a: 'Files you upload on the trial are processed in memory and never stored. On a paid plan, your data is walled off from every other operator, and we\'re moving to a fully separate database for each one. We never train models on your data.',
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
              <p className="compass-eyebrow-dim mt-2">Owner · Command · Enterprise · transparent tiers</p>
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
          Owner $199. <em>A Morning Brief from your own numbers.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl">
          Built by an operator. Priced like one. Start with the free leak audit — see your real leak before you decide. Owner is for 1–2 location independents; Command for 3–9 location groups; Enterprise for 10+ multi-brand.
        </p>
        <p className="compass-body text-lg md:text-xl max-w-2xl mt-4">
          The proof behind the price: in a working design pilot with a 16-unit chef-led group, this tool analyzed <span className="text-white font-semibold">545,677 orders</span> — $15.72M checked to the cent — and surfaced an estimated $1.81M of annual leak, every figure labeled. <span className="font-serif italic text-white/70">(If we don&apos;t find you money, don&apos;t buy.)</span>
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
