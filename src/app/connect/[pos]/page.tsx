import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { POS_SPECS, getPosSpec } from '@/lib/posSpecs';

export function generateStaticParams() {
  return Object.keys(POS_SPECS).map((slug) => ({ pos: slug }));
}

export function generateMetadata({ params }: { params: { pos: string } }): Metadata {
  const p = getPosSpec(params.pos);
  if (!p) return { title: "POS not found · Never 86'd" };
  return {
    title: `${p.name} · Never 86'd`,
    description: p.tagline,
    openGraph: {
      title: `Never 86'd for ${p.name}`,
      description: p.tagline,
      url: `https://never86.ai/connect/${p.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Never 86'd for ${p.name}`,
      description: p.tagline,
    },
    alternates: { canonical: `https://never86.ai/connect/${p.slug}` },
  };
}

export default function PosLandingPage({ params }: { params: { pos: string } }) {
  const p = getPosSpec(params.pos);
  if (!p) notFound();

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">for {p.name}</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · POS-specific guide</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/trial" className="compass-pill"><span className="avatar">T</span><span>Trial</span></Link>
            <Link href="/agents" className="compass-pill"><span className="avatar">A</span><span>All agents</span></Link>
            <Link href="/onboard" className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</Link>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-12">
        <p className="compass-eyebrow mb-6">— Connect · {p.name}</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          Never 86&apos;d <em>for {p.name}.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl mb-10 leading-relaxed">
          {p.tagline}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Drop a {p.name} CSV →</Link>
          {p.partnerApplyUrl && (
            <a href={p.partnerApplyUrl} target="_blank" rel="noopener" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>
              {p.name} partner portal →
            </a>
          )}
        </div>
        <p className="compass-eyebrow-dim mt-6">— {p.oauthEta}</p>
      </section>

      <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="compass-eyebrow mb-4">— Which export goes with which agent</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            {p.agents.length} agent{p.agents.length === 1 ? '' : 's'} <em>wired for {p.name}</em> today.
          </h2>
          <div className="space-y-3">
            {p.agents.map((a) => (
              <article key={a.slug} className="compass-card">
                <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
                  <div>
                    <p className="compass-card-label">— {a.label}</p>
                    <h3 className="!mt-2">{a.exportName}</h3>
                    <Link href={a.sampleHref} className="text-[13px] mt-4 inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#0066ff' }}>
                      Try on sample data <span aria-hidden>→</span>
                    </Link>
                  </div>
                  <div>
                    <p className="compass-card-label mb-3">— Columns we expect</p>
                    <div className="flex flex-wrap gap-2">
                      {a.columns.map((c) => (
                        <span key={c} className="font-mono text-[12px] px-2.5 py-1 rounded-full" style={{ background: '#0a0a0a', border: '1px solid #2c2c2e', color: '#d2d2d7' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="compass-body text-[12.5px] mt-4" style={{ color: '#86868b' }}>
                      Header names are auto-detected. Common variants (e.g. &ldquo;Server&rdquo; for &ldquo;Employee&rdquo; or &ldquo;Site&rdquo; for &ldquo;Location&rdquo;) work without changes.
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="compass-eyebrow mb-4">— How to export from {p.name}</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            Three clicks. <em>One CSV.</em>
          </h2>
          <ol className="space-y-4 compass-body text-[15.5px] leading-relaxed">
            <li className="flex gap-4">
              <span className="font-mono text-[12px] font-bold flex-shrink-0 rounded-full px-2 py-1" style={{ background: '#0066ff20', color: '#0066ff', minWidth: 32, textAlign: 'center' }}>1</span>
              <span>Sign into your {p.name} back-office on the <strong className="text-white">computer</strong> (mobile exports are limited on most POS systems).</span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-[12px] font-bold flex-shrink-0 rounded-full px-2 py-1" style={{ background: '#0066ff20', color: '#0066ff', minWidth: 32, textAlign: 'center' }}>2</span>
              <span>Navigate to <strong className="text-white">Reports → Sales Reports</strong> (or the equivalent), pick the period (last month is a good starting point), and download as CSV.</span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-[12px] font-bold flex-shrink-0 rounded-full px-2 py-1" style={{ background: '#0066ff20', color: '#0066ff', minWidth: 32, textAlign: 'center' }}>3</span>
              <span>Drop the CSV at <Link href="/trial" className="underline text-white" style={{ textDecorationColor: '#0066ff' }}>/trial</Link>. We auto-detect the column shape — no mapping step needed.</span>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="compass-eyebrow mb-4">— Try it now</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            60 minutes. <em>Your real {p.name} data.</em>
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Start the trial →</Link>
            <Link href="/pricing" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>See pricing</Link>
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
            <Link href="/trial"   className="hover:text-white transition-colors">Trial</Link>
            <Link href="/agents"  className="hover:text-white transition-colors">Agents</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/"        className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
