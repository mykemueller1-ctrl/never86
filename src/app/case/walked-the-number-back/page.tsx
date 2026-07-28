import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "$8.3M → $1.81M · The correction · Never 86'd",
  description:
    "How we caught our own overstated recovery number and walked it back to the figure we can defend to the penny — the trust move behind never86's first design partner.",
  openGraph: {
    title: "$8.3M → $1.81M · How we walked our own number back",
    description:
      "Most vendors brag about accuracy gains. We publish the corrections.",
    url: 'https://never86.ai/case/walked-the-number-back',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: "$8.3M → $1.81M · The correction",
    description: "Most vendors brag about accuracy gains. We publish the corrections.",
  },
  alternates: { canonical: 'https://never86.ai/case/walked-the-number-back' },
};

export default function CaseWalkedBack() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· the correction</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Operator OS · published case</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
            <Link href="/onboard" className="btn-primary" style={{ background: '#0066ff' }}>Onboard your store</Link>
          </nav>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 pt-16 md:pt-20 pb-20">
        <p className="compass-eyebrow mb-6">— Case · the correction</p>

        <h1 className="font-serif text-5xl md:text-7xl mb-10 font-mono tabular-nums tracking-tighter">
          <span style={{ color: '#6e6e73' }}>$8.3M</span>
          <span style={{ color: '#3a3a3c' }} className="mx-3">→</span>
          <span className="text-white">$1.81M</span>
        </h1>

        <p className="compass-display text-2xl md:text-3xl leading-snug tracking-tight mb-12">
          Every other restaurant tech vendor brags about accuracy gains.
          <em> We did the opposite</em> — we published the correction.
        </p>

        <div className="space-y-7 compass-body text-lg leading-relaxed">
          <p>
            Our first reconciliation for a 16-unit chef-led group put the recovery surface at <span className="font-mono tabular-nums text-white">$8.3M / year</span>. The number was on the screen. It came out of the model. The math was internally consistent.
          </p>
          <p>
            <span className="text-white font-semibold">It was also wrong.</span>
          </p>
          <p>
            The signal was a sales total that couldn&apos;t physically be real — a rollup view reported chain net at $72M for a four-month period in a group that&apos;s never done $72M in a year. The number was wrong because the rollup was double-counting. The model was confidently reading a doubled number and confidently extrapolating from it.
          </p>
          <p>
            We pulled the model down. Re-pulled net sales from the leaf-channel view, de-duplicated. The honest network number came out at <span className="font-mono tabular-nums text-white">$15.72M</span>. The honest recovery surface came out at <span className="font-mono tabular-nums text-white">$1.81M</span> — about 22% of what we&apos;d originally reported.
          </p>
          <p>
            The choice in front of us was simple. We could leave the $8.3M number in the deck and never speak of it again — every other vendor in this category would have. Or we could walk it back, in writing, to the design partner who&apos;d already seen the original figure.
          </p>
          <p>
            We walked it back. <span className="text-white font-semibold">The discipline of correcting your own number down is the product.</span> It&apos;s why the design partner stayed. It&apos;s why the next number we shipped — <span className="font-mono tabular-nums text-white">$15.72M reconciled across 545,677 orders</span> — landed without anyone needing to verify it twice.
          </p>
          <p>
            Every figure that comes out of never86 since then ships tagged.
            <span className="font-semibold" style={{ color: '#34c759' }}> Verified</span> means we can re-pull it from a primary source and defend it to the penny.
            <span className="font-semibold" style={{ color: '#ff9500' }}> Estimated</span> means we&apos;ve modeled it from a benchmark or assumption; we name the assumption.
            <span className="font-semibold" style={{ color: '#ff453a' }}> Unverified</span> means the source isn&apos;t wired yet; the number is illustrative.
          </p>
          <p>
            The tag system isn&apos;t marketing. It&apos;s the operational rule that came out of catching our own mistake. The rule that means a CFO can take the screen into a board meeting and answer the question &ldquo;where did this come from&rdquo; for any figure on the page.
          </p>
          <p>
            No competitor in this category publicly source-tags figures. None publicly disclose model error. We checked. The closest thing is one vendor quoting &ldquo;15% labor forecast accuracy gains&rdquo; — a brag stat, not a per-figure disclosure.
          </p>
          <p className="compass-display text-2xl">
            That gap is <em>the moat.</em><br />
            And it started with one corrected number.
          </p>
        </div>

        <div className="mt-16 pt-10 border-t border-[#1f1f1f]">
          <p className="compass-eyebrow mb-5">— Take it for a drive</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/demo/3p-fee-finder" className="btn-primary" style={{ background: '#0066ff' }}>Try a free agent</Link>
            <Link href="/onboard" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>15 minutes on your data</Link>
          </div>
        </div>
      </article>

      <footer className="border-t border-[#1f1f1f] py-10 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px]">
          <div className="flex items-center gap-2">
            <span className="brand-monogram" style={{ width: '1.1rem', height: '1.1rem', fontSize: '0.5rem' }}>N86</span>
            <span>Never 86&apos;d · Built by operators</span>
          </div>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </footer>
    </main>
  );
}
