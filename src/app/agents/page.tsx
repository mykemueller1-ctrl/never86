import Link from 'next/link';
import type { Metadata } from 'next';
import { AGENT_SPECS, SOURCE_TAGS } from '@/lib/agentSpecs';
import { AgentsNavLinks } from './AgentsNavLinks';
import { AgentCardActions } from './AgentCardActions';

export const metadata: Metadata = {
  title: "Agents · Never 86'd",
  description: 'Seven agents reading your sales, labor, voids, 3P fees, tips, catering, and shift sentiment. Every figure source-tagged.',
  openGraph: {
    title: "Never 86'd · Seven agents · One operator OS",
    description: 'Find the leak. Name who owns it. Keep the receipt. Seven agents, every figure source-tagged Verified / Estimated / Unverified.',
    url: 'https://never86.ai/agents',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd · Seven agents",
    description: 'Seven agents reading the operator stack. Every figure source-tagged.',
  },
  alternates: { canonical: 'https://never86.ai/agents' },
};

// AGENT_SPECS and SOURCE_TAGS imported from @/lib/agentSpecs

export default function AgentsPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· agents</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · 24-agent workforce · 7 free to try</p>
            </span>
          </Link>
          <AgentsNavLinks />
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-12">
        <p className="compass-eyebrow mb-6">— Eight agents · one operator OS</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          The agents that <em>name the leak.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl mb-10">
          Each one reads a slice of your operation — sales, labor, voids, 3P fees, tips, catering, shift sentiment — and tells you the one thing to fix. Per store. Per name. Every figure source-tagged.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>60 minutes free · drop a CSV →</Link>
          <Link href="/pricing" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>See pricing</Link>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] px-6 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3">
            {AGENT_SPECS.filter((a) => a.csvRunnable).map((a, i) => (
              <article key={a.name} className="compass-card hover:border-[#0066ff] transition-colors">
                <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
                  <div>
                    <p className="compass-card-label">— {String(i + 1).padStart(2, '0')} · {a.tag}</p>
                    <h3 className="!mt-2 text-2xl md:text-3xl">{a.name}</h3>
                    <p className="text-[12px] mt-2" style={{ color: '#86868b' }}>For the {a.seat}</p>
                    <p className="font-serif italic mt-4 text-lg" style={{ color: '#0066ff' }}>{a.headline}</p>
                    <AgentCardActions slug={a.slug} agentName={a.name} tryHref={a.href} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="compass-card-label mb-2">— What it catches</p>
                      <ul className="space-y-1.5">
                        {a.catches.map((c) => (
                          <li key={c} className="compass-body text-[13px] flex gap-2">
                            <span style={{ color: '#0066ff' }}>•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="compass-card-label mb-2">— Data it needs</p>
                        <p className="compass-body text-[13px]">{a.needs}</p>
                      </div>
                      <div>
                        <p className="compass-card-label mb-2">— What you&apos;ll see</p>
                        <p className="compass-body text-[13px]">{a.output}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="compass-eyebrow mb-4">— The rule that runs the agents</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            Every figure ships <em>source-tagged.</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {SOURCE_TAGS.map((t) => (
              <div key={t.v} className="compass-card">
                <p className="compass-card-label" style={{ color: t.color }}>— {t.v}</p>
                <p className="compass-body text-[14.5px] mt-3 leading-relaxed">{t.meaning}</p>
              </div>
            ))}
          </div>
          <p className="compass-body text-[14px] mt-8 max-w-3xl">
            No competitor in this category publicly source-tags figures. None publicly disclose model error. We checked. <Link href="/case/walked-the-number-back" className="underline" style={{ textDecorationColor: '#0066ff' }}>Read the case</Link> where we caught our own $8.3M number, walked it down to $1.81M in writing, and made source-tagging the operational rule that came out of it.
          </p>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] px-6 py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="compass-eyebrow mb-4">— Try one. Right now.</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            60 minutes. <em>Your real numbers.</em>
          </h2>
          <p className="compass-body text-lg mb-8">
            Drop a Toast / Square / Clover / PDQ export at <span className="font-mono text-white">/trial</span>. Void Hunter and the Leak Detector run on your real data in 30 seconds. No card. No human in the loop.
          </p>
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
            <Link href="/pricing"  className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/trial"    className="hover:text-white transition-colors">Trial</Link>
            <Link href="/for"      className="hover:text-white transition-colors">Seats</Link>
            <Link href="/"         className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
