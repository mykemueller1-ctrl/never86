import type { Metadata } from 'next';
import Link from 'next/link';
import { PUBLIC_SIGNAL_METHOD, THREE_P_PUBLIC_SIGNALS } from '@/lib/threePSocialEvidence';

export const metadata: Metadata = {
  title: "Seven days of public 3P restaurant signals | Never86'd research",
  description: 'A documented August 14–20, 2026 sample of 13 public restaurant-side signals about delivery economics, disputes, promotions, payouts, and reconciliation—with method and limits.',
  alternates: { canonical: 'https://www.never86.ai/research/3p-operator-signal-august-2026' },
};

export default function Public3PSignalReport() {
  const platformCounts = ['Facebook', 'TikTok', 'LinkedIn'].map((platform) => ({
    platform,
    count: THREE_P_PUBLIC_SIGNALS.filter((signal) => signal.platform === platform).length,
  }));
  const namedCases = THREE_P_PUBLIC_SIGNALS.filter((signal) => signal.classification !== 'Corroborating mechanism').length;

  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Seven-day public restaurant 3P control signal sample',
    description: 'A strict, deduplicated sample of public restaurant-side third-party delivery economics and control signals observed August 14–20, 2026.',
    url: 'https://www.never86.ai/research/3p-operator-signal-august-2026',
    datePublished: '2026-08-21',
    temporalCoverage: PUBLIC_SIGNAL_METHOD.window,
    creator: { '@id': 'https://www.never86.ai/#organization' },
    measurementTechnique: 'Manual public-source qualification and deduplication using published inclusion and exclusion rules.',
    variableMeasured: ['platform', 'source classification', 'issue mechanism', 'evidence limitation'],
    distribution: [{
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: 'https://www.never86.ai/research/3p-operator-signal-august-2026/data.json',
    }],
  };

  return (
    <main className="compass min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />
      <header className="max-w-7xl mx-auto px-6 pt-6 pb-4 flex items-start justify-between gap-6 flex-wrap">
        <Link href="/" className="flex items-start gap-4"><span className="compass-mark">N</span><span><p className="font-serif text-[24px] leading-none text-ink-800">Never 86&apos;d <span className="italic text-ink-600">· research</span></p><p className="compass-eyebrow-dim mt-2">Public operator evidence desk</p></span></Link>
        <nav className="flex items-center gap-2 text-[13px]"><Link href="/delivery-marketplace-reconciliation" className="compass-pill">3P evidence center</Link><Link href="/audit" className="btn-primary" style={{ background: '#0066ff' }}>Audit one statement</Link></nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-14">
        <p className="compass-eyebrow mb-6">— August 14–20, 2026</p>
        <h1 className="compass-display text-5xl md:text-7xl max-w-4xl mb-7">Thirteen signals in seven days. Evidence of language—not market size.</h1>
        <p className="compass-body text-xl md:text-2xl max-w-3xl leading-relaxed">A focused public scan found recurring restaurant-side discussion of delivery economics, refunds, dispute controls, payout holds, promotions, and reconciliation. The sample is documented and reproducible enough to support problem discovery. It is not a census, incidence rate, or proof of recoverable dollars.</p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Study summary">
        <div className="compass-card"><p className="compass-card-label">Qualifying signals</p><p className="compass-display text-5xl mt-3">{THREE_P_PUBLIC_SIGNALS.length}</p></div>
        <div className="compass-card"><p className="compass-card-label">Named operator cases</p><p className="compass-display text-5xl mt-3">{namedCases}</p></div>
        {platformCounts.map((item) => <div key={item.platform} className="compass-card"><p className="compass-card-label">{item.platform}</p><p className="compass-display text-5xl mt-3">{item.count}</p></div>)}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20 grid gap-6 md:grid-cols-2">
        <article className="compass-card"><p className="compass-eyebrow mb-4">— Included</p><ul className="space-y-3 compass-body">{PUBLIC_SIGNAL_METHOD.included.map((item) => <li key={item}>• {item}</li>)}</ul></article>
        <article className="compass-card"><p className="compass-eyebrow mb-4">— Excluded</p><ul className="space-y-3 compass-body">{PUBLIC_SIGNAL_METHOD.excluded.map((item) => <li key={item}>• {item}</li>)}</ul></article>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20" aria-labelledby="ledger-heading">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-7"><div><p className="compass-eyebrow mb-4">— Source ledger</p><h2 id="ledger-heading" className="compass-display text-3xl md:text-5xl">Every item keeps its limit attached.</h2></div><a href="/research/3p-operator-signal-august-2026/data.json" className="compass-pill">Download public JSON ↗</a></div>
        <div className="space-y-3">
          {THREE_P_PUBLIC_SIGNALS.map((signal) => (
            <article key={signal.id} className="compass-card grid gap-4 md:grid-cols-[80px_1fr_1.2fr] md:items-start">
              <div><p className="font-mono text-sm font-bold" style={{ color: '#0066ff' }}>{signal.id}</p><p className="font-mono text-[10px] mt-1" style={{ color: '#86868b' }}>{signal.date}</p></div>
              <div><p className="compass-card-label">{signal.platform} · {signal.classification}</p><h3 className="!mt-2">{signal.issue}</h3><a href={signal.sourceUrl} className="inline-block mt-3 text-sm underline" style={{ color: '#0066ff' }}>Open public source ↗</a></div>
              <div><p className="compass-card-label">Evidence limit</p><p className="compass-body text-sm mt-2 leading-relaxed">{signal.evidenceLimit}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white"><div className="max-w-5xl mx-auto px-6 py-14"><p className="compass-eyebrow mb-4">— What the study permits</p><p className="compass-body text-lg leading-relaxed max-w-4xl">We can say the documented sample contained 13 qualifying signals, including seven direct or carried operator cases, and that the same control path appeared across economics, disputes, promotions, payout holds, and reconciliation. We cannot say only 13 people discussed 3Ps, that all 13 were operator complaints, that any charge was wrong, or that the sample proves prevalence, market size, or paid demand.</p><p className="compass-body text-sm mt-5" style={{ color: '#6e6e73' }}>Reddit and YouTube produced no qualifying result under the focused in-window method; that is not a claim of platform-wide silence. X received limited coverage and is excluded from the denominator. Private conversations were excluded from the public count.</p></div></section>

      <section className="max-w-5xl mx-auto px-6 py-14"><p className="compass-body text-sm" style={{ color: '#6e6e73' }}>Public posts are linked, summarized, and treated as attributed claims—not copied as testimonials or presented as audited findings. <Link href="/evidence-standard" className="underline">Read the evidence, privacy, and corrections standard.</Link></p></section>
    </main>
  );
}
