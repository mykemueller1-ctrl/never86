import Link from 'next/link';
import { Track } from '@/components/Track';
import { AgentUnlock } from '@/components/AgentUnlock';
import { TrackedLink } from '@/components/TrackedLink';

const ALL_AGENTS = [
  { name: 'Void Hunter',    href: '/demo/void-hunter',    tag: 'Voids' },
  { name: '3P Fee Finder',  href: '/demo/3p-fee-finder',  tag: 'Delivery' },
  { name: 'Labor Leak',     href: '/demo/labor-leak',     tag: 'Labor' },
  { name: 'Tip Variance',   href: '/demo/tip-variance',   tag: 'Tips' },
  { name: 'Catering Leak',  href: '/demo/catering-leak',  tag: 'Catering' },
  { name: 'Rate Card Audit',href: '/demo/rate-card-audit',tag: '3P Rates' },
  { name: 'Shift Pulse',    href: '/demo/shift-pulse',    tag: 'Shift' },
];

export function DemoChrome({
  audience,
  sample,
  title,
  children,
}: {
  audience: 'owner' | 'manager' | 'frontline';
  sample?: boolean;
  title: string;
  tagline: string;
  children: React.ReactNode;
}) {
  const others = ALL_AGENTS.filter((a) => a.name !== title);

  return (
    <main className="compass min-h-screen">
      <Track eventType="agent_view" agentName={title} audience={audience} />

      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· free agent</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · agent demo</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <TrackedLink href="/agents" event="demo_nav_click" meta={{ agent: title, target: '/agents', label: 'All agents' }} className="compass-pill"><span className="avatar">A</span><span>All agents</span></TrackedLink>
            <TrackedLink href="/onboard" event="demo_nav_click" meta={{ agent: title, target: '/onboard', label: 'Onboard your store' }} className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</TrackedLink>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-8">
        <p className="compass-eyebrow mb-4">— Free agent</p>
        <h1 className="compass-display text-4xl md:text-6xl tracking-tighter">{title}</h1>
        {sample ? <p className="compass-eyebrow-dim mt-4">Sample data · live demo</p> : null}
      </section>

      {/* Demo body — light card on dark page so the existing interactive UI
          stays readable. The surrounding chrome is compass-dark. */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="bg-white text-ink-800 rounded-2xl p-6 md:p-8 border border-[#1f1f1f]">
          {children}
        </div>
      </div>

      <AgentUnlock agentName={title} />

      <section className="border-t border-[#1f1f1f] px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <p className="compass-eyebrow mb-4">— Try another agent</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {others.map((a) => (
              <TrackedLink key={a.name} href={a.href} event="demo_try_another_click" meta={{ from: title, to: a.name, target: a.href }} className="compass-card hover:border-[#0066ff] transition-colors block group">
                <p className="compass-card-label">{a.tag}</p>
                <p className="font-serif text-[17px] mt-2 text-white leading-tight">{a.name}</p>
                <p className="text-[12px] mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>
                  Open <span aria-hidden>→</span>
                </p>
              </TrackedLink>
            ))}
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
            <TrackedLink href="/for" event="demo_footer_click" meta={{ agent: title, target: '/for', label: 'Seats' }} className="hover:text-white transition-colors">Seats</TrackedLink>
            <TrackedLink href="/" event="demo_footer_click" meta={{ agent: title, target: '/', label: 'Home' }} className="hover:text-white transition-colors">Home</TrackedLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
