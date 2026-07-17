import Link from 'next/link';
import type { Metadata } from 'next';
import { TrackedLink } from '@/components/TrackedLink';

export const metadata: Metadata = {
  title: "Changelog · Never 86'd",
  description: "Operator-facing changelog. What shipped, when, and why. Source-tagged like everything else.",
  openGraph: {
    title: "Never 86'd · Changelog",
    description: 'What shipped, when, and why. Source-tagged.',
    url: 'https://never86.ai/changelog',
  },
  alternates: { canonical: 'https://never86.ai/changelog' },
};

type Entry = {
  date: string;
  title: string;
  what: string;
  bullets: string[];
  tag: 'Agent' | 'UI' | 'SEO' | 'Security' | 'Infra';
};

const ENTRIES: Entry[] = [
  {
    date: '2026-06-08',
    title: '/trial · sample-data button · JSON-LD on /agents/[slug]',
    what: 'Operators landing without a CSV can now run on synthetic fixtures in 5 seconds.',
    bullets: [
      'Five synthetic CSV fixtures shipped to public/samples/',
      'JSON-LD SoftwareApplication on all 8 agent landing pages for Google AI Overviews',
    ],
    tag: 'UI',
  },
  {
    date: '2026-06-08',
    title: 'Catering Leak agent · 5th CSV-driven agent',
    what: 'Drop a catering reconciliation CSV. See the gap between invoice and POS, named to the customer.',
    bullets: [
      'Per-store gap, per-customer concentration, unmatched orders',
      '20-order test fixture · 33/33 tests across all 5 suites',
    ],
    tag: 'Agent',
  },
  {
    date: '2026-06-08',
    title: 'Tip Variance agent · per-name week-over-week tip drift',
    what: 'Drop a weekly tip CSV. Surface every server whose tip rate dropped >2pp on a base of >$50 in tips.',
    bullets: [
      'Auto-buckets daily exports into ISO weeks',
      'Network WoW % + per-name leaderboard sorted by most-negative delta',
    ],
    tag: 'Agent',
  },
  {
    date: '2026-06-08',
    title: 'Labor Drift agent · timesheet CSV',
    what: 'Drop a 7shifts / Toast Payroll export. See OT drift, ghost shifts, early/late clocks with dollar estimate.',
    bullets: [
      'Ghost-shift detection (clocked ≥60 min · zero sales)',
      'OT $ estimate at 1.5× wage rate · defaults to $15/hr if no Wage Rate column',
    ],
    tag: 'Agent',
  },
  {
    date: '2026-06-08',
    title: 'Leak Detector · micro-comp pattern (7th signal)',
    what: 'The "no charge add bacon" detector. 10+ comps averaging under $5 each → flagged.',
    bullets: [
      'Modifier-abuse proxy without needing free-text parsing',
      'Adds up to 15 risk-score points',
    ],
    tag: 'Agent',
  },
  {
    date: '2026-06-07',
    title: 'Leak Detector · day-of-week pattern (6th signal)',
    what: 'Catches "they always void on Tuesday closes." ≥40% concentration on one weekday = flagged.',
    bullets: [
      'Optional Closed-At column auto-detected',
      'James Wilson fixture case: 100% Tuesday voids → risk score 83',
    ],
    tag: 'Agent',
  },
  {
    date: '2026-06-07',
    title: '/story page · long-form founder narrative · 5 new AEO answers',
    what: 'Operator-friendly first-person story. Plus five published answers on spot-the-skim / dow patterns / chef comp rates / EBITDA math / Void Hunter vs Leak Detector.',
    bullets: [
      '/story serif italic · linked to /case + /trial + direct email',
      '5 answers seeded into admin.aeo_drafts (IDs 10-14)',
    ],
    tag: 'SEO',
  },
  {
    date: '2026-06-07',
    title: '/agents/[slug] × 8 · per-agent OG cards · MCP/llms.txt unified',
    what: 'Each agent gets its own deep landing page with serif italic Void-blue headline + OG metadata for LinkedIn.',
    bullets: [
      'AGENT_SPECS is now the single source for /agents, MCP, llms.txt, and Tailwind sitemap',
      'MCP gains get_agent + list_source_tags tools',
    ],
    tag: 'UI',
  },
  {
    date: '2026-06-07',
    title: 'Persistent trial runs · shareable URLs',
    what: 'Every /trial run is saved against a share_token. Bookmark the URL or claim it against your email.',
    bullets: [
      'admin.trial_runs table · indexed on share_token + email',
      '/trial/run/[shareToken] · public read-only result page · noindex',
    ],
    tag: 'UI',
  },
  {
    date: '2026-06-04',
    title: '/trial · 60-minute timed trial · Leak Detector launch',
    what: 'Drop a CSV, see 5 theft signals + composite risk score on real data. 60-min countdown. POS waitlist below.',
    bullets: [
      'Void Hunter + Leak Detector toggle on one drop zone',
      'admin.integration_waitlist tracks per-POS-vendor interest',
    ],
    tag: 'Agent',
  },
  {
    date: '2026-06-04',
    title: '/pricing · 4 transparent tiers',
    what: 'Trial / Operator $299 / Multi-unit $999 / Enterprise custom. No contact-us nonsense. (Historical entry — tiers have since changed. Current pricing lives at /pricing.)',
    bullets: [
      'Same source-tag discipline at every tier',
      'FAQ section covering POS support, source-tag rule, data security',
    ],
    tag: 'UI',
  },
  {
    date: '2026-06-03',
    title: 'Compass v2 · dark editorial across every public page',
    what: 'Newsreader serif + Inter sans · Void Hunter blue brand band · serif italic accents · compass dark cards everywhere.',
    bullets: [
      'Public surface ported · /for/* · /demo/* · /onboard · /case · /people · /operators · /press · /answers · /agents',
      'New OG image regen · LinkedIn shares now match the live site',
    ],
    tag: 'UI',
  },
  {
    date: '2026-06-02',
    title: 'Secrets hardening · customer fingerprint scrub',
    what: 'Removed every market / customer-name fingerprint from public source. Auth-gated /api/invoices, /api/z-reports, /api/ops-health.',
    bullets: [
      'CSS comments stripped of bamba references',
      'operator_id=3 removed from HTML provenance overlay',
    ],
    tag: 'Security',
  },
  {
    date: '2026-06-02',
    title: 'Self-serve onboarding · /onboard 4-step flow',
    what: 'Stores onboard themselves. POS pick · agent pick · data-share preference · saved into admin.leads with the new columns.',
    bullets: [
      'admin.leads · pos_type · data_preference · interested_agent columns',
      '24h + 7d follow-up cron firing daily at 14:00 UTC',
    ],
    tag: 'UI',
  },
];

