import Link from "next/link";
import { OwnerSeatForm } from "@/components/owner-seat-form";
import { SiteHeader } from "@/components/site-header";

const CONCEPTS = [
  {
    kicker: "Yesterday's close, one move",
    title: "Close is done. Now what?",
    body: "A close summary goes in. Never86.ai ranks it. One card rises with the move, the owner, and the proof you can check tonight.",
    asset: "Action Shift V3 - Vertical - 30 seconds.mp4",
    source: "Promo kit video, Drive file 1Z6eA5fFCi0J4vZQnJtbm6E0aNSeK0F6f",
  },
  {
    kicker: "Off at five. Stayed till seven.",
    title: "Just a question: rush, prep, or a handoff nobody owned?",
    body: "Scheduled off at 5:00, out at 7:00. The move names the shift lead and asks for coverage before the next handoff. The person stays capable.",
    asset: "Action Shift - Labor Coaching 30s - V4.mp4",
    source: "Promo kit video, Drive file 1oqyixiVFF-8yrDIwcWsFJg_jaXbFqUmo",
  },
  {
    kicker: "Same case, two invoices",
    title: "Confirm the quote before the next order.",
    body: "Same item, same spec, same pack. The move has an owner and a checklist. The dollar shows only when the file has it.",
    asset: "No matching video file in the promo kit yet",
    source: "Concept 3 from the 2026-10-24 promo README. Mood still needs an upload.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0c1412] text-[#f4f1ea]">
      <SiteHeader tone="board" />
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f0c94a]">Operator OS for 1 to 5 units</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">
              Find the leak. Assign the fix. Keep the receipt.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d5ddd8]">
              Never86.ai reads yesterday&apos;s close for a small group, up to 9 units. You get a week tally, a prime cost, and at most three moves. Each figure is Verified, Estimated, or Missing.
            </p>
            <div className="mt-8 rounded-2xl border border-[#f0c94a]/40 bg-[#f0c94a]/10 p-6">
              <p className="text-lg font-semibold">One location and the owner seat are free.</p>
              <p className="mt-2 text-sm leading-6 text-[#d5ddd8]">
                Pricing for more units is TBD. Action Shift stays the free one-seat product for a single store. This board is the multi-unit build.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/close" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f0c94a] px-6 font-semibold text-[#1a1404]">
                Open the board
              </Link>
              <Link href="/audit" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#3d5349] px-6 font-semibold">
                See the 3P audit
              </Link>
            </div>
          </div>
          <OwnerSeatForm
            title="Reserve the owner seat"
            subtitle="One location and the owner seat are free. Pricing for more seats and more units is TBD."
            buttonLabel="Reserve owner seat"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Drop", "POS, invoices, payroll, and delivery statements land together."],
            ["Sort", "Each file gets a type and a unit. You can correct the sort."],
            ["Move", "At most three actions, each with an owner, a due date, and an outcome."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-[#24332d] bg-[#13201c] p-5">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#d5ddd8]">{body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6">
          <h2 className="text-3xl font-semibold">Three ways to see the week</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {CONCEPTS.map((concept) => (
              <figure key={concept.kicker} className="flex flex-col gap-3 rounded-2xl border border-[#24332d] bg-[#13201c] p-4">
                <div
                  role="img"
                  aria-label={`Placeholder for ${concept.asset}. The file is not in this repo.`}
                  className="grid min-h-48 place-items-center rounded-xl border border-dashed border-[#3d5349] bg-[#0c1412] p-4 text-center"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f0c94a]">Needs upload</p>
                    <p className="mt-2 text-sm">{concept.asset}</p>
                  </div>
                </div>
                <figcaption>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f0c94a]">{concept.kicker}</p>
                  <h3 className="mt-2 text-xl font-semibold">{concept.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#d5ddd8]">{concept.body}</p>
                  <p className="mt-3 text-xs leading-5 text-[#9aada4]">{concept.source}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-[#9aada4]">Never86.ai · Built by an operator, for operators</p>
      </main>
    </div>
  );
}
