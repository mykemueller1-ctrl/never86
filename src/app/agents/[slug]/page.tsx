import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AGENT_SPECS, getAgentSpec } from '@/lib/agentSpecs';

export function generateStaticParams() {
  return AGENT_SPECS.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getAgentSpec(params.slug);
  if (!a) return { title: "Agent not found · Never 86'd" };
  return {
    title: `${a.name} · ${a.headline} · Never 86'd`,
    description: a.intro,
    openGraph: {
      title: `${a.name} — ${a.headline}`,
      description: a.intro,
      url: `https://never86.ai/agents/${a.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${a.name} — ${a.headline}`,
      description: a.intro,
    },
    alternates: { canonical: `https://never86.ai/agents/${a.slug}` },
  };
}

export default function AgentDetail({ params }: { params: { slug: string } }) {
  const a = getAgentSpec(params.slug);
  if (!a) notFound();

  // JSON-LD Product schema — helps Google AI Overviews + Rich Results
  // cite the agent as a discrete product with capability bullets.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${a.name} · Never 86'd`,
    description: a.intro,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Restaurant Financial Intelligence',
    operatingSystem: 'Web',
    url: `https://never86.ai/agents/${a.slug}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: '60-minute free trial · drop a CSV at /trial',
      url: 'https://never86.ai/trial',
    },
    featureList: a.catches.join(' · '),
    publisher: {
      '@type': 'Organization',
      name: "Never 86'd",
      url: 'https://never86.ai',
    },
  };

  // Sibling agents — same seat first, then others.
  const siblings = AGENT_SPECS
    .filter((s) => s.slug !== a.slug)
    .sort((x, y) => {
      const xMatch = x.seat === a.seat ? 0 : 1;
      const yMatch = y.seat === a.seat ? 0 : 1;
      return xMatch - yMatch;
    })
    .slice(0, 4);

  return (
    <main className="compass min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· {a.name}</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · Agent · {a.tag}</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/agents" className="compass-pill"><span className="avatar">A</span><span>All agents</span></Link>
            <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Try free →</Link>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-12">
        <p className="compass-eyebrow mb-6">— Agent · for the {a.seat}</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          {a.name}.
        </h1>
        <p className="compass-display text-2xl md:text-3xl mb-8" style={{ color: '#0066ff' }}>
          <em>{a.headline}</em>
        </p>
        <p className="compass-body text-lg md:text-xl max-w-3xl mb-10 leading-relaxed">
          {a.intro}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={a.href} className="btn-primary" style={{ background: '#0066ff' }}>
            Try {a.name} live →
          </Link>
          <Link href="/trial" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>
            60-minute trial
          </Link>
          <Link href="/pricing" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>
            Pricing
          </Link>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-3">
          <div className="compass-card">
            <p className="compass-card-label">— What it catches</p>
            <h3>The signals.</h3>
            <ul className="space-y-2 mt-4">
              {a.catches.map((c) => (
                <li key={c} className="compass-body text-[14.5px] flex gap-2 leading-relaxed">
                  <span style={{ color: '#0066ff' }}>•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div className="compass-card">
              <p className="compass-card-label">— Data it needs</p>
              <h3>The input.</h3>
              <p className="compass-body text-[14.5px] mt-3 leading-relaxed">{a.needs}</p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— What you&apos;ll see</p>
              <h3>The output.</h3>
              <p className="compass-body text-[14.5px] mt-3 leading-relaxed">{a.output}</p>
            </div>
            <div className="compass-card" style={{ borderColor: '#0066ff' }}>
              <p className="compass-card-label" style={{ color: '#0066ff' }}>— Sample signal</p>
              <p className="font-serif italic text-lg mt-3 text-white leading-relaxed">{a.sampleSignal}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="compass-eyebrow mb-4">— POS support</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-6">
            Works with <em>your stack.</em>
          </h2>
          <p className="compass-body text-lg md:text-xl max-w-3xl mb-6 leading-relaxed">
            {a.posSupport}
          </p>
          <p className="compass-body text-[14px] max-w-3xl" style={{ color: '#86868b' }}>
            Don&apos;t see your POS? <Link href="/trial" className="underline text-white" style={{ textDecorationColor: '#0066ff' }}>Drop a CSV at /trial</Link> — the parser auto-detects most column shapes. Or join the integration waitlist and we&apos;ll email you the moment the OAuth ships.
          </p>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="compass-eyebrow mb-4">— Sibling agents</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-10">
            Often paired with <em>{a.name}.</em>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {siblings.map((s) => (
              <Link key={s.slug} href={`/agents/${s.slug}`} className="compass-card hover:border-[#0066ff] transition-colors block group">
                <p className="compass-card-label">{s.tag}</p>
                <h3>{s.name}</h3>
                <p className="compass-body text-[13px] mt-3 italic" style={{ color: '#86868b' }}>{s.headline}</p>
                <p className="text-[13px] mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>Open <span aria-hidden>→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-16 md:py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="compass-eyebrow mb-4">— Try {a.name} on your data</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            60 minutes. <em>Your real numbers.</em>
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Start the trial →</Link>
            <Link href={a.href} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>Open the demo</Link>
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
            <Link href="/agents"  className="hover:text-white transition-colors">All agents</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/trial"   className="hover:text-white transition-colors">Trial</Link>
            <Link href="/"        className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
