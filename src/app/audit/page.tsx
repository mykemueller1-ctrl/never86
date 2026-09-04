import Link from 'next/link';

export default function AuditPage() {
  return (
    <main className="min-h-screen bg-dark-800 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-dark-300 transition-colors hover:text-gold-500">
          ← Back to Never 86&apos;d
        </Link>

        <section className="mt-8 rounded-3xl border border-dark-600 bg-dark-700/80 p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold-500">
            3P audit
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-6xl">
            3P is the Google door. The owner seat is where the proof lands.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-dark-200">
            Never 86&apos;d treats third-party delivery as one leak source inside the operator OS,
            not the whole business. The audit brings hospitality owners in with proof from the
            Google door, then the owner seat turns that proof into one approved action.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-dark-600 bg-dark-800 p-5">
              <h2 className="text-lg font-semibold text-white">Capture</h2>
              <p className="mt-3 text-sm leading-6 text-dark-300">
                Pull in orders, payouts, fees, voids, labor, and invoice truth without forcing a
                merchant-portal workflow.
              </p>
            </div>
            <div className="rounded-2xl border border-dark-600 bg-dark-800 p-5">
              <h2 className="text-lg font-semibold text-white">Decide</h2>
              <p className="mt-3 text-sm leading-6 text-dark-300">
                Use formulas first so payout is not confused with POS, invoice is not confused with
                COGS, and incomplete weeks stay open.
              </p>
            </div>
            <div className="rounded-2xl border border-dark-600 bg-dark-800 p-5">
              <h2 className="text-lg font-semibold text-white">Assign</h2>
              <p className="mt-3 text-sm leading-6 text-dark-300">
                Hand the owner one clear action and keep the receipt so the team can prove the fix.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/trial"
              className="inline-flex items-center justify-center rounded-lg bg-gold-500 px-6 py-3 font-semibold text-dark-900 transition-colors hover:bg-gold-600"
            >
              Claim the free owner seat
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-dark-500 px-6 py-3 font-semibold text-white transition-colors hover:border-gold-500 hover:text-gold-500"
            >
              Back to operator OS
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
