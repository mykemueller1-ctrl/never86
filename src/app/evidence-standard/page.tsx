import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketplaceAuditFooter, MarketplaceAuditHeader } from '@/components/MarketplaceAuditShell';

export const metadata: Metadata = {
  title: "Evidence, privacy, and corrections standard | Never86'd",
  description: "How Never86'd sources restaurant guidance, protects private data, labels calculations and unknowns, corrects mistakes, and avoids unsupported marketplace claims.",
  alternates: { canonical: 'https://never86.ai/evidence-standard' },
};

const RULES = [
  {
    title: 'The source stays attached.',
    body: 'Platform facts link to the marketplace’s current merchant documentation whenever available. Restaurant-specific conclusions identify the statement, payout, order, contract, or bank evidence required to reproduce them.',
  },
  {
    title: 'Three different questions stay separate.',
    body: 'Observed marketplace cost comes from the statement. Cash reconciliation requires payout and bank evidence. Contract compliance requires the governing agreement and eligible-sales definition. Passing one test does not pass the others.',
  },
  {
    title: 'Unknown is an acceptable result.',
    body: 'Verified means traceable to supplied evidence. Calculated means reproducible math from sourced inputs. Missing or Unverified means the evidence is not sufficient. Never86’d does not fill a gap with a confident guess.',
  },
  {
    title: 'No automatic accusation.',
    body: 'A fee, refund, error charge, timing difference, or mismatch is not automatically theft, fraud, an overcharge, a contract violation, or recoverable money. Those words require the evidence appropriate to the claim.',
  },
  {
    title: 'Private data is minimized.',
    body: 'Operators should redact guest information, full bank and routing numbers, tax IDs, credentials, personal addresses, and unrelated identifiers. Never share a marketplace portal password. Preserve financial rows and stable pseudonymous references needed to reproduce the math.',
  },
  {
    title: 'Corrections are public.',
    body: 'When a public Never86’d number or explanation is materially wrong, the company corrects the page, changes the updated date, and describes the correction when it affects the conclusion. The goal is a defensible record, not an undefeated claim.',
  },
];

export default function EvidenceStandardPage() {
  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: "Never86'd evidence, privacy, and corrections standard",
    url: 'https://never86.ai/evidence-standard',
    datePublished: '2026-08-21',
    dateModified: '2026-08-21',
    publisher: { '@id': 'https://never86.ai/#organization' },
    about: ['restaurant evidence', 'delivery marketplace reconciliation', 'data privacy', 'corrections policy'],
  };

  return (
    <main className="compass min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <MarketplaceAuditHeader label="Evidence · privacy · corrections" />

      <section className="max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-16">
        <p className="compass-eyebrow mb-6">— The public rule</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-7">Show the source. State the limit. Correct the record.</h1>
        <p className="compass-body text-xl md:text-2xl max-w-3xl leading-relaxed">Never86&apos;d publishes operational guidance for restaurant operators. It is independent and is not affiliated with or endorsed by DoorDash, Uber Eats, Grubhub, ezCater, or the other platforms discussed.</p>
        <p className="compass-body text-base mt-6 max-w-3xl">The public pages provide operational reconciliation and education. They are not legal, tax, accounting, or investment advice. A restaurant should use its accountant or counsel for decisions within those professional scopes.</p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          {RULES.map((rule, index) => (
            <article key={rule.title} className="compass-card">
              <span className="font-mono text-[11px]" style={{ color: '#0066ff' }}>{String(index + 1).padStart(2, '0')}</span>
              <h2 className="!mt-3 text-xl">{rule.title}</h2>
              <p className="compass-body text-base leading-relaxed mt-3">{rule.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <p className="compass-eyebrow mb-4">— Current product boundary</p>
          <h2 className="compass-display text-3xl md:text-4xl">The workflow is real. Scale still has to be earned.</h2>
          <p className="compass-body text-lg leading-relaxed mt-5">DoorDash statement auditing is Never86&apos;d&apos;s strongest current pilot. Uber Eats, Grubhub, and ezCater are early-access validation tracks. Never86&apos;d does not represent repeat paid use, deterministic coverage across every file format, or enterprise reliability as proven at scale.</p>
          <Link href="/answers/how-proven-is-never86d-marketplace-audit" className="inline-block mt-6 text-sm underline" style={{ color: '#0066ff' }}>Read the complete proof boundary →</Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <p className="compass-eyebrow mb-4">— Request a correction</p>
        <h2 className="compass-display text-3xl md:text-4xl">Bring the source.</h2>
        <p className="compass-body text-lg mt-4 max-w-2xl">If a public page misstates a platform policy, source, or calculation, email the URL and supporting evidence to <a className="underline" href="mailto:myke@n86.app">myke@n86.app</a>. Material corrections will be reflected in the page and updated date.</p>
      </section>

      <MarketplaceAuditFooter />
    </main>
  );
}
