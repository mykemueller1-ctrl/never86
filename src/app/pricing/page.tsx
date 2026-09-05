import Link from 'next/link';
import type { Metadata } from 'next';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: "Pricing · Never 86'd",
  description:
    '1–3 unit ICP: one owner seat free. Owner $199/mo for independents. Multi-unit Command Center is a separate build.',
  alternates: { canonical: 'https://www.never86.ai/pricing' },
  openGraph: {
    title: "Never 86'd · Pricing",
    description:
      '1–3 unit ICP: one owner seat free. Owner $199/mo for independents. Multi-unit Command Center is a separate build.',
    url: 'https://www.never86.ai/pricing',
  },
};

const TIERS = [
  {
    name: 'Action Shift · Beta',
    tag: '1–3 unit ICP · seat 1 free',
    price: 'Free',
    blurb:
      'For independent operators. Claim the owner seat, forward or upload yesterday\'s close, and get one morning move plus night proof.',
    features: [
      'Seat 1 = owner · free for one store and one login',
      'Seats 2–3 (GM / station) unlock as paid expansion',
      'Up to 3 ranked, evidence-backed actions',
      'Email-only onboarding — no POS API key required',
    ],
    cta: { label: 'Claim free owner seat →', href: '/onboard' },
    accent: false,
  },
  {
    name: "Never 86'd Owner",
    tag: '1–3 location independents',
    price: '$199/mo',
    blurb:
      'The paid 1–3 unit operator plan. Morning Brief from your own numbers: where margin leaked, who owns the fix, what happens next. Charter rate for the first 100 operators · 30-day refund.',
    features: [
      'Everything in Action Shift for your owner seat',
      'Add seat 2 and seat 3 when the GM or station lead needs the workflow',
      'Food cost every day, plus prime cost trend over 30/60/90 days',
      'Vendor price compare across the invoices you already get',
      'One plain fix per leak — what to do, not just what broke',
      '90 days of history · your data walled off from every other operator',
    ],
    cta: { label: 'Become a Charter Operator →', href: '/onboard' },
    accent: true,
  },
  {
    name: "Never 86'd Command",
    tag: 'Multi-unit ICP · separate build',
    price: '$499/location/mo',
    blurb:
      'Different product track. Group rollup, role desks, and multi-store comparison — not the 1–3 unit owner-seat path.',
    features: [
      'Everything in Owner, for every store',
      'Every store compared against the rest of your group',
      'A screen built for each person · CEO / CFO / COO / Chef / Owner',
      'Accountable actions — every fix assigned to a name',
      'Unlimited history',
      'Dedicated onboarding call with Myke',
    ],
    cta: { label: 'Talk multi-unit Command →', href: 'mailto:myke@never86.ai?subject=Multi-unit%20Command%20Center' },
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
    cta: { label: 'Email myke@never86.ai', href: 'mailto:myke@never86.ai?subject=Enterprise%20pricing%20-%20never86' },
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
    a: 'The 1–3 unit beta starts with one store and the owner seat free. Forward or upload the prior-day close and Never 86\'d returns up to three morning actions plus a night proof check. Seat 2, seat 3, extra stores, and role controls are paid expansion. Multi-unit Command Center is a separate build.',
  },
  {
    q: 'Is this the multi-unit Command Center?',
    a: 'No. This pricing page leads with the 1–3 unit operator ICP: owner seat first. Command Center is the multi-unit track for groups that need rollups across more stores and roles.',
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
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· pricing</span>
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
          1–3 unit ICP. <em>Owner seat free. Then pay for seats.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl">
          Built by an operator. Priced like one. Start with one store and the owner seat free: one morning decision, one night proof check. Owner is for 1–3 location independents. Command Center is the separate multi-unit build. Enterprise is 10+ multi-brand.
        </p>
        <p className="compass-body text-lg md:text-xl max-w-2xl mt-4">
          The proof behind the price: in a working design pilot with a 16-unit chef-led group, this tool analyzed <span className="text-ink-800 font-semibold">545,677 orders</span> — $15.72M checked to the cent — and surfaced an estimated $1.81M of annual leak, every figure labeled. <span className="font-serif italic text-ink-600">(If we don&apos;t find you money, don&apos;t buy.)</span>
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
              <p className="font-serif text-4xl text-ink-800 mt-4 mb-2" style={{ letterSpacing: '-0.02em' }}>
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
                  : { background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f', border: '1px solid #d2d2d7' }}
              >
                {t.cta.label}
              </TrackedLink>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e8e8ed] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="compass-eyebrow mb-4">— Questions</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            FAQ.
          </h2>
          <div className="space-y-8">
            {FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-serif text-xl md:text-2xl text-ink-800 mb-3">{f.q}</h3>
                <p className="compass-body leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e8e8ed] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <TrackedLink href="/trial"   event="pricing_footer_click" meta={{ target: '/trial',   label: 'Trial' }}   className="hover:text-ink-800 transition-colors">Trial</TrackedLink>
            <TrackedLink href="/onboard" event="pricing_footer_click" meta={{ target: '/onboard', label: 'Onboard' }} className="hover:text-ink-800 transition-colors">Onboard</TrackedLink>
            <TrackedLink href="/"        event="pricing_footer_click" meta={{ target: '/',        label: 'Home' }}    className="hover:text-ink-800 transition-colors">Home</TrackedLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
