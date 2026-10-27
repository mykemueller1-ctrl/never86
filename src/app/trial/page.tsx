import Link from "next/link";
import { OwnerSeatForm } from "@/components/owner-seat-form";
import { Shell } from "@/components/shell";

export default function TrialPage() {
  return (
    <Shell active="seat" title="Owner seat" meta="One location is free. More seats and more units stay TBD.">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
        <section>
          <p className="n86-eyebrow text-[#963c1c]">Free owner seat</p>
          <h2 className="mt-3 text-[clamp(2.2rem,3.4vw,3.15rem)] font-bold leading-[1.09] tracking-[-0.055em]">
            Start with the owner seat.
          </h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-[1.55] text-[#616b71]">
            This trial is the owner seat for one location. That seat is free. Pricing for more seats and more units is TBD.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="n86-card p-5">
              <h3 className="text-lg font-semibold">What the free seat gets</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#57534d]">
                <li>Invoice and vendor drift proof</li>
                <li>Z/POS normalization with real hospitality math</li>
                <li>Morning brief with one action for the day</li>
                <li>Audit trail that keeps the receipt with the decision</li>
              </ul>
            </div>
            <div className="n86-card p-5">
              <h3 className="text-lg font-semibold">Who to add later</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#57534d]">
                <li>Seat 2: GM, operator, or area leader</li>
                <li>Seat 3: chef, beverage lead, or finance</li>
                <li>More seats: paid only when you need shared execution</li>
                <li>Owner stays the first seat and the first proof point</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-l-[3px] border-[#b84322] bg-white px-4 py-4">
            <p className="n86-eyebrow text-[#963c1c]">Pricing rule</p>
            <p className="mt-2 text-base leading-7">
              One location plus seat 1 is free. The first seat is the owner seat. Pricing for more seats and more units is TBD.
            </p>
          </div>
          <Link href="/close" className="n86-link mt-6 inline-flex">
            Open the board →
          </Link>
        </section>

        <OwnerSeatForm
          title="Reserve the owner seat"
          subtitle="Tell us who the owner is and which hospitality business should get the free first seat."
          buttonLabel="Reserve owner seat"
        />
      </div>
    </Shell>
  );
}
