import Link from 'next/link';
import type { Metadata } from 'next';
import Image from 'next/image';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';

export const metadata: Metadata = {
  title: "The story · Never 86'd",
  description: 'I have nothing to hide. I am the operator. That is why I am here. The first-person story of Myke Mueller and Never 86\'d.',
  openGraph: {
    title: "Never 86'd · the story",
    description: "I have nothing to hide. I am the operator. That is why I am here. — Myke Mueller",
    url: 'https://www.never86.ai/story',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Never 86'd · the story",
    description: "I have nothing to hide. I am the operator. That is why I am here.",
  },
  alternates: { canonical: 'https://www.never86.ai/story' },
};

export default function StoryPage() {
  return (
    <main className="human-page min-h-screen">
      <HumanSiteHeader />

      <article className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-20">
        <p className="human-kicker mb-6">The story · first person · Myke Mueller</p>
        <h1 className="font-serif text-6xl font-medium leading-[0.92] tracking-[-0.05em] text-[#171717] md:text-8xl mb-8">
          I have nothing <span className="italic text-[#005de8]">to hide.</span>
        </h1>
        <p className="compass-body text-2xl md:text-3xl mb-12 font-serif italic leading-snug" style={{ color: '#515154' }}>
          I&apos;m the operator. That&apos;s why I&apos;m here.
        </p>

        <figure className="mb-12">
          <div className="human-photo min-h-[430px] md:min-h-[520px]">
            <Image src="/field/myke-kitchen.jpg" alt="Myke Mueller in the Community Tap kitchen" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover object-bottom" />
            <span className="human-photo-caption">Community Tap &amp; Pizza · Fort Dodge, Iowa · inside the work</span>
          </div>
        </figure>

        <div className="space-y-7 compass-body text-lg leading-relaxed">
          <p>
            I&apos;m <span className="text-ink-800 font-semibold">Myke Mueller</span>. I run Community Tap &amp; Pizza in Fort Dodge, Iowa. I&apos;ve been an operator longer than I&apos;ve been a founder. Still am — the floor on Friday night, the books on Saturday morning, payroll on Sunday afternoon.
          </p>
          <p className="text-ink-800 font-semibold text-xl">
            I am not looking at a restaurant from a software office. I am living the same problems I am asking Never 86&apos;d to explain.
          </p>
          <p>
            The work grew from firsthand operating experience inside independent restaurants and a <span className="text-ink-800 font-semibold">28-location, private-equity-backed restaurant group</span>. I brought those operating scars back to the problem.
          </p>
          <p>
            I started building Never 86&apos;d because nobody was making the screen I actually wanted. Every restaurant tech vendor either sold me a dashboard I had to interpret myself, or charged me enterprise prices for software built for the office, not the line. The screen I wanted answered one question: <span className="text-ink-800 font-semibold">what costs me money this week, and what&apos;s the name attached to it.</span>
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">A single HTML file at 11pm</h2>
          <p>
            The first version was a single HTML file on my laptop. I was trying to figure out why food cost drifted four points one week and nobody could explain it. I wrote the math, fed in my own Z-reports, and it pointed at the right station within the hour.
          </p>
          <p>
            Then it pointed at the next exception. Then the next. By the end of the month I had a tool I trusted more than any of the dashboards I&apos;d been paying for. Then a chef I trust asked if I could run it on his 16-unit group.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">The first number was wrong</h2>
          <p>
            I ran the model on his data and it said the group was leaking <span className="font-mono tabular-nums text-ink-800">$8.3M a year</span>. It was on the screen. It came out of the math. It was internally consistent. It was also wrong.
          </p>
          <p>
            The tell was a sales total that physically couldn&apos;t be real — the model was counting the same sales twice and building a big number on top of it. I caught it the next day. The honest number, after I removed the double-counting, came out at <span className="font-mono tabular-nums text-ink-800">$1.81M</span> — about 22% of what I&apos;d reported.
          </p>
          <p>
            The easy move would have been to leave the $8.3M number in the deck and never speak of it again. I walked it back in writing to the design partner who&apos;d already seen the original figure.
          </p>
          <p className="text-ink-800 font-semibold text-xl">
            That&apos;s the moment I knew the discipline of correcting your own number down is the product.
          </p>
          <p>
            It&apos;s why he stayed. It&apos;s why the next number we shipped — <span className="font-mono tabular-nums text-ink-800">$15.72M reconciled across 545,677 orders</span> — landed without anyone needing to verify it twice. <Link href="/case/walked-the-number-back" className="underline" style={{ textDecorationColor: '#0066ff' }}>The case</Link> is the public version of that walk-back.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">Why source-tagging is the moat</h2>
          <p>
            Every figure that comes out of Never 86&apos;d ships tagged.
            <span style={{ color: '#34c759' }} className="font-semibold"> Verified</span> means we can re-pull it from a primary source and defend it to the penny.
            <span style={{ color: '#ff9500' }} className="font-semibold"> Estimated</span> means we&apos;ve modeled it from a benchmark; we name the assumption next to the number.
            <span style={{ color: '#ff453a' }} className="font-semibold"> Unverified</span> means the source isn&apos;t wired yet; the figure is illustrative.
          </p>
          <p>
            Source-tagging makes the limits visible next to the number. It is our standard because an operator needs to know the difference between evidence, a modeled assumption, and a gap that still needs to be closed.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">The restaurant comes first</h2>
          <p>
            We work with restaurant technology companies when that helps the operator. We do not exist to sell another platform&apos;s agenda, hide a bad number, or force a restaurant to replace a system that is already doing its job. We stay independent enough to question the evidence and practical enough to integrate when integration creates a better result.
          </p>
          <p className="text-ink-800 font-semibold text-xl">
            The restaurant owner, the people inside the four walls, and the restaurant&apos;s economics come first. Always.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">What I&apos;m building now</h2>
          <p>
            The clearest starting point is one redacted DoorDash statement. We separate the documented deductions, calculate what the statement supports, bridge sales to expected payout, and name the record needed for the next conclusion. Uber Eats and Grubhub are early-access validation tracks.
          </p>
          <p>
            <Link href="/audit" className="underline text-ink-800" style={{ textDecorationColor: '#0066ff' }}>The free marketplace audit</Link> starts without an integration or a login. Broader daily controls come next, once the first answer proves useful. Same source discipline at every step.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">The direct line</h2>
          <p>
            If something on the screen doesn&apos;t make sense, you can email me directly. I read everything. I respond personally. <a href="mailto:myke@never86.ai" className="underline text-ink-800 font-mono" style={{ textDecorationColor: '#0066ff' }}>myke@never86.ai</a>.
          </p>
          <p>
            If we&apos;re wrong about a number on your data, we&apos;ll walk it back in writing — same rule we ran on the first $8.3M.
          </p>

          <p className="text-2xl font-serif italic mt-12" style={{ color: '#86868b' }}>
            — Myke Mueller · Operator · Fort Dodge, Iowa
          </p>
        </div>

        <div className="mt-16 pt-10 border-t border-[#e8e8ed]">
          <p className="compass-eyebrow mb-5">— Next step</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/audit" className="human-button human-button-primary">Start with one statement</Link>
            <Link href="/team" className="human-button human-button-secondary">Meet the team</Link>
            <Link href="/case/walked-the-number-back" className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>Read the case</Link>
          </div>
        </div>
      </article>

      <HumanSiteFooter />
    </main>
  );
}
