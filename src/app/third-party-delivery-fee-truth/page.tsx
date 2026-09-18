import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketplaceAuditFooter, MarketplaceAuditHeader } from '@/components/MarketplaceAuditShell';
import { THREE_P_CAPTURE } from '@/lib/captureLandings';
import { ISSUE_122_3P_SLUGS, WWW } from '@/lib/seoAeo';
import { TOP_THREE_P_GUIDES } from '@/lib/threePDiscovery';

export const metadata: Metadata = {
  title: `${THREE_P_CAPTURE.title} | Never86’d`,
  description: THREE_P_CAPTURE.description,
  alternates: { canonical: THREE_P_CAPTURE.canonical },
  openGraph: {
    title: THREE_P_CAPTURE.title,
    description: THREE_P_CAPTURE.description,
    url: `${WWW}${THREE_P_CAPTURE.path}`,
  },
};

const SEARCH_TITLES = ['DoorDash fees restaurant', 'true cost delivery', 'third-party delivery fee truth'];

export default function ThirdPartyDeliveryFeeTruthPage() {
  return (
    <main className="compass min-h-screen">
      <MarketplaceAuditHeader label="Third-party delivery fee truth" />

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 md:pt-24">
        <p className="compass-eyebrow mb-6">— {THREE_P_CAPTURE.eyebrow}</p>
        <h1 className="compass-display mb-7 max-w-4xl text-5xl md:text-7xl">{THREE_P_CAPTURE.title}</h1>
        <p className="compass-body max-w-3xl text-xl leading-relaxed md:text-2xl">{THREE_P_CAPTURE.geo}</p>
        <p className="compass-body mt-5 max-w-3xl text-base">
          This page is the search door. The canonical proof stays on /audit. We do not duplicate that snapshot or
          invent a new dollar.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {SEARCH_TITLES.map((item) => (
            <span key={item} className="compass-pill">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/audit#true-cost-snapshot" className="btn-primary" style={{ background: '#0066ff' }}>
            {THREE_P_CAPTURE.snapshotCta} →
          </Link>
          <Link href="/audit" className="compass-pill">
            Open the full /audit receipt →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20" aria-labelledby="truth-method-heading">
        <article className="compass-card p-7 md:p-9">
          <p className="compass-eyebrow mb-3">— Method, not a recovery promise</p>
          <h2 id="truth-method-heading" className="compass-display mb-6 text-3xl md:text-4xl">
            Separate the lines. Then compare expected with reported payout.
          </h2>
          <ol className="grid gap-3 sm:grid-cols-2">
            {[
              'Commission',
              'Merchant fees',
              'Restaurant-funded promotions',
              'Refunds, errors, adjustments, credits',
              'Expected payout',
              'Reported payout',
            ].map((step, index) => (
              <li key={step} className="rounded-xl border border-[#e8e8ed] bg-white p-4">
                <span className="font-mono text-[10px]" style={{ color: '#0066ff' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="mt-2 font-semibold text-ink-800">{step}</p>
              </li>
            ))}
          </ol>
          <p className="compass-body mt-7 max-w-3xl">
            A finalized statement can prove observed cost composition and payout math. It does not prove a contract
            violation, an overcharge, or cash you will get back. If the math is clean, we say it is clean.
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24" aria-labelledby="answer-cluster-heading">
        <p className="compass-eyebrow mb-4">— Existing DoorDash and 3P answers</p>
        <h2 id="answer-cluster-heading" className="compass-display mb-8 text-3xl md:text-5xl">
          Stay on the guides that already exist.
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {TOP_THREE_P_GUIDES.map((guide) => (
            <Link key={guide.href} href={guide.href} className="compass-card group">
              <h3 className="!mt-0">{guide.title}</h3>
              <span className="mt-5 inline-block text-sm font-semibold" style={{ color: '#0066ff' }}>
                Read the answer <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
        <ul className="mt-8 space-y-2">
          {ISSUE_122_3P_SLUGS.map((slug) => (
            <li key={slug}>
              <Link href={`/answers/${slug}`} className="text-sm font-medium text-ink-800 hover:underline">
                /answers/{slug} <span style={{ color: '#0066ff' }}>→</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="compass-body mt-8 text-sm" style={{ color: '#6e6e73' }}>
          Related: <Link href="/delivery-marketplace-reconciliation">/delivery-marketplace-reconciliation</Link>
          {' · '}
          <Link href="/audit">/audit</Link>
          {' · '}
          <Link href="/answers">/answers</Link>
        </p>
      </section>

      <MarketplaceAuditFooter />
    </main>
  );
}
