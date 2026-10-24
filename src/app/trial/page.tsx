import Link from 'next/link';
import { OwnerSeatForm } from '@/components/owner-seat-form';
import { SiteHeader } from '@/components/site-header';

export default function TrialPage() {
  return (
    <div className="min-h-screen bg-[#0c1412] text-[#f4f1ea]">
      <SiteHeader tone="board" />
    <main className="px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
        <section>
          <Link href="/" className="text-sm text-dark-300 transition-colors hover:text-gold-500">
            ← Back to Never 86&apos;d
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-gold-500">
            Free owner seat
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-6xl">
            Start with the owner seat.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-dark-200">
            This trial is the owner seat for one location. That seat is free. Pricing for more
            seats and more units is TBD.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-dark-600 bg-dark-700 p-5">
              <h2 className="text-lg font-semibold text-white">What the free seat gets</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-dark-300">
                <li>Invoice and vendor drift proof</li>
                <li>Z/POS normalization with real hospitality math</li>
                <li>Morning brief with one action for the day</li>
                <li>Audit trail that keeps the receipt with the decision</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-dark-600 bg-dark-700 p-5">
              <h2 className="text-lg font-semibold text-white">Who to add later</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-dark-300">
                <li>Seat 2: GM, operator, or area leader</li>
                <li>Seat 3: chef, beverage lead, or finance</li>
                <li>More seats: paid only when you need shared execution</li>
                <li>Owner stays the first seat and the first proof point</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-gold-700/60 bg-gold-500/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-500">
              Pricing rule
            </p>
            <p className="mt-3 text-base leading-7 text-dark-100">
              One location plus seat 1 is free. The first seat is the owner seat. Pricing for
              more seats and more units is TBD.
            </p>
          </div>
        </section>

        <OwnerSeatForm
          title="Reserve the owner seat"
          subtitle="Tell us who the owner is and which hospitality business should get the free first seat."
          buttonLabel="Reserve owner seat"
        />
      </div>
    </main>
    </div>
  );
}
