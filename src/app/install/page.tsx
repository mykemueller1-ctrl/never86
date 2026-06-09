import Link from 'next/link';
import type { Metadata } from 'next';
import InstallForm from './InstallForm';

export const metadata: Metadata = {
  title: "Install · Never 86'd",
  description: 'Take the trial to your live floor. Install the operator app · 24 agents · The Brain · 30 ops screens · database-per-operator isolation.',
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
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· install the operator app</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · upgrade from /trial to the live product</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/trial" className="compass-pill"><span className="avatar">T</span><span>Back to trial</span></Link>
            <a href="https://never86d-ctap.onrender.com" target="_blank" rel="noopener" className="btn-primary" style={{ background: '#0066ff' }}>Open operator app →</a>
          </nav>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-8">
        <p className="compass-eyebrow mb-6">— Install · upgrade path</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-6">
          Take the trial <em>to your live floor.</em>
        </h1>
        <p className="compass-body text-lg md:text-xl mb-6 max-w-2xl leading-relaxed">
          You ran the trial. You saw the leak. The next step is the full operator app — the 7 CSV agents you tried, wired to your live POS and running every shift, plus the rest of the 24-agent workforce, the Brain, and the 30 ops screens.
        </p>
      </section>

      <section className="border-t border-[#1f1f1f] py-12 md:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="compass-eyebrow mb-4">— What ships when we install your operator app</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8">
            From audit <em>to operating system.</em>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="compass-card">
              <p className="compass-card-label">— AI workforce</p>
              <h3>24 agents wired</h3>
              <p className="compass-body text-[14px] mt-3">Margin Hunter · Daily Brief · Voids &amp; Comps Watcher · Cash Reconciliation · Inventory/COGS Tracker · Schedule Optimizer · Vendor Drift Detector · Beverage Cost Score · Menu Engineer · Refund Auditor · Catering Channel · Loyalty · Competitive Pricing · Reviews · Catering × Loyalty · HR Write-Up Drafter · Onboarding · Shift Lead Coach · Operator Council Liaison · Margin Recovery Proposal Writer · Battlecard · Pour Cost Watchdog · Catering Margin · Falls Church Canary.</p>
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
              <p className="compass-card-label">— Multi-tenant</p>
              <h3>Database-per-operator</h3>
              <p className="compass-body text-[14px] mt-3">Your data lives in <span className="text-white font-semibold">your own database</span>. No shared tables. No &ldquo;tenant_id&rdquo; to trust. &ldquo;Never blend companies&rdquo; — the rule that makes operators sign.</p>
            </div>
            <div className="compass-card">
              <p className="compass-card-label">— Auth that fits the floor</p>
              <h3>PIN-by-department</h3>
              <p className="compass-body text-[14px] mt-3">Email/password for owners. PIN-by-department for managers and crew (no shared password). Face ID / fingerprint via WebAuthn where supported.</p>
            </div>
            <div className="compass-card" style={{ borderColor: '#0066ff' }}>
              <p className="compass-card-label" style={{ color: '#0066ff' }}>— Source-tag · everywhere</p>
              <h3>Same rule, more surface</h3>
              <p className="compass-body text-[14px] mt-3">Every figure on every screen ships Verified / Estimated / Unverified. When we&apos;re wrong we walk it back in writing. The trial rule scales with you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#1f1f1f] py-12 md:py-16 px-6">
        <div className="max-w-xl mx-auto">
          <p className="compass-eyebrow mb-4 text-center">— Request your install</p>
          <h2 className="compass-display text-3xl md:text-5xl mb-8 text-center">
            One form. <em>24-hour SLA.</em>
          </h2>
          <InstallForm />
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
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/agents"  className="hover:text-white transition-colors">Agents</Link>
            <Link href="/"        className="hover:text-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
