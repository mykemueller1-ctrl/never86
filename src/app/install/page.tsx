import Link from 'next/link';
import type { Metadata } from 'next';
import InstallForm from './InstallForm';
import { InstallNavLinks } from './InstallNavLinks';

export const metadata: Metadata = {
  title: "Install · Never 86'd",
  description: 'Take the trial to your live floor. Install the operator app · 7 production agents live today (UNKNOWN bug detector, pour variance, weight adherence, driver payout audit, modifier mispricing, comp anomaly, void anomaly) · 17 more in the pipeline · operator_id isolation today · DB-per-operator on the Q3 roadmap.',
  openGraph: {
    title: "Never 86'd · Install the operator app",
    description: 'From the trial wedge to the full operator OS. White-glove onboarding for the first 10 operators.',
    url: 'https://never86.ai/install',
  },
  alternates: { canonical: 'https://never86.ai/install' },
};

export default function InstallPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· install the operator app</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · upgrade from /trial to the live product</p>
            </span>
          </Link>
          <InstallNavLinks />
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-8">
        <p className="compass-eyebrow mb-6">— Install · upgrade path</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          Take the trial <em>to your live floor.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl mb-6 max-w-2xl leading-relaxed">
          You ran the trial. You saw the leak. The next step is the full operator app — the 7 CSV agents you tried, wired to your live POS and running every shift, plus 17 more agents in the Q3 pipeline, the Brain, and the 30 ops screens. (Today: 7 production agents wired. Tomorrow: the full workforce.)
        </p>
      </section>

      <section className="border-t border-[#e8e8ed] py-12 md:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="compass-eyebrow mb-4">— What ships when we install your operator app</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            From audit <em>to operating system.</em>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="compass-card">
              <p className="compass-card-label">— AI workforce · today</p>
              <h3>7 agents live · 17 in the pipeline</h3>
              <p className="compass-body text-[14px] mt-3"><span className="text-ink-800 font-semibold">Live in production today (7):</span> UNKNOWN bug detector · Pour variance · Weight adherence · Driver payout audit · Modifier mispricing · Comp anomaly · Void anomaly. <span style={{ color: '#0066ff' }}>Q3 ROADMAP (17 more):</span> Margin Hunter · Daily Brief · Voids &amp; Comps Watcher · Cash Reconciliation · Inventory/COGS · Schedule Optimizer · Vendor Drift · Beverage Cost · Menu Engineer · Refund Auditor · Catering Channel · Loyalty · Competitive Pricing · Reviews · HR Write-Up · Onboarding · Shift Lead Coach · Battlecard.</p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— The Brain</p>
              <h3>Pre-loaded playbook</h3>
              <p className="compass-body text-[14px] mt-3">RAG engine ingests your menus, SOPs, order guides, manager rules, Z-reports, and market data. Provider-agnostic — bring any OpenAI-compatible AI key. Smart on day one.</p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— 30 ops screens</p>
              <h3>Run the floor</h3>
              <p className="compass-body text-[14px] mt-3">Time clock, checklists, schedule, shift swaps, station broadcasts, shift handoff, Z-report upload, order optimizer, recipe cost, vendor products, waste log, gamification, write-ups.</p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— Multi-tenant · today</p>
              <h3>Per-operator data isolation</h3>
              <p className="compass-body text-[14px] mt-3"><span className="text-ink-800 font-semibold">Today:</span> operator_id everywhere in one Neon Postgres — every query scoped per tenant. <span style={{ color: '#0066ff' }}>Q3 ROADMAP:</span> full DB-per-operator (one Neon project per signed operator). &ldquo;Never blend companies&rdquo; is the contract — operator_id today, separate DB by Q3.</p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— Auth · honest state</p>
              <h3>Magic-link · coming with Owner</h3>
              <p className="compass-body text-[14px] mt-3"><span className="text-ink-800 font-semibold">Today:</span> shared password at <span className="font-mono">/reports/login</span> for charter partners only (per-tenant cookies, 12-hour lifetime). <span style={{ color: '#0066ff' }}>Q3 ROADMAP:</span> magic-link signup at /pulse, per-user sessions, PIN-by-department for managers/crew. WebAuthn after that.</p>
            </div>
            <div className="compass-card" style={{ borderColor: '#0066ff' }}>
              <p className="compass-card-label" style={{ color: '#0066ff' }}>— Source-tag · everywhere</p>
              <h3>Same rule, more surface</h3>
              <p className="compass-body text-[14px] mt-3">Every figure on every screen ships Verified / Estimated / Unverified. When we&apos;re wrong we walk it back in writing. The trial rule scales with you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e8e8ed] py-12 md:py-16 px-6">
        <div className="max-w-xl mx-auto">
          <p className="compass-eyebrow mb-4 text-center">— Request your install</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8 text-center">
            One form. <em>24-hour SLA.</em>
          </h2>
          <InstallForm />
        </div>
      </section>

      <footer className="border-t border-[#e8e8ed] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/trial"   className="hover:text-ink-800 transition-colors">Trial</Link>
            <Link href="/pricing" className="hover:text-ink-800 transition-colors">Pricing</Link>
            <Link href="/agents"  className="hover:text-ink-800 transition-colors">Agents</Link>
            <Link href="/"        className="hover:text-ink-800 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
