import Link from 'next/link';
import { FunnelLink } from '@/components/FunnelLink';
import { HumanSiteFooter, HumanSiteHeader } from '@/components/HumanSiteShell';
import { publicPageMetadata } from '@/lib/seoAeo';

export const metadata = publicPageMetadata({
  path: '/case/walked-the-number-back',
  title: "We do not invent dollars · Never 86'd",
  description:
    "Never86 tags every figure Verified, Estimated, or Missing. If a paper is missing, the answer says Missing. We do not publish a result we cannot re-pull.",
});

export default function HonestyCasePage() {
  return (
    <main className="human-page min-h-screen">
      <HumanSiteHeader />
      <article className="max-w-3xl mx-auto px-6 pt-12 md:pt-16 pb-20">
        <p className="human-kicker mb-6">The rule · not a customer result</p>
        <h1 className="font-serif text-5xl font-medium leading-[0.95] tracking-[-0.04em] text-[#171717] md:text-7xl mb-8">
          We do not <span className="italic text-[#005de8]">invent dollars.</span>
        </h1>
        <div className="space-y-7 compass-body text-lg leading-relaxed">
          <p>
            This page used to quote a large recovery figure, an order count, and a multi-unit group. Those numbers are not something this site can prove from the papers we are willing to show. They are off the public site.
          </p>
          <p>
            The rule that stays: every figure is tagged <span className="text-ink-800 font-semibold">Verified</span>, <span className="text-ink-800 font-semibold">Estimated</span>, or <span className="text-ink-800 font-semibold">Missing</span>. Verified means we can point at the paper. Estimated means we name the assumption. Missing means the paper is not here. Missing is not zero.
          </p>
          <p>
            A price increase on an invoice is not money recovered. A delivery fee on a statement is not a refund. If we cannot re-pull a number, we do not publish it as a result.
          </p>
          <p>
            The product you can try is the sample on <Link href="/try" className="underline" style={{ textDecorationColor: '#0066ff' }}>/try</Link>, then a free owner seat on your own papers. The story of who built it is on <Link href="/story" className="underline" style={{ textDecorationColor: '#0066ff' }}>/story</Link>.
          </p>
        </div>
        <div className="mt-16 flex flex-wrap gap-3">
          <FunnelLink href="/try" event="cta_try" className="human-button human-button-primary">Try it free — no card</FunnelLink>
          <FunnelLink href="/onboard" event="onboard_start" className="human-button human-button-secondary">Claim free owner seat</FunnelLink>
        </div>
      </article>
      <HumanSiteFooter />
    </main>
  );
}
