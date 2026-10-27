import Link from "next/link";
import { Shell } from "@/components/shell";

export default function AuditPage() {
  return (
    <Shell active="audit" title="3P audit" meta="Third-party delivery is one leak. The owner seat keeps the receipt.">
      <div className="mx-auto max-w-5xl">
        <section className="n86-card p-6 md:p-10">
          <p className="n86-eyebrow text-[#963c1c]">3P audit</p>
          <h2 className="mt-3 text-[clamp(2.1rem,3.2vw,3rem)] font-bold leading-[1.09] tracking-[-0.05em]">
            3P is the Google door. <span className="text-[#9c452c]">The owner seat is where the proof lands.</span>
          </h2>
          <p className="mt-5 max-w-3xl text-[17px] leading-[1.55] text-[#616b71]">
            Never 86&apos;d treats third-party delivery as one leak source inside the operator OS, not the whole business. The audit brings hospitality owners in with proof from the Google door, then the owner seat turns that proof into one approved action.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Capture", "Pull in orders, payouts, fees, voids, labor, and invoice truth without forcing a merchant-portal workflow."],
              ["Decide", "Use formulas first so payout is not confused with POS, invoice is not confused with COGS, and incomplete weeks stay open."],
              ["Assign", "Hand the owner one clear action and keep the receipt so the team can prove the fix."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-[10px] border border-[#d6d3d1] bg-[#fafaf9] p-5">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#57534d]">{body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/trial" className="n86-btn-primary">
              Claim the free owner seat
            </Link>
            <Link href="/close" className="n86-btn-secondary">
              Open the board
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}
