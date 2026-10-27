"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HonestyChip } from "@/components/honesty-chip";
import { OwnerSeatForm } from "@/components/owner-seat-form";
import { Shell } from "@/components/shell";
import { buildBoard } from "@/lib/close/build";
import { SAMPLE_UNITS, sampleSlices } from "@/lib/close/sample";
import { formatDay, money, percentText, type Figure } from "@/lib/close/money";

const CONCEPTS = [
  {
    kicker: "Yesterday's close, one move",
    title: "Close is done. Now what?",
    body: "A close summary goes in. Never86.ai ranks it. One card rises with the move, the owner, and the proof you can check tonight.",
    category: "labor" as const,
  },
  {
    kicker: "Off at five. Stayed till seven.",
    title: "Just a question: rush, prep, or a handoff nobody owned?",
    body: "Scheduled off at 5:00, out at 7:00. The move names the shift lead and asks for coverage before the next handoff. The person stays capable.",
    category: "labor" as const,
  },
  {
    kicker: "Same case, two invoices",
    title: "Confirm the quote before the next order.",
    body: "Same item, same spec, same pack. The move has an owner and a checklist. The dollar shows only when the file has it.",
    category: "food" as const,
  },
];

function figureText(figure: Figure, kind: "money" | "percent") {
  if (figure.label === "Missing" || figure.amount === null) return "Missing";
  return kind === "money" ? money(figure.amount) : percentText(figure.amount);
}

