import Link from 'next/link';
import { OwnerSeatForm } from '@/components/owner-seat-form';

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-gold-500">
              Operator OS for hospitality
            </p>
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl">
              Find the leak. Assign the fix. Keep the receipt.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-dark-200 md:text-xl">
              Never 86&apos;d is the operator OS for restaurants and hospitality groups. It reads
              the proof from invoices, Z reports, labor, tips, vendors, beverage, catering, and
              3P so the owner sees the one action that matters before the shift starts.
            </p>
            <div className="mt-8 rounded-2xl border border-gold-700/60 bg-gold-500/10 p-6">
              <p className="text-lg font-semibold text-white">
                One location + one owner seat is free.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-200">
                Seat 1 belongs to the owner. That first seat stays free for a single location.
                When you add seat 2, seat 3, or more people, those become paid seats.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/trial"
                className="inline-flex items-center justify-center rounded-lg bg-gold-500 px-6 py-3 font-semibold text-dark-900 transition-colors hover:bg-gold-600"
              >
                Claim free owner seat
              </Link>
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-lg border border-dark-500 px-6 py-3 font-semibold text-white transition-colors hover:border-gold-500 hover:text-gold-500"
              >
                See the 3P audit
              </Link>
            </div>
            <div className="mt-8 grid gap-4 text-sm text-dark-300 sm:grid-cols-3">
              <div className="rounded-xl border border-dark-600 bg-dark-700 p-4">
                <p className="font-semibold text-white">Homepage = operator OS</p>
                <p className="mt-2">The owner sees the full operating system, not just a fee chart.</p>
              </div>
              <div className="rounded-xl border border-dark-600 bg-dark-700 p-4">
                <p className="font-semibold text-white">3P is the Google door</p>
                <p className="mt-2">DoorDash and Uber Eats proof brings operators in through the audit.</p>
              </div>
              <div className="rounded-xl border border-dark-600 bg-dark-700 p-4">
                <p className="font-semibold text-white">Human approves the action</p>
                <p className="mt-2">Never 86&apos;d finds the leak, assigns the fix, and keeps the receipt.</p>
              </div>
            </div>
          </div>

          <OwnerSeatForm />
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-dark-600 bg-dark-700 p-6">
            <div className="mb-3 text-2xl text-gold-500">📄</div>
            <h2 className="text-xl font-semibold text-white">Vendor + invoice truth</h2>
            <p className="mt-3 text-sm leading-6 text-dark-300">
              OCR reads line items, price moves, pack changes, and invoice gaps so the owner knows
              whether COGS drift came from the vendor, the mix, or the count.
            </p>
          </div>
          <div className="rounded-2xl border border-dark-600 bg-dark-700 p-6">
            <div className="mb-3 text-2xl text-gold-500">📊</div>
            <h2 className="text-xl font-semibold text-white">Shift proof, not guesses</h2>
            <p className="mt-3 text-sm leading-6 text-dark-300">
              Z/POS, voids, labor, tips, beverage, and catering are normalized into a single
              operating picture, so POS does not get confused with payout and incomplete weeks stay open.
            </p>
          </div>
          <div className="rounded-2xl border border-dark-600 bg-dark-700 p-6">
            <div className="mb-3 text-2xl text-gold-500">☀️</div>
            <h2 className="text-xl font-semibold text-white">Yesterday to one action</h2>
            <p className="mt-3 text-sm leading-6 text-dark-300">
              The morning brief turns yesterday into the next action, the owner approves it, and
              the night proof closes the loop.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-dark-600 bg-dark-700/70 p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-500">
                Who this is for
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Built for owners first, then the rest of the floor.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-dark-300">
                Start with the owner seat so the person carrying the P&amp;L gets the cleanest signal
                first. After that, add paid seats for GMs, chefs, finance, or multi-unit leaders
                when you want the workflow shared across the operation.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gold-700 bg-dark-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
                  Seat 1
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Owner</p>
                <p className="mt-2 text-sm text-dark-300">Free for one location.</p>
              </div>
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-300">
                  Seat 2
                </p>
                <p className="mt-2 text-lg font-semibold text-white">GM or operator</p>
                <p className="mt-2 text-sm text-dark-300">Paid when you expand the team.</p>
              </div>
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-300">
                  Seat 3
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Chef or finance</p>
                <p className="mt-2 text-sm text-dark-300">Paid seat with shared proof.</p>
              </div>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-dark-400">
          Never 86&apos;d · Built by an operator, for operators · never86.ai
        </p>
      </div>
    </main>
  );
}
