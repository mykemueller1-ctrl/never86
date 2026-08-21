import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedAnswers } from '@/lib/answersDb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Restaurant delivery marketplace reconciliation | Never86'd",
  description: 'Evidence-first help with DoorDash, Uber Eats, and Grubhub statements, fees, promotions, refunds, adjustments, payouts, and bank deposits. Start with one redacted statement.',
  alternates: { canonical: 'https://never86.ai/delivery-marketplace-reconciliation' },
  openGraph: {
    title: 'Restaurant delivery fees and payouts, explained from the statement',
    description: 'One evidence center for DoorDash, Uber Eats, and Grubhub reconciliation. No portal password and no unsupported recovery claim.',
    url: 'https://never86.ai/delivery-marketplace-reconciliation',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Restaurant delivery marketplace reconciliation',
    description: '52 evidence-first field guides for 3P statements, fees, refunds, payouts, and deposits.',
  },
};

const PLATFORM_FACTS = [
  {
    platform: 'DoorDash',
    fact: 'DoorDash distinguishes estimated Transactions from finalized Payouts and says the finalized payout detail should be used for regular financial reconciliation.',
    source: 'https://help.doordash.com/en-us/merchants/article/how-can-i-receive-my-weekly-pay-statements',
  },
  {
    platform: 'Uber Eats',
    fact: 'Uber Eats provides past payment statements and order-by-order breakdowns, while its Merchant Academy explains how Payment Details and Order Errors reports connect deductions with order-level evidence.',
    source: 'https://merchants.ubereats.com/us/en/academy/order-errors/',
  },
  {
    platform: 'Grubhub',
    fact: 'Grubhub financial statements separate marketplace orders, cancelled orders, prepaid orders, promotions, and order adjustments.',
    source: 'https://get.grubhub.com/help-center/grubhub-finacial-statement/',
  },
];

const MONEY_PATH = ['Order', 'Statement', 'Fees + adjustments', 'Expected payout', 'Bank deposit', 'Exception', 'Owner', 'Resolution'];

const COMPLAINT_PATHS = [
  { href: '/audit/payout-mismatch', label: 'My payout does not match', detail: 'Bridge statement sales and deductions to expected payout.' },
  { href: '/audit/promotions-ads', label: 'Promotions or ads cost too much', detail: 'Separate restaurant-funded spend from commission.' },
  { href: '/audit/refunds-adjustments', label: 'Refunds or adjustments keep appearing', detail: 'Quantify the effect, then trace the order evidence.' },
  { href: '/audit/high-delivery-cost', label: 'My delivery cost feels too high', detail: 'Calculate effective marketplace cost from every line.' },
];