export function HomeExperience() {
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [focus, setFocus] = useState("harbor");
  const board = useMemo(
    () =>
      buildBoard({
        units: SAMPLE_UNITS,
        slices: sampleSlices(),
        targets: { labor: 30, food: 30 },
        owner: "Owner",
        today,
      }),
    [today]
  );
  const scope = board.scopes.find((item) => item.id === focus) ?? board.scopes[0];
  const lead = scope.strip[0];
  const tile = lead ? scope.tiles.find((item) => item.category === lead.category) : undefined;
  const latest = scope.days[scope.days.length - 1];
  const move = scope.actions[0];
  const through = board.latestDay ? formatDay(board.latestDay) : "no dated rows";

  const delta =
    lead && lead.variance !== null && lead.variance !== 0
      ? `${lead.variance > 0 ? money(lead.variance) + " over" : money(Math.abs(lead.variance)) + " under"}`
      : lead?.label ?? "Missing";

  return (
    <Shell
      active="home"
      title="The week"
      meta={`Business date: ${through}. Reports through ${through}.`}
      location={
        <label className="grid min-w-[10rem] text-[11px] font-bold uppercase tracking-[0.08em] text-[#657078]">
          Unit
          <select className="n86-field mt-1" value={scope.id} onChange={(event) => setFocus(event.target.value)} aria-label="Unit">
            {board.scopes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      }
      action={
        <Link href="/close" className="n86-btn-primary">
          Open the board
        </Link>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-8">
        <section className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="n86-eyebrow text-[#963c1c]">Operator OS for 1 to 5 units</p>
            <h2 className="mt-3 max-w-3xl text-[clamp(2rem,3.6vw,3.15rem)] font-bold leading-[1.09] tracking-[-0.055em]">
              Find the leak. <span className="text-[#9c452c]">Assign the fix. Keep the receipt.</span>
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SampleFact label="Sales" value={latest ? figureText(latest.sales, "money") : "Missing"} note={latest ? formatDay(latest.date) : "No date"} labelChip={latest?.sales.label} />
              <SampleFact label="Labor %" value={latest ? figureText(latest.laborPct, "percent") : "Missing"} note="Of that day's sales" labelChip={latest?.laborPct.label} />
              <SampleFact label="Prime cost" value={figureText(scope.prime.dollars, "money")} note={scope.prime.note} labelChip={scope.prime.dollars.label} />
            </div>
            <p className="mt-5 max-w-xl text-[17px] leading-[1.55] text-[#616b71]">
              Never86.ai reads yesterday&apos;s close for a small group, up to 9 units. You get a week tally, a prime cost, and at most three moves. Each figure is Verified, Estimated, or Missing.
            </p>
            <div className="mt-6 border-l-[3px] border-[#b84322] bg-white px-4 py-3">
              <p className="n86-eyebrow text-[#963c1c]">Seat</p>
              <p className="mt-1 text-[15px] font-semibold">One location and the owner seat are free.</p>
              <p className="mt-1 text-sm leading-6 text-[#657078]">
                Pricing for more units is TBD. Action Shift stays the free one-seat product for a single store. This board is the multi-unit build.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/close" className="n86-btn-primary">
                Open the board
              </Link>
              <Link href="/audit" className="n86-btn-secondary">
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

        {lead ? (
          <article className="n86-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="n86-eyebrow text-[#657078]">Finding</p>
              <span className="rounded-md bg-[#f8e9e1] px-2 py-1 font-mono text-xs font-medium text-[#92432a]">
                {delta}
                {tile && tile.percent.amount !== null ? ` · ${percentText(tile.percent.amount)} of sales` : ""}
                {tile?.targetPct !== null && tile?.targetPct !== undefined ? ` vs ${tile.targetPct}%` : ""}
              </span>
            </div>
            <hr className="my-4 border-[#e7e5e4]" />
            <h3 className="text-xl font-bold tracking-[-0.02em]">{lead.text}</h3>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e5e4] pt-4">
              <HonestyChip label={lead.label} />
              <Link href="/close#today" className="n86-link">
                View the math →
              </Link>
            </div>
          </article>
        ) : null}

        {move ? (
          <article className="n86-card p-6">
            <p className="n86-eyebrow text-[#963c1c]">Next action · Due {formatDay(move.due)}</p>
            <h3 className="mt-2 text-base font-bold">{move.title}</h3>
            <ol className="mt-4 grid gap-2">
              <li className="flex gap-3 rounded-lg border border-[#e7e5e4] bg-[#fafaf9] px-3 py-2 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#25262a] text-xs font-bold text-white">1</span>
                <span>{move.outcome}</span>
              </li>
              <li className="flex gap-3 rounded-lg border border-[#e7e5e4] bg-[#fafaf9] px-3 py-2 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#25262a] text-xs font-bold text-white">2</span>
                <span>
                  Owner {move.owner}. Due {formatDay(move.due)}.
                </span>
              </li>
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <HonestyChip label={move.label} />
              <span className="font-mono text-2xl">{move.amount === null || move.label === "Missing" ? "Missing" : money(move.amount)}</span>
              <Link href="/close#moves" className="n86-link ml-auto">
                Open the move →
              </Link>
            </div>
          </article>
        ) : null}

        <section className="grid gap-4">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">Three ways to see the week</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {CONCEPTS.map((concept) => {
              const cardTile = scope.tiles.find((item) => item.category === concept.category);
              return (
                <article key={concept.kicker} className="n86-card flex flex-col gap-3 border-t-[3px] border-t-[#cb7247] p-5">
                  <p className="n86-eyebrow text-[#963c1c]">{concept.kicker}</p>
                  <h3 className="text-[21px] font-semibold tracking-[-0.02em]">{concept.title}</h3>
                  <p className="text-sm leading-6 text-[#57534d]">{concept.body}</p>
                  {cardTile ? (
                    <p className="mt-auto border-t border-[#e7e5e4] pt-3 font-mono text-sm">
                      {cardTile.title}: {figureText(cardTile.spend, "money")} · {figureText(cardTile.percent, "percent")} of sales
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
        <p className="text-center text-xs text-[#657078]">Never86.ai · Built by an operator, for operators</p>
      </div>
    </Shell>
  );
}

function SampleFact({ label, value, note, labelChip }: { label: string; value: string; note: string; labelChip?: Figure["label"] }) {
  return (
    <div className="n86-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#657078]">{label}</p>
        {labelChip ? <HonestyChip label={labelChip} /> : null}
      </div>
      <p className="mt-2 font-mono text-[21px] font-medium">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#657078]">{note}</p>
    </div>
  );
}
