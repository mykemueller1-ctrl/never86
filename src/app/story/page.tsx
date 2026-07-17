import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "The story · Never 86'd",
  description: 'How a single HTML file on an operator\'s laptop became daily margin control for independent restaurants and a 16-unit chef-led group.',
  openGraph: {
    title: "Never 86'd · the story",
    description: "I built this for myself first. Then I gave it away. — Myke Mueller",
    url: 'https://never86.ai/story',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd · the story",
    description: "I built this for myself first. Then I gave it away.",
  },
  alternates: { canonical: 'https://never86.ai/story' },
};

export default function StoryPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-white">
                Never 86&apos;d <span className="italic text-white/70">· the story</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Restaurant margin intelligence · founder narrative</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/" className="compass-pill"><span className="avatar">H</span><span>Home</span></Link>
            <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Try free →</Link>
          </nav>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-20">
        <p className="compass-eyebrow mb-6">— The story · first person · Myke Mueller</p>
        <h1 className="compass-display text-5xl md:text-7xl mb-8">
          I built this <em>for myself first.</em>
        </h1>
        <p className="compass-body text-2xl md:text-3xl mb-12 font-serif italic leading-snug" style={{ color: '#c7c7cc' }}>
          Then I gave it away.
        </p>

        <div className="space-y-7 compass-body text-lg leading-relaxed">
          <p>
            I&apos;m <span className="text-white font-semibold">Myke Mueller</span>. I run Community Tap &amp; Pizza in Fort Dodge, Iowa. I&apos;ve been an operator longer than I&apos;ve been a founder. Still am — the floor on Friday night, the books on Saturday morning, payroll on Sunday afternoon.
          </p>
          <p>
            I started building Never 86&apos;d because nobody was making the screen I actually wanted. Every restaurant tech vendor either sold me a dashboard I had to interpret myself, or charged me enterprise prices for software built for the office, not the line. The screen I wanted answered one question: <span className="text-white font-semibold">what costs me money this week, and what&apos;s the name attached to it.</span>
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">A single HTML file at 11pm</h2>
          <p>
            The first version was a single HTML file on my laptop. I was trying to figure out why food cost drifted four points one week and nobody could explain it. I wrote the math, fed in my own Z-reports, and it pointed at the right station within the hour.
          </p>
          <p>
            Then it pointed at the next leak. Then the next. By the end of the month I had a tool I trusted more than any of the dashboards I&apos;d been paying for. I kept it on my own restaurant for nine months, refined it, and then a chef I trust asked if I could run it on his 16-unit group.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">The first number was wrong</h2>
          <p>
            I ran the model on his data and it said the group was leaking <span className="font-mono tabular-nums text-white">$8.3M a year</span>. It was on the screen. It came out of the math. It was internally consistent. It was also wrong.
          </p>
          <p>
            The tell was a sales total that physically couldn&apos;t be real — the model was counting the same sales twice and building a big number on top of it. I caught it the next day. The honest number, after I removed the double-counting, came out at <span className="font-mono tabular-nums text-white">$1.81M</span> — about 22% of what I&apos;d reported.
          </p>
          <p>
            Every other vendor in this category would have left the $8.3M number in the deck and never spoken of it again. I walked it back in writing to the design partner who&apos;d already seen the original figure.
          </p>
          <p className="text-white font-semibold text-xl">
            That&apos;s the moment I knew the discipline of correcting your own number down is the product.
          </p>
          <p>
            It&apos;s why he stayed. It&apos;s why the next number we shipped — <span className="font-mono tabular-nums text-white">$15.72M reconciled across 545,677 orders</span> — landed without anyone needing to verify it twice. <Link href="/case/walked-the-number-back" className="underline" style={{ textDecorationColor: '#0066ff' }}>The case</Link> is the public version of that walk-back.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">Why source-tagging is the moat</h2>
          <p>
            Every figure that comes out of Never 86&apos;d ships tagged.
            <span style={{ color: '#34c759' }} className="font-semibold"> Verified</span> means we can re-pull it from a primary source and defend it to the penny.
            <span style={{ color: '#ff9500' }} className="font-semibold"> Estimated</span> means we&apos;ve modeled it from a benchmark; we name the assumption next to the number.
            <span style={{ color: '#ff453a' }} className="font-semibold"> Unverified</span> means the source isn&apos;t wired yet; the figure is illustrative.
          </p>
          <p>
            No competitor in this category does this publicly. None disclose model error. We checked. The closest thing is one vendor quoting &ldquo;15% labor forecast accuracy gains&rdquo; — a brag stat, not a per-figure disclosure.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">What I&apos;m building now</h2>
          <p>
            Eight agents. Sales, labor, voids, 3P fees, tips, catering, rate-card audit, shift sentiment. Each one reads a slice and tells you the one thing to fix. Per store. Per name. Every figure source-tagged.
          </p>
          <p>
            <Link href="/trial" className="underline text-white" style={{ textDecorationColor: '#0066ff' }}>60-minute free trial.</Link> Drop a CSV, see the read, no card. <Link href="/pricing" className="underline text-white" style={{ textDecorationColor: '#0066ff' }}>Pricing</Link> from a solo operator (free) to enterprise (custom). Same source-tag discipline at every tier. The price scales; the rule doesn&apos;t.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">The direct line</h2>
          <p>
            If something on the screen doesn&apos;t make sense, you can email me directly. I read everything. I respond personally. <a href="mailto:myke@n86.app" className="underline text-white font-mono" style={{ textDecorationColor: '#0066ff' }}>myke@n86.app</a>.
          </p>
          <p>
            If we&apos;re wrong about a number on your data, we&apos;ll walk it back in writing — same rule we ran on the first $8.3M.
          </p>

          <p className="text-2xl font-serif italic mt-12" style={{ color: '#86868b' }}>
            — Myke Mueller · Operator · Fort Dodge, Iowa
          </p>
        </div>

        <div className="mt-16 pt-10 border-t border-[#1f1f1f]">
          <p className="compass-eyebrow mb-5">— Next step</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/trial" className="btn-primary" style={{ background: '#0066ff' }}>Start the 60-minute trial</Link>
            <Link href="/agents" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>See the eight agents</Link>
            <Link href="/case/walked-the-number-back" className="btn-secondary" style={{ background: 'transparent', borderColor: '#2c2c2e', color: '#ffffff' }}>Read the case</Link>
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
