import Link from 'next/link';
import type { RoleSpec } from '@/lib/roles';
import { Track } from '@/components/Track';
import { TrackedLink } from '@/components/TrackedLink';

export function RolePage({ spec }: { spec: RoleSpec }) {
  // 1–3 unit ICP: owner claims the free seat through email-only onboard.
  // Multi-unit Command Center stays off this path.
  const seatHref = spec.slug === 'owner' ? '/onboard' : '/trial';
  const seatLabel = spec.slug === 'owner' ? 'Claim free owner seat' : 'Start free seat';
  const secondaryHref = spec.slug === 'owner' ? '/pricing' : spec.freeAgents[0].href;
  const secondaryLabel = spec.slug === 'owner' ? 'See 1–3 unit pricing' : `Try ${spec.freeAgents[0].name}`;

  return (
    <main className="compass min-h-screen">
      <Track eventType="role_view" audience={spec.badge} />

      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">for {spec.badge}</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Built for the {spec.badge} · your daily screen</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <TrackedLink href="/for" event="role_nav_click" meta={{ role: spec.badge, target: '/for', label: 'All seats' }} className="compass-pill"><span className="avatar">A</span><span>All seats</span></TrackedLink>
            <TrackedLink href={seatHref} event="role_nav_click" meta={{ role: spec.badge, target: seatHref, label: seatLabel }} className="btn-primary" style={{ background: '#0066ff' }}>{seatLabel}</TrackedLink>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <p className="compass-eyebrow mb-6">— For the {spec.badge}</p>
        <h1 className="compass-display text-5xl md:text-7xl lg:text-[88px] mb-10">
          {spec.headline.l1}<br />
          <em>{spec.headline.gradient}</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl mb-10">{spec.subhead}</p>
        <div className="flex flex-wrap gap-3">
          <TrackedLink href={seatHref} event="role_hero_cta_click" meta={{ role: spec.badge, target: seatHref, label: seatLabel, variant: 'primary' }} className="btn-primary" style={{ background: '#0066ff' }}>
            {seatLabel} →
          </TrackedLink>
          <TrackedLink href={secondaryHref} event="role_hero_cta_click" meta={{ role: spec.badge, target: secondaryHref, label: secondaryLabel, variant: 'secondary' }} className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>
            {secondaryLabel}
          </TrackedLink>
        </div>
      </section>

      <section className="border-t border-[#e8e8ed] py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="compass-eyebrow mb-4">— Free agents for the {spec.badge}</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-12">
            Three places <em>to start.</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {spec.freeAgents.map((w) => (
              <TrackedLink key={w.name} href={w.href} event="role_free_agent_click" meta={{ role: spec.badge, agentName: w.name, target: w.href }} className="compass-card hover:border-[#0066ff] transition-colors block group">
                <p className="compass-card-label">Agent</p>
                <h3 className="!mt-3">{w.name}</h3>
                <p className="compass-body text-[14px] mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>
                  Try it free <span aria-hidden>→</span>
                </p>
              </TrackedLink>
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
            <TrackedLink href="/for" event="role_footer_click" meta={{ role: spec.badge, target: '/for', label: 'Seats' }} className="hover:text-ink-800 transition-colors">Seats</TrackedLink>
            <TrackedLink href="/" event="role_footer_click" meta={{ role: spec.badge, target: '/', label: 'Home' }} className="hover:text-ink-800 transition-colors">Home</TrackedLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