const TAG_COLOR: Record<Entry['tag'], string> = {
  Agent: '#0066ff',
  UI: '#34c759',
  SEO: '#ff9500',
  Security: '#ff453a',
  Infra: '#86868b',
};

export default function ChangelogPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· changelog</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · what shipped, when, and why</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <TrackedLink href="/" event="changelog_nav_click" meta={{ target: '/', label: 'Home' }} className="compass-pill"><span className="avatar">H</span><span>Home</span></TrackedLink>
            <TrackedLink href="/trial" event="changelog_nav_click" meta={{ target: '/trial', label: 'Try free' }} className="btn-primary" style={{ background: '#0066ff' }}>Try free →</TrackedLink>
          </nav>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-12">
        <p className="compass-eyebrow mb-6">— Changelog</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          What shipped, <em>when, and why.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl max-w-2xl">
          Source-tagged like everything else. {ENTRIES.length} entries · {new Set(ENTRIES.map((e) => e.date)).size} ship days.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="space-y-3">
          {ENTRIES.map((e, i) => (
            <article key={i} className="compass-card">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <p className="font-mono text-[12px] tabular-nums" style={{ color: '#86868b' }}>{e.date}</p>
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: TAG_COLOR[e.tag], background: `${TAG_COLOR[e.tag]}1a` }}>
                  {e.tag}
                </span>
              </div>
              <h3>{e.title}</h3>
              <p className="compass-body text-[15px] mt-3 leading-relaxed">{e.what}</p>
              <ul className="space-y-1.5 mt-4">
                {e.bullets.map((b) => (
                  <li key={b} className="compass-body text-[13.5px] flex gap-2 leading-relaxed">
                    <span style={{ color: '#0066ff' }}>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <TrackedLink href="/" event="changelog_footer_click" meta={{ target: '/', label: 'Home' }} className="hover:text-white transition-colors">Home</TrackedLink>
        </div>
      </footer>
    </main>
  );
}
