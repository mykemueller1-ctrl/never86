import Link from 'next/link';
import type { Metadata } from 'next';
import { ROLES, ROLE_ORDER } from '@/lib/roles';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: "Pick your seat · Never 86'd",
  description: 'Seven roles. Each one sees the screen they need.',
  openGraph: {
    title: "Never 86'd · Pick your seat",
    description: 'Seven roles. Each one sees the screen they need.',
    url: 'https://never86.ai/for',
  },
  alternates: { canonical: 'https://never86.ai/for' },
};

export default function ForIndex() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· pick your seat</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · seven roles</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <TrackedLink href="/" event="for_nav_click" meta={{ target: '/', label: 'Home' }} className="compass-pill"><span className="avatar">H</span><span>Home</span></TrackedLink>
            <TrackedLink href="/onboard" event="for_nav_click" meta={{ target: '/onboard', label: 'Onboard your store' }} className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</TrackedLink>
          </nav>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-12">
        <p className="compass-eyebrow mb-6">— Pick your seat</p>
        <h1 className="compass-display text-5xl md:text-7xl lg:text-[88px] mb-6">
          One platform.<br />
          <em>Seven roles.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl">
          Each role sees the screen they need. Same numbers, different read.
        </p>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLE_ORDER.map((slug) => {
              const r = ROLES[slug];
              return (
                <TrackedLink key={r.slug} href={`/for/${r.slug}`} event="for_role_card_click" meta={{ role: r.badge, slug: r.slug, target: `/for/${r.slug}` }} className="compass-card hover:border-[#0066ff] transition-colors block group">
                  <p className="compass-card-label">For the</p>
                  <h3>{r.badge}</h3>
                  <p className="compass-body text-[14px] mt-1 mb-4">{r.oneWord}</p>
                  <p className="text-[14px] inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#0066ff' }}>See it <span aria-hidden>→</span></p>
                </TrackedLink>
              );
            })}
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
            <TrackedLink href="/answers" event="for_footer_click" meta={{ target: '/answers', label: 'Answers' }} className="hover:text-white transition-colors">Answers</TrackedLink>
            <TrackedLink href="/press" event="for_footer_click" meta={{ target: '/press', label: 'Press' }} className="hover:text-white transition-colors">Press</TrackedLink>
            <TrackedLink href="/" event="for_footer_click" meta={{ target: '/', label: 'Home' }} className="hover:text-white transition-colors">Home</TrackedLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
