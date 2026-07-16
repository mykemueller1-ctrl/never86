import Link from 'next/link';
import type { Metadata } from 'next';
import { AGENT_SPECS, SOURCE_TAGS } from '@/lib/agentSpecs';
import { AgentsNavLinks } from './AgentsNavLinks';
import { AgentCardActions } from './AgentCardActions';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: "What we check · Never 86'd",
  description: 'Eight checks that read your sales, labor, voids, delivery fees, tips, catering, and how shifts are going. Every number labeled.',
  openGraph: {
    title: "Never 86'd · Eight ways we find your leak",
    description: 'Find the leak. Name who owns it. Keep the receipt. Eight checks, every number labeled Verified / Estimated / Unverified.',
    url: 'https://never86.ai/agents',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd · Eight ways we find your leak",
    description: 'Eight checks that read your whole operation. Every number labeled.',
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
                Never 86&apos;d <span className="italic text-white/70">· what we check</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">The checks that find your leak · 8 free to try</p>
            </span>
          </Link>
          <AgentsNavLinks />
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-12">
        <p className="compass-eyebrow mb-6">— Eight ways we find your leak</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          We read your numbers. <em>We name the leak.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-3xl mb-10">
          Each check watches a part of your business — sales, labor, voids, delivery fees, tips, catering, how shifts are going — and tells you the one thing to fix. By store. By name. In plain English.
        </p>
        <div className="flex flex-wrap gap-3">
          <TrackedLink href="/trial" event="agents_hero_cta_click" meta={{ target: '/trial', label: 'Try it free — no card', variant: 'primary' }} className="btn-primary" style={{ background: '#0066ff' }}>Try it free — no card needed →</TrackedLink>
          <TrackedLink href="/pricing" event="agents_hero_cta_click" meta={{ target: '/pricing', label: 'See pricing', variant: 'secondary' }} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>See pricing</TrackedLink>
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
          <p className="compass-eyebrow mb-4">— The rule behind every number</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            Every number, <em>labeled.</em>
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
            No competitor we could find shows their work like this — labeling every number, and telling you out loud when they got one wrong. We checked. <TrackedLink href="/case/walked-the-number-back" event="agents_case_link_click" meta={{ target: '/case/walked-the-number-back', label: 'Read the case · $1.81M walkback' }} className="underline" style={{ textDecorationColor: '#0066ff' }}>Read the case</TrackedLink> where we caught our own $8.3M number, walked it down to $1.81M in writing, and made labeling every figure the rule that came out of it.
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
            Send a report from Toast, Square, Clover, or PDQ. Two checks run on your real numbers in 30 seconds. No card. No salesperson.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <TrackedLink href="/trial" event="agents_bottom_cta_click" meta={{ target: '/trial', label: 'Start the trial', variant: 'primary' }} className="btn-primary" style={{ background: '#0066ff' }}>Start the trial →</TrackedLink>
            <TrackedLink href="/pricing" event="agents_bottom_cta_click" meta={{ target: '/pricing', label: 'See pricing', variant: 'secondary' }} className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>See pricing</TrackedLink>
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
            <TrackedLink href="/pricing"  event="agents_footer_click" meta={{ target: '/pricing', label: 'Pricing' }} className="hover:text-white transition-colors">Pricing</TrackedLink>
            <TrackedLink href="/trial"    event="agents_footer_click" meta={{ target: '/trial',   label: 'Trial' }}   className="hover:text-white transition-colors">Trial</TrackedLink>
            <TrackedLink href="/for"      event="agents_footer_click" meta={{ target: '/for',     label: 'Seats' }}   className="hover:text-white transition-colors">Seats</TrackedLink>
            <TrackedLink href="/"         event="agents_footer_click" meta={{ target: '/',        label: 'Home' }}    className="hover:text-white transition-colors">Home</TrackedLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
