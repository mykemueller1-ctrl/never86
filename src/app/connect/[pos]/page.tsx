import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { POS_SPECS, getPosSpec } from '@/lib/posSpecs';
import { TrackedLink } from '@/components/TrackedLink';

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
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">for {p.name}</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · POS-specific guide</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <TrackedLink href="/trial" event="connect_pos_nav_click" meta={{ pos: p.slug, target: '/trial', label: 'Trial' }} className="compass-pill"><span className="avatar">T</span><span>Trial</span></TrackedLink>
            <TrackedLink href="/agents" event="connect_pos_nav_click" meta={{ pos: p.slug, target: '/agents', label: 'All agents' }} className="compass-pill"><span className="avatar">A</span><span>All agents</span></TrackedLink>
            <TrackedLink href="/onboard" event="connect_pos_nav_click" meta={{ pos: p.slug, target: '/onboard', label: 'Onboard your store' }} className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</TrackedLink>
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
          <TrackedLink href="/trial" event="connect_pos_csv_cta_click" meta={{ pos: p.slug, label: `Drop a ${p.name} CSV` }} className="btn-primary" style={{ background: '#0066ff' }}>Drop a {p.name} CSV →</TrackedLink>
          {p.partnerApplyUrl && (
            <TrackedLink href={p.partnerApplyUrl} external event="connect_pos_partner_portal_click" meta={{ pos: p.slug, target: p.partnerApplyUrl, label: `${p.name} partner portal` }} className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>
              {p.name} partner portal →
            </TrackedLink>
          )}
        </div>
        <p className="compass-eyebrow-dim mt-6">— {p.oauthEta}</p>
      </section>

      <section className="border-t border-[#e8e8ed] py-16 md:py-20 px-6">
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
                    <TrackedLink href={a.sampleHref} event="connect_pos_agent_sample_click" meta={{ pos: p.slug, agentSlug: a.slug, agentLabel: a.label, target: a.sampleHref }} className="text-[13px] mt-4 inline-flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#0066ff' }}>
                      Try on sample data <span aria-hidden>→</span>
                    </TrackedLink>
                  </div>
                  <div>
                    <p className="compass-card-label mb-3">— Columns we expect</p>
                    <div className="flex flex-wrap gap-2">
                      {a.columns.map((c) => (
                        <span key={c} className="font-mono text-[12px] px-2.5 py-1 rounded-full" style={{ background: '#0a0a0a', border: '1px solid #d2d2d7', color: '#d2d2d7' }}>
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

      <section className="border-t border-[#e8e8ed] py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="compass-eyebrow mb-4">— How to export from {p.name}</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            Three clicks. <em>One CSV.</em>
          </h2>
          <ol className="space-y-4 compass-body text-[15.5px] leading-relaxed">
            <li className="flex gap-4">
              <span className="font-mono text-[12px] font-bold flex-shrink-0 rounded-full px-2 py-1" style={{ background: '#0066ff20', color: '#0066ff', minWidth: 32, textAlign: 'center' }}>1</span>
              <span>Sign into your {p.name} back-office on the <strong className="text-ink-800">computer</strong> (mobile exports are limited on most POS systems).</span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-[12px] font-bold flex-shrink-0 rounded-full px-2 py-1" style={{ background: '#0066ff20', color: '#0066ff', minWidth: 32, textAlign: 'center' }}>2</span>
              <span>Navigate to <strong className="text-ink-800">Reports → Sales Reports</strong> (or the equivalent), pick the period (last month is a good starting point), and download as CSV.</span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono text-[12px] font-bold flex-shrink-0 rounded-full px-2 py-1" style={{ background: '#0066ff20', color: '#0066ff', minWidth: 32, textAlign: 'center' }}>3</span>
              <span>Drop the CSV at <TrackedLink href="/trial" event="connect_pos_inline_trial_click" meta={{ pos: p.slug, label: '/trial inline' }} className="underline text-ink-800" style={{ textDecorationColor: '#0066ff' }}>/trial</TrackedLink>. We auto-detect the column shape — no mapping step needed.</span>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-[#e8e8ed] py-16 md:py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="compass-eyebrow mb-4">— Try it now</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            60 minutes. <em>Your real {p.name} data.</em>
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <TrackedLink href="/trial" event="connect_pos_bottom_cta_click" meta={{ pos: p.slug, target: '/trial', label: 'Start the trial', variant: 'primary' }} className="btn-primary" style={{ background: '#0066ff' }}>Start the trial →</TrackedLink>
            <TrackedLink href="/pricing" event="connect_pos_bottom_cta_click" meta={{ pos: p.slug, target: '/pricing', label: 'See pricing', variant: 'secondary' }} className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>See pricing</TrackedLink>
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
            <TrackedLink href="/trial"   event="connect_pos_footer_click" meta={{ pos: p.slug, target: '/trial',   label: 'Trial' }}   className="hover:text-ink-800 transition-colors">Trial</TrackedLink>
            <TrackedLink href="/agents"  event="connect_pos_footer_click" meta={{ pos: p.slug, target: '/agents',  label: 'Agents' }}  className="hover:text-ink-800 transition-colors">Agents</TrackedLink>
            <TrackedLink href="/pricing" event="connect_pos_footer_click" meta={{ pos: p.slug, target: '/pricing', label: 'Pricing' }} className="hover:text-ink-800 transition-colors">Pricing</TrackedLink>
            <TrackedLink href="/"        event="connect_pos_footer_click" meta={{ pos: p.slug, target: '/',        label: 'Home' }}    className="hover:text-ink-800 transition-colors">Home</TrackedLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
