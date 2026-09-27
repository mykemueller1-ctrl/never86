import Link from 'next/link';
import Image from 'next/image';
import { FunnelLink } from '@/components/FunnelLink';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';
import { publicPageMetadata } from '@/lib/seoAeo';

export const metadata = publicPageMetadata({
  path: '/story',
  title: "The story · Never 86'd",
  description:
    "Myke Mueller runs a pizza bar in Fort Dodge, Iowa. He had AI agents build the back office he could not hire. First owner seat is free. No card.",
});

export default function StoryPage() {
  return (
    <main className="human-page min-h-screen">
      <HumanSiteHeader />

      <article className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-20">
        <p className="human-kicker mb-6">The story · Myke Mueller · Fort Dodge, Iowa</p>
        <h1 className="font-serif text-5xl font-medium leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl mb-8">
          I run a pizza bar. <span className="italic text-[#005de8]">Agents built the back office.</span>
        </h1>
        <p className="compass-body text-2xl md:text-3xl mb-12 font-serif italic leading-snug" style={{ color: '#515154' }}>
          I approve every change. Then I go make pizzas.
        </p>

        <figure className="mb-12">
          <div className="human-photo min-h-[430px] md:min-h-[520px]">
            <Image src="/field/myke-kitchen.jpg" alt="Myke Mueller in the Community Tap kitchen" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover object-bottom" />
            <span className="human-photo-caption">Community Tap &amp; Pizza · Fort Dodge, Iowa</span>
          </div>
        </figure>

        <div className="space-y-7 compass-body text-lg leading-relaxed">
          <p>
            I&apos;m <span className="text-ink-800 font-semibold">Myke Mueller</span>. I run Community Tap &amp; Pizza in Fort Dodge, Iowa. I still work the floor. I still do the books after close. No CFO. No office staff. No dev team.
          </p>
          <p>
            I got tired of the paperwork. Invoices that change without a phone call. Z reports nobody has time to read. Delivery fees that show up as one line and hide the rest. I am not a software engineer, and I could not hire the back office I needed.
          </p>
          <p>
            So I had AI agents build it. Grok, Cursor, and OpenAI Codex write the code. I read it. I approve every change before it ships. Then I go back to the line.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">What it does today</h2>
          <p>
            You sign up on this site. You drop in papers you already have — vendor invoices, Z reports, a delivery statement. You get an owner seat that answers from <span className="text-ink-800 font-semibold">your</span> papers. Not an industry average. Not a guess.
          </p>
          <p>
            Every number is tagged Verified, Estimated, or Missing. If a document is missing, the seat says Missing. It does not fill the gap with a made-up dollar. We do not invent dollars.
          </p>
          <p>
            The first owner seat is free. No card to start. It is for independent restaurants — the owner who wears every hat.
          </p>
          <p>
            You can try a sample with no account. The sample cheese price is fictional, on purpose, so you can see the check before you upload anything private.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">What it is not</h2>
          <p>
            It is not your POS. No register connection is required. It is not a bookkeeper, and it does not promise that a fee comes back. DoorDash statements are the clearest place to start, from a file you already have. Uber Eats and Grubhub are early access. Nobody logs into a merchant portal for you.
          </p>

          <h2 className="compass-display text-3xl md:text-4xl mt-12 mb-4">What&apos;s next</h2>
          <p>
            It is early. Some answers are still rough. I would rather say that here than have you find it later. I do not have paying customers, and I am not going to pretend otherwise.
          </p>
          <p>
            What&apos;s next is other independent owners trying it on their own papers, and me fixing what breaks. If something on the screen does not make sense, email me. I read it. <a href="mailto:myke@never86.ai" className="underline text-ink-800 font-mono" style={{ textDecorationColor: '#0066ff' }}>myke@never86.ai</a>.
          </p>

          <p className="text-2xl font-serif italic mt-12" style={{ color: '#86868b' }}>
            — Myke Mueller · Operator · Fort Dodge, Iowa
          </p>
        </div>

        <div className="mt-16 pt-10 border-t border-[#e8e8ed]">
          <p className="compass-eyebrow mb-5">— Next step</p>
          <div className="flex flex-wrap items-center gap-3">
            <FunnelLink href="/try" event="cta_try" className="human-button human-button-primary">Try it free — no card</FunnelLink>
            <FunnelLink href="/onboard" event="onboard_start" className="human-button human-button-secondary">Claim free owner seat</FunnelLink>
            <Link href="/login" className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>Sign in</Link>
          </div>
          <p className="mt-4 text-sm text-[#6e6e73]">
            Questions first? <Link href="/faq" className="underline" style={{ textDecorationColor: '#0066ff' }}>Read the FAQ</Link>.
          </p>
        </div>
      </article>

      <HumanSiteFooter />
    </main>
  );
}