export default async function DeliveryMarketplaceReconciliationPage() {
  const answers = await listPublishedAnswers();
  const threePAnswers = answers.filter((answer) => answer.week);

  const categories = Array.from(threePAnswers.reduce((map, answer) => {
    const key = answer.category ?? 'Start here';
    const value = map.get(key) ?? [];
    value.push(answer);
    map.set(key, value);
    return map;
  }, new Map<string, typeof threePAnswers>()));

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://never86.ai/delivery-marketplace-reconciliation#collection',
    name: 'Restaurant delivery marketplace reconciliation evidence center',
    description: 'Evidence-first field guides for restaurant DoorDash, Uber Eats, Grubhub, and catering statements, deductions, payouts, and bank reconciliation.',
    url: 'https://never86.ai/delivery-marketplace-reconciliation',
    publisher: { '@id': 'https://never86.ai/#organization' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: threePAnswers.length,
      itemListElement: threePAnswers.map((answer, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: answer.title,
        url: `https://never86.ai/answers/${answer.slug}`,
      })),
    },
  };

  return (
    <main className="compass min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <header className="max-w-7xl mx-auto px-6 pt-6 pb-4 flex items-start justify-between gap-6 flex-wrap">
        <Link href="/" className="flex items-start gap-4 group min-w-0">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">Never 86&apos;d <span className="italic text-ink-600">· 3P evidence</span></p>
            <p className="compass-eyebrow-dim mt-2">Restaurant delivery marketplace reconciliation</p>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-[13px]">
          <Link href="/answers" className="compass-pill"><span className="avatar">52</span><span>Field guides</span></Link>
          <Link href="/audit" className="btn-primary" style={{ background: '#0066ff' }}>Audit one statement</Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-16">
        <p className="compass-eyebrow mb-6">— The operator question</p>
        <h1 className="compass-display text-5xl md:text-7xl max-w-4xl mb-7">Where did the delivery money go?</h1>
        <p className="compass-body text-xl md:text-2xl max-w-3xl leading-relaxed">
          Never86&apos;d helps restaurants explain third-party delivery statements, fees, promotions, refunds, adjustments, payouts, and deposits. Start with one redacted finalized statement. The first useful answer does not require a portal password or software integration.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/audit" className="btn-primary" style={{ background: '#0066ff' }}>Run the free marketplace audit</Link>
          <Link href="/answers/first-30-minutes-of-a-marketplace-payout-investigation" className="compass-pill">Start the 30-minute investigation →</Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20" aria-labelledby="complaint-paths-heading">
        <p className="compass-eyebrow mb-4">— Start with the complaint you already have</p>
        <h2 id="complaint-paths-heading" className="compass-display text-3xl md:text-5xl mb-8">One problem. One useful first answer.</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {COMPLAINT_PATHS.map((path) => (
            <Link key={path.href} href={path.href} className="compass-card group">
              <h3 className="!mt-0">{path.label}</h3>
              <p className="compass-body mt-3">{path.detail}</p>
              <span className="mt-5 inline-block text-sm font-semibold" style={{ color: '#0066ff' }}>Run the free snapshot <span className="transition-transform group-hover:translate-x-1">→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20" aria-labelledby="money-path-heading">
        <div className="compass-card p-7 md:p-9">
          <p className="compass-eyebrow mb-3">— One control chain</p>
          <h2 id="money-path-heading" className="compass-display text-3xl md:text-4xl mb-8">Follow the money. Keep the receipt.</h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MONEY_PATH.map((step, index) => (
              <li key={step} className="rounded-xl border border-[#e8e8ed] p-4 bg-white">
                <span className="font-mono text-[10px]" style={{ color: '#0066ff' }}>{String(index + 1).padStart(2, '0')}</span>
                <p className="mt-2 font-semibold text-ink-800">{step}</p>
              </li>
            ))}
          </ol>
          <p className="compass-body mt-7 max-w-3xl">A matching deposit proves the statement paid as calculated. It does not prove the contract rate was correct. A rate claim needs the agreement; a cash claim needs the bank evidence; an order-error claim needs the order-level facts.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20" aria-labelledby="platform-evidence-heading">
        <p className="compass-eyebrow mb-4">— What the platforms publish</p>
        <h2 id="platform-evidence-heading" className="compass-display text-3xl md:text-5xl mb-8">The evidence exists. The operator still has to connect it.</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLATFORM_FACTS.map((item) => (
            <article key={item.platform} className="compass-card">
              <p className="compass-card-label">{item.platform}</p>
              <p className="compass-body text-base leading-relaxed mt-3">{item.fact}</p>
              <a href={item.source} className="inline-block mt-4 text-sm underline" style={{ color: '#0066ff' }}>Official merchant source ↗</a>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24" aria-labelledby="guides-heading">
        <div className="flex items-end justify-between gap-5 flex-wrap mb-8">
          <div>
            <p className="compass-eyebrow mb-4">— A year of field questions</p>
            <h2 id="guides-heading" className="compass-display text-3xl md:text-5xl">{threePAnswers.length} citable guides, live now.</h2>
          </div>
          <Link href="/llms-full.txt" className="compass-pill">LLM-readable full corpus ↗</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map(([category, categoryAnswers]) => (
            <section key={category} className="compass-card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="!mt-0">{category}</h3>
                <span className="font-mono text-[10px]" style={{ color: '#86868b' }}>{categoryAnswers.length} guides</span>
              </div>
              <ul className="space-y-3">
                {categoryAnswers.slice(0, 5).map((answer) => (
                  <li key={answer.slug}>
                    <Link href={`/answers/${answer.slug}`} className="text-sm font-medium text-ink-800 hover:underline" style={{ textDecorationColor: '#0066ff' }}>
                      {answer.title} <span style={{ color: '#0066ff' }}>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {categoryAnswers.length > 5 ? <Link href="/answers" className="inline-block mt-5 text-xs" style={{ color: '#0066ff' }}>See all {categoryAnswers.length} →</Link> : null}
            </section>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8e8ed] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="compass-eyebrow mb-4">— The proof boundary</p>
            <h2 className="compass-display text-3xl md:text-5xl">We explain the evidence. We do not invent the win.</h2>
            <p className="compass-body text-lg mt-5 max-w-3xl">DoorDash statement auditing is the strongest current pilot. Uber Eats, Grubhub, and ezCater are early-access validation tracks. Repeat paid use, deterministic cross-platform coverage, and enterprise reliability still have to be earned.</p>
          </div>
          <Link href="/answers/how-proven-is-never86d-marketplace-audit" className="btn-primary" style={{ background: '#111' }}>Read what is proven</Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14">
        <p className="compass-body text-sm leading-relaxed" style={{ color: '#6e6e73' }}>Never86&apos;d is independent and is not affiliated with or endorsed by DoorDash, Uber Eats, Grubhub, or ezCater. This is operational reconciliation guidance, not legal, tax, or accounting advice. Platform sources were checked August 21, 2026. <Link href="/evidence-standard" className="underline">Read the evidence, privacy, and corrections standard.</Link></p>
      </section>

      <footer className="py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[#6e6e73] text-[12px] gap-5 flex-wrap">
          <span>Never 86&apos;d · Built by operators · Evidence updated August 21, 2026</span>
          <div className="flex items-center gap-5"><Link href="/answers">All answers</Link><Link href="/audit">Free audit</Link></div>
        </div>
      </footer>
    </main>
  );
}
