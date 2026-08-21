import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketplaceCostSnapshot } from '@/components/MarketplaceCostSnapshot';

type Intent = 'payout-mismatch' | 'promotions-ads' | 'refunds-adjustments' | 'high-delivery-cost';

const INTENTS: Record<Intent, {
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  explanation: string;
  checks: string[];
  evidence: string[];
}> = {
  'payout-mismatch': {
    title: "Restaurant delivery payout mismatch calculator | Never86'd",
    description: 'Bridge marketplace sales and documented deductions to expected payout. See whether the entered DoorDash, Uber Eats, or Grubhub statement math matches the reported payout.',
    eyebrow: 'Payout does not match what you expected',
    headline: 'Bridge the statement before you blame the deposit.',
    explanation: 'A payout mismatch can come from timing, bundled settlements, reserves, prior-period adjustments, missing rows, or a real unexplained difference. First reproduce the statement math. Then match the payout reference and bank deposit for the same settlement period.',
    checks: ['Use one finalized statement or payout period.', 'Keep sales, every deduction, credits, and payout separate.', 'Match the payout reference and settlement dates before comparing the bank deposit.'],
    evidence: ['Finalized statement or payout detail', 'Payout ID and covered dates', 'Matching deposit evidence if testing cash received'],
  },
  'promotions-ads': {
    title: "DoorDash promotions and ads cost calculator | Never86'd",
    description: 'Separate restaurant-funded delivery promotions and advertising from commission and other marketplace deductions.',
    eyebrow: 'Promotions or ads are eating the order',
    headline: 'Promotion cost is not commission—but it still changes what you keep.',
    explanation: 'Show commission, marketing, and restaurant-funded incentives as separate lines. That makes the next question clear: was the charge disclosed, who funded it, what sales did it influence, and did the campaign produce contribution after food, packaging, and incremental labor?',
    checks: ['Enter only the restaurant-funded share shown by the evidence.', 'Do not relabel promotions or ads as commission.', 'Measure contribution with restaurant cost inputs before declaring a campaign profitable.'],
    evidence: ['Statement promotion and marketing rows', 'Campaign settings and funding split', 'Order-level sales and restaurant fulfillment costs'],
  },
  'refunds-adjustments': {
    title: "Restaurant delivery refunds and adjustments review | Never86'd",
    description: 'Calculate how refunds, error charges, credits, and adjustments affect marketplace cost and expected payout.',
    eyebrow: 'Refunds or adjustments keep appearing',
    headline: 'A deduction is a clue. The order evidence decides what it means.',
    explanation: 'Preserve the sign, date, reason, order reference, and payout where each adjustment settled. Repeated missing-item, cancellation, or error-charge patterns can point to an operating issue or a dispute candidate, but the statement line by itself does not prove an incorrect charge.',
    checks: ['Keep credits separate from deductions.', 'Trace material rows to order-level facts.', 'Assign recurring causes to finance, operations, or the marketplace dispute process.'],
    evidence: ['Adjustment export with order references', 'Order status and handoff evidence', 'Later credits or reversals tied to the original row'],
  },
  'high-delivery-cost': {
    title: "True third-party delivery cost calculator for restaurants | Never86'd",
    description: 'Calculate documented DoorDash, Uber Eats, or Grubhub marketplace deductions as dollars and a percentage of eligible sales.',
    eyebrow: 'The headline commission does not explain the payout',
    headline: 'Calculate the cost that is actually on the statement.',
    explanation: 'Commission is one line. Restaurant-funded promotions, advertising, merchant fees, refunds, error charges, adjustments, and credits change the effective marketplace cost. Keep this statement view separate from full delivery contribution margin, which also needs food, packaging, and incremental labor.',
    checks: ['Use the applicable sales or fee base.', 'Keep every cost category visible instead of blending it into commission.', 'Bring the agreement before making a contract-rate claim.'],
    evidence: ['Finalized marketplace statement', 'Applicable sales or fee-base definition', 'Governing agreement for any rate-compliance test'],
  },
};

type Params = Promise<{ intent: string }>;

export function generateStaticParams() {
  return Object.keys(INTENTS).map((intent) => ({ intent }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { intent } = await params;
  const page = INTENTS[intent as Intent];
  if (!page) return { title: "Not found | Never86'd" };
  const url = `https://never86.ai/audit/${intent}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description },
  };
}

export default async function AuditIntentPage({ params }: { params: Params }) {
  const { intent } = await params;
  const page = INTENTS[intent as Intent];
  if (!page) notFound();

  const url = `https://never86.ai/audit/${intent}`;
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: page.headline,
    description: page.description,
    url,
    provider: { '@id': 'https://never86.ai/#organization' },
    step: page.checks.map((check, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: check,
      text: check,
    })),
  };

  return (
    <main className="min-h-screen bg-[#090909] text-white selection:bg-[#d4a017] selection:text-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Link href="/" className="text-xl font-black tracking-tight">N86 <span className="text-[#d4a017]">NEVER 86&apos;D</span></Link>
          <Link href="/delivery-marketplace-reconciliation" className="text-xs font-black uppercase tracking-[0.14em] text-white/55 hover:text-white">3P evidence center →</Link>
        </div>
      </header>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#d4a017]">{page.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.05em] md:text-7xl">{page.headline}</h1>
          <p className="mt-7 max-w-3xl text-xl leading-relaxed text-white/65">{page.explanation}</p>
          <a href="#true-cost-snapshot" className="mt-9 inline-block rounded-xl bg-[#d4a017] px-6 py-4 font-black text-black transition hover:bg-[#e6b82e]">CALCULATE FROM MY NUMBERS →</a>
        </div>
      </section>

      <MarketplaceCostSnapshot
        intent={intent}
        pagePath={`/audit/${intent}`}
        compactIntro
        humanAuditHref={`/audit?intent=${intent}#claim`}
      />

      <section className="border-b border-white/10 bg-[#111111]">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-16 md:grid-cols-2 md:px-8 md:py-20">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d4a017]">Run these checks</p>
            <ol className="mt-5 space-y-4">
              {page.checks.map((check, index) => <li key={check} className="flex gap-4 text-white/72"><span className="font-black text-[#d4a017]">{index + 1}</span><span>{check}</span></li>)}
            </ol>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d4a017]">Evidence that moves the answer forward</p>
            <ul className="mt-5 space-y-4">
              {page.evidence.map((item) => <li key={item} className="flex gap-3 text-white/72"><span className="text-[#d4a017]">✓</span><span>{item}</span></li>)}
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-white/45 md:col-span-2">
            Never send portal credentials. Before sharing files, redact guest names, addresses, phones, emails, bank/account/routing numbers, card data, tax IDs, credentials, and unrelated identifiers. Keep the financial rows, dates, store, payout, order, and adjustment references needed to reproduce the math.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 text-center md:px-8 md:py-20">
        <h2 className="text-4xl font-black tracking-[-0.04em]">Need the source-stamped receipt?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">DoorDash is the strongest current pilot. Uber Eats and Grubhub are early-access validation tracks.</p>
        <Link href={`/audit?intent=${intent}#claim`} className="mt-7 inline-block rounded-xl bg-white px-6 py-4 font-black text-black">GET A HUMAN-REVIEWED AUDIT →</Link>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs leading-relaxed text-white/35">
        Never86&apos;d is independent and is not affiliated with or endorsed by DoorDash, Uber Eats, or Grubhub. Operational reconciliation only—not legal, tax, or accounting advice.
      </footer>
    </main>
  );
}
