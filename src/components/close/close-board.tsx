"use client";

import { useState, useMemo } from "react";
import { HonestyChip } from "@/components/honesty-chip";
import { Shell } from "@/components/shell";
import type { Move, ScopeView, Tile } from "@/lib/close/build";
import { buildBoard } from "@/lib/close/build";
import { slicesFromTable, type Slice, type UnitRef } from "@/lib/close/classify";
import {
  CATEGORIES,
  CATEGORY_TITLE,
  type Category,
  type EvidenceLabel,
  type Figure,
  type FileKind,
  formatDay,
  KIND_LABEL,
  money,
  parseTarget,
  percentText,
} from "@/lib/close/money";
import { SAMPLE_TARGETS, SAMPLE_UNITS, sampleSlices } from "@/lib/close/sample";
import { parseTable } from "@/lib/close/table";
import { tablesFromFile } from "@/lib/close/workbook";

const EMPTY_TARGETS: Record<Category, string> = {
  food: "",
  beverage: "",
  paper: "",
  labor: "",
  delivery: "",
  other: "",
};

function Chip({ label }: { label: EvidenceLabel }) {
  return <HonestyChip label={label} />;
}

function showMoney(figure: Figure) {
  if (figure.label === "Missing" || figure.amount === null) return "Missing";
  return money(figure.amount);
}

function showPercent(figure: Figure) {
  if (figure.label === "Missing" || figure.amount === null) return "Missing";
  return percentText(figure.amount);
}

function newUnit(index: number): UnitRef {
  return { id: `unit-${index}-${Math.random().toString(36).slice(2, 7)}`, name: "" };
}

export function CloseBoard() {
  const [phase, setPhase] = useState<"setup" | "board">("setup");
  const [groupName, setGroupName] = useState("");
  const [owner, setOwner] = useState("");
  const [units, setUnits] = useState<UnitRef[]>([newUnit(1)]);
  const [slices, setSlices] = useState<Slice[]>([]);
  const [targets, setTargets] = useState<Record<Category, string>>(EMPTY_TARGETS);
  const [focus, setFocus] = useState("all");
  const [sampleOn, setSampleOn] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteName, setPasteName] = useState("Pasted rows");
  const [busy, setBusy] = useState(false);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const namedUnits = units.filter((unit) => unit.name.trim());
  const board = useMemo(
    () =>
      buildBoard({
        units: namedUnits,
        slices,
        targets: Object.fromEntries(CATEGORIES.map((category) => [category, parseTarget(targets[category])])) as Partial<
          Record<Category, number | null>
        >,
        owner: owner.trim() || "Owner",
        today,
      }),
    [namedUnits, slices, targets, owner, today]
  );
  const scope = board.scopes.find((item) => item.id === focus) ?? board.scopes[0];

  async function addFiles(list: FileList | File[]) {
    setBusy(true);
    try {
      const incoming: Slice[] = [];
      for (const file of Array.from(list)) {
        const tables = await tablesFromFile(file);
        tables.forEach((table, index) => {
          incoming.push(
            ...slicesFromTable({
              id: `${file.name}-${Date.now()}-${index}-${incoming.length}`,
              fileName: table.fileName,
              rows: table.rows,
              units: namedUnits,
              readable: table.readable,
              detail: table.detail,
            })
          );
        });
      }
      setSlices((current) => [...current, ...incoming]);
      setSampleOn(false);
    } finally {
      setBusy(false);
    }
  }

  function addPaste() {
    const text = paste.trim();
    if (!text) return;
    const name = pasteName.trim() || "Pasted rows";
    setSlices((current) => [
      ...current,
      ...slicesFromTable({
        id: `paste-${Date.now()}`,
        fileName: name.endsWith(".csv") ? name : `${name}.csv`,
        rows: parseTable(text),
        units: namedUnits,
        readable: true,
      }),
    ]);
    setPaste("");
    setSampleOn(false);
  }

  function loadSample() {
    setGroupName("Fictional Group");
    setOwner("Owner");
    setUnits(SAMPLE_UNITS);
    setSlices(sampleSlices());
    setTargets({ ...EMPTY_TARGETS, ...SAMPLE_TARGETS });
    setFocus("all");
    setSampleOn(true);
    setPhase("board");
  }

  function updateSlice(id: string, patch: Partial<Pick<Slice, "kind" | "unitId">>) {
    setSlices((current) => current.map((slice) => (slice.id === id ? { ...slice, ...patch } : slice)));
  }

  const through = board.latestDay ? formatDay(board.latestDay) : null;
  return (
    <>
      <a href="#today" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
        Skip to how today went
      </a>
      <Shell
        active="close"
        title={phase === "board" ? groupName || "The close" : "Name the units"}
        meta={through ? `Business date: ${through}. Reports through ${through}.` : "Drop a file to set the business date."}
        location={
          phase === "board" && scope ? (
            <label className="grid min-w-[10rem] text-[11px] font-bold uppercase tracking-[0.08em] text-[#657078]">
              Unit
              <select className="n86-field mt-1" aria-label="Unit" value={scope.id} onChange={(event) => setFocus(event.target.value)}>
                {board.scopes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null
        }
        action={
          phase === "board" ? (
            <label htmlFor="close-files" className="n86-btn-primary cursor-pointer">
              Add my records
            </label>
          ) : null
        }
        aside={phase === "board" ? <FileRail slices={slices} /> : null}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
        {phase === "setup" ? (
          <Setup
            groupName={groupName}
            owner={owner}
            units={units}
            onGroup={setGroupName}
            onOwner={setOwner}
            onUnits={setUnits}
            onStart={() => {
              setFocus("all");
              setPhase("board");
            }}
            onSample={loadSample}
            ready={groupName.trim().length > 1 && namedUnits.length > 0}
          />
        ) : scope ? (
          <BoardView
            groupName={groupName}
            sampleOn={sampleOn}
            busy={busy}
            boardWeek={board.weekStart}
            latestDay={board.latestDay}
            dayWord={board.dayWord}
            notes={board.notes}
            slices={slices}
            units={namedUnits}
            scope={scope}
            targets={targets}
            paste={paste}
            pasteName={pasteName}
            onFiles={addFiles}
            onPaste={setPaste}
            onPasteName={setPasteName}
            onAddPaste={addPaste}
            onSlice={updateSlice}
            onTarget={(category, value) => setTargets((current) => ({ ...current, [category]: value }))}
            onSample={loadSample}
          />
        ) : null}
        </div>
      </Shell>
    </>
  );
}

function Setup(props: {
  groupName: string;
  owner: string;
  units: UnitRef[];
  ready: boolean;
  onGroup: (value: string) => void;
  onOwner: (value: string) => void;
  onUnits: (units: UnitRef[]) => void;
  onStart: () => void;
  onSample: () => void;
}) {
  return (
    <section className="grid w-full gap-6">
      <p className="n86-eyebrow text-[#963c1c]">Never86.ai</p>
      <h2 className="text-[clamp(2rem,3vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.045em]">Name the units. Then drop the week.</h2>
      <p className="text-base leading-7 text-[#616b71]">
        Built for operators with 1 to 5 units, with room for 9. One drop covers every store. Pricing for more units is TBD.
      </p>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (props.ready) props.onStart();
        }}
      >
        <label className="grid gap-2 text-sm font-semibold">
          Group name
          <input
            required
            value={props.groupName}
            onChange={(event) => props.onGroup(event.target.value)}
            className="n86-field"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Who owns the next move
          <input
            value={props.owner}
            onChange={(event) => props.onOwner(event.target.value)}
            placeholder="Owner"
            className="n86-field"
          />
        </label>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold">Units</legend>
          {props.units.map((unit, index) => (
            <div key={unit.id} className="flex gap-2">
              <label className="grid flex-1 gap-1 text-sm">
                <span className="sr-only">Unit {index + 1} name</span>
                <input
                  value={unit.name}
                  onChange={(event) =>
                    props.onUnits(props.units.map((item) => (item.id === unit.id ? { ...item, name: event.target.value } : item)))
                  }
                  placeholder={index === 0 ? "Harbor Grill" : "Second unit"}
                  className="n86-field"
                />
              </label>
              {props.units.length > 1 ? (
                <button
                  type="button"
                  className="n86-btn-secondary"
                  onClick={() => props.onUnits(props.units.filter((item) => item.id !== unit.id))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            disabled={props.units.length >= 9}
            className="n86-btn-secondary border-dashed disabled:opacity-40"
            onClick={() => props.onUnits([...props.units, newUnit(props.units.length + 1)])}
          >
            {props.units.length >= 9 ? "9 units is the stretch" : "Add a unit"}
          </button>
        </fieldset>
        <button type="submit" disabled={!props.ready} className="n86-btn-primary disabled:opacity-40">
          Open the board
        </button>
      </form>
      <button type="button" onClick={props.onSample} className="n86-link w-fit text-left">
        Use fictional sample data instead
      </button>
    </section>
  );
}

function BoardView(props: {
  groupName: string;
  sampleOn: boolean;
  busy: boolean;
  boardWeek: string | null;
  latestDay: string | null;
  dayWord: string;
  notes: string[];
  slices: Slice[];
  units: UnitRef[];
  scope: ScopeView;
  targets: Record<Category, string>;
  paste: string;
  pasteName: string;
  onFiles: (files: FileList | File[]) => void;
  onPaste: (value: string) => void;
  onPasteName: (value: string) => void;
  onAddPaste: () => void;
  onSlice: (id: string, patch: Partial<Pick<Slice, "kind" | "unitId">>) => void;
  onTarget: (category: Category, value: string) => void;
  onSample: () => void;
}) {
  const kicker = props.dayWord === "today" ? "How today went" : props.latestDay ? `How ${formatDay(props.latestDay)} went` : "How today went";
  return (
    <>
      <section className="grid gap-3">
        <p className="n86-eyebrow text-[#963c1c]">{props.groupName}</p>
        <h2 className="max-w-3xl text-[clamp(1.8rem,3vw,2.4rem)] font-bold tracking-[-0.045em]">Yesterday, across the units.</h2>
        <p className="max-w-2xl text-[#616b71]">
          Drop the close, the invoices, payroll, and the delivery statements. The board sorts them, then keeps at most three moves.
        </p>
        {props.sampleOn ? (
          <p className="border-l-[3px] border-[#b84322] bg-white px-4 py-3 text-sm leading-6">
            Sample data. Fictional restaurants. These numbers are not your close. Labor and food targets are filled in so you can see an over and an under. Clear a target to get the prompt.
          </p>
        ) : (
          <button type="button" onClick={props.onSample} className="n86-link w-fit">
            Load fictional sample data
          </button>
        )}
      </section>

      <DropZone busy={props.busy} onFiles={props.onFiles} />

      <form
        className="n86-card grid gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          props.onAddPaste();
        }}
      >
        <label className="grid gap-2 text-sm font-semibold">
          Or paste rows
          <textarea
            value={props.paste}
            onChange={(event) => props.onPaste(event.target.value)}
            rows={4}
            className="n86-field min-h-28 py-3 font-mono text-sm"
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="grid flex-1 gap-1 text-sm font-semibold">
            Name this paste
            <input
              value={props.pasteName}
              onChange={(event) => props.onPasteName(event.target.value)}
              className="n86-field"
            />
          </label>
          <button type="submit" className="n86-btn-primary sm:self-end">
            Add rows
          </button>
        </div>
      </form>

      <section className="grid gap-3" aria-labelledby="sort-heading">
        <h2 id="sort-heading" className="text-2xl font-semibold">
          Sorting summary
        </h2>
        <p className="text-sm text-[#616b71]">Each file lands in a type and a unit. Change either one if the sort is wrong. The tally updates with the correction.</p>
        {props.slices.length === 0 ? (
          <p className="text-sm text-[#616b71]">Awaiting files.</p>
        ) : (
          <ul className="grid gap-3">
            {props.slices.map((slice) => (
              <li key={slice.id} className="n86-card grid gap-3 p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div>
                  <p className="font-semibold">{slice.fileName}</p>
                  <p className="mt-1 text-sm text-[#616b71]">{slice.detail}</p>
                </div>
                <label className="grid gap-1 text-sm font-semibold">
                  Type
                  <select
                    value={slice.kind}
                    onChange={(event) => props.onSlice(slice.id, { kind: event.target.value as FileKind })}
                    className="n86-field"
                  >
                    {(Object.keys(KIND_LABEL) as FileKind[]).map((kind) => (
                      <option key={kind} value={kind}>
                        {KIND_LABEL[kind]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Unit
                  <select
                    value={slice.unitId ?? ""}
                    onChange={(event) => props.onSlice(slice.id, { unitId: event.target.value || null })}
                    className="n86-field"
                  >
                    <option value="">Unassigned</option>
                    {props.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="today" aria-live="polite" className="grid gap-4">
        <div>
          <p className="n86-eyebrow text-[#963c1c]">{kicker}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">{props.scope.name}</h2>
        </div>
        {props.scope.strip.length === 0 ? (
          <p className="text-sm text-[#616b71]">Awaiting a day with sales and spend.</p>
        ) : (
          <ul className="grid gap-3">
            {props.scope.strip.map((line) => {
              const over = line.variance !== null && line.variance > 0;
              const under = line.variance !== null && line.variance < 0;
              const chip = over ? `${money(line.variance)} over` : under ? `${money(Math.abs(line.variance ?? 0))} under` : line.label;
              return (
                <li key={`${line.category}-${line.text}`} className="n86-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="n86-eyebrow text-[#657078]">Finding</p>
                    <span className={`rounded-md px-2 py-1 font-mono text-xs ${over ? "bg-[#f8e9e1] text-[#92432a]" : under ? "bg-[#e7f7ee] text-[#166534]" : "bg-[#f5f5f4] text-[#44403c]"}`}>
                      {chip}
                    </span>
                  </div>
                  <hr className="my-3 border-[#e7e5e4]" />
                  <p className="text-lg font-bold leading-7 tracking-[-0.02em]">{line.text}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e5e4] pt-3">
                    <Chip label={line.label} />
                    <a href={`#tile-${line.category}`} className="n86-link">
                      View the math →
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">Week tally</h2>
          <p className="text-sm text-[#657078]">{props.boardWeek ? `Week of ${formatDay(props.boardWeek)}` : "No dated rows yet"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {props.scope.tiles.map((tile) => (
            <TileCard key={tile.category} tile={tile} target={props.targets[tile.category]} onTarget={props.onTarget} />
          ))}
        </div>
        {props.notes.map((note) => (
          <p key={note} className="text-sm text-[#616b71]">
            {note}
          </p>
        ))}
      </section>

      <section className="grid gap-3" aria-labelledby="daily-heading">
        <h2 id="daily-heading" className="text-2xl font-semibold">
          Daily numbers
        </h2>
        {props.scope.days.length === 0 ? (
          <p className="text-sm text-[#616b71]">No dates on the files yet.</p>
        ) : (
          <ul className="grid gap-3">
            {props.scope.days.map((day) => (
              <li key={day.date} className="n86-card p-4">
                <h3 className="font-semibold">{formatDay(day.date)}</h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <DailyFact label="Sales" figure={day.sales} kind="money" />
                  <DailyFact label="Labor %" figure={day.laborPct} kind="percent" />
                  <DailyFact label="Food cost" figure={day.foodCost} kind="money" />
                  <DailyFact label="Comps" figure={day.comps} kind="money" />
                  <DailyFact label="Voids" figure={day.voids} kind="money" />
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="n86-card grid gap-3 p-5" aria-labelledby="prime-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="prime-heading" className="text-2xl font-semibold">
            Weekly prime cost
          </h2>
          <Chip label={props.scope.prime.dollars.label} />
          <span className="rounded-full border border-[#d6d3d1] bg-[#fafaf9] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.07em] text-[#44403c]">
            {props.scope.prime.weekStatus === "closed" ? "Closed week" : "Open week"}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#657078]">Dollars</p>
            <p className="mt-1 font-mono text-4xl">{showMoney(props.scope.prime.dollars)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#657078]">Of sales</p>
            <p className="mt-1 font-mono text-4xl">{showPercent(props.scope.prime.percent)}</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-[#616b71]">{props.scope.prime.note}</p>
      </section>

      <section className="grid gap-3" aria-labelledby="moves-heading">
        <h2 id="moves-heading" className="text-2xl font-semibold">
          Three moves
        </h2>
        <ActionList actions={props.scope.actions} />
      </section>
    </>
  );
}

function DropZone({ busy, onFiles }: { busy: boolean; onFiles: (files: FileList | File[]) => void }) {
  return (
    <div
      id="drop"
      className="relative rounded-xl border border-dashed border-[#d97552] bg-white p-6"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files);
      }}
    >
      <input
        id="close-files"
        aria-label="Drop POS exports, invoices, payroll, delivery statements, CSV, Excel, PDF, or photos"
        type="file"
        multiple
        accept=".csv,.tsv,.txt,.xlsx,.xls,.pdf,image/*,text/csv,text/plain"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="n86-eyebrow text-[#963c1c]">One drop</p>
      <p className="mt-2 text-2xl font-bold tracking-[-0.03em]">{busy ? "Reading files..." : "Drop yesterday's close"}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#616b71]">
        POS exports, invoices, payroll, DoorDash, Uber Eats, Grubhub. CSV, Excel, PDF, or a photo. A photo keeps its place in the sort. The dollars stay Missing until the rows can be read.
      </p>
    </div>
  );
}

function TileCard({
  tile,
  target,
  onTarget,
}: {
  tile: Tile;
  target: string;
  onTarget: (category: Category, value: string) => void;
}) {
  return (
    <article id={`tile-${tile.category}`} className="n86-card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{tile.title}</h3>
        <Chip label={tile.spend.label} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#657078]">Week dollars</p>
          <p className="mt-1 font-mono text-3xl">{showMoney(tile.spend)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#657078]">Of sales</p>
          <p className="mt-1 font-mono text-3xl">{showPercent(tile.percent)}</p>
        </div>
      </div>
      {tile.spend.label === "Missing" ? null : <p className="text-sm leading-6 text-[#616b71]">{tile.sourceNote}</p>}
      <p className="text-sm leading-6">
        <Chip label={tile.noteLabel} /> <span className="ml-2">{tile.note}</span>
      </p>
      <label className="mt-auto grid gap-1 text-sm font-semibold">
        Target percent for {CATEGORY_TITLE[tile.category]}
        <input
          inputMode="decimal"
          value={target}
          placeholder="No target yet"
          onChange={(event) => onTarget(tile.category, event.target.value)}
          className="n86-field"
        />
      </label>
    </article>
  );
}

function DailyFact({ label, figure, kind }: { label: string; figure: Figure; kind: "money" | "percent" }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#657078]">{label}</dt>
      <dd className="mt-1 font-mono text-xl">{kind === "money" ? showMoney(figure) : showPercent(figure)}</dd>
      <dd className="mt-1">
        <Chip label={figure.label} />
      </dd>
      {figure.missing ? <dd className="mt-1 text-xs leading-5 text-[#616b71]">{figure.missing}</dd> : null}
    </div>
  );
}

function ActionList({ actions }: { actions: Move[] }) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  if (!actions.length) {
    return <p className="text-sm text-[#616b71]">Nothing to move on yet. Add a file, or set a target if you want an over or under.</p>;
  }
  return (
    <ol className="grid gap-3">
      {actions.slice(0, 3).map((action, index) => {
        const done = Boolean(accepted[action.id]);
        return (
          <li key={action.id} className="n86-card p-5">
            <p className="n86-eyebrow text-[#963c1c]">Next action {index + 1} · Due {formatDay(action.due)}</p>
            <h3 className="mt-2 text-lg font-bold tracking-[-0.02em]">{action.title}</h3>
            <ol className="mt-4 grid gap-2">
              <li className="flex gap-3 rounded-lg border border-[#e7e5e4] bg-[#fafaf9] px-3 py-2 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#25262a] text-xs font-bold text-white">1</span>
                <span>{action.outcome}</span>
              </li>
              <li className="flex gap-3 rounded-lg border border-[#e7e5e4] bg-[#fafaf9] px-3 py-2 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#25262a] text-xs font-bold text-white">2</span>
                <span>
                  Owner {action.owner}. Due {formatDay(action.due)}. Source: {action.source}.
                </span>
              </li>
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#e7e5e4] pt-4">
              <Chip label={action.label} />
              <p className="font-mono text-3xl">{action.amount === null || action.label === "Missing" ? "Missing" : money(action.amount)}</p>
              <button type="button" className="n86-btn-primary ml-auto" disabled={done} onClick={() => setAccepted((current) => ({ ...current, [action.id]: true }))}>
                {done ? "Accepted" : "Accept move"}
              </button>
            </div>
            {done ? <p className="mt-2 text-xs text-[#616b71]">Accepted on this board. Nothing was sent.</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

function FileRail({ slices }: { slices: Slice[] }) {
  const kinds: Array<{ kind: FileKind; hint: string }> = [
    { kind: "pos", hint: "Net sales for the day." },
    { kind: "labor", hint: "Hours or labor dollars." },
    { kind: "invoice", hint: "Purchases, not a count." },
    { kind: "statement", hint: "Fees, not the payout." },
  ];
  return (
    <div className="grid gap-3">
      <p className="n86-eyebrow text-[#5a6a75]">Files in this drop</p>
      {kinds.map((item) => {
        const found = slices.filter((slice) => slice.kind === item.kind);
        return (
          <article key={item.kind} className="rounded-[10px] border border-[#dbe1e5] bg-white p-3">
            <p className="text-sm font-semibold">{KIND_LABEL[item.kind]}</p>
            <p className="mt-1 text-xs leading-5 text-[#5a6a75]">{found.length ? `${found.length} file${found.length === 1 ? "" : "s"} sorted` : item.hint}</p>
            <a href="#drop" className="n86-link mt-2 inline-flex min-h-9 items-center text-xs">
              Add my reports →
            </a>
          </article>
        );
      })}
    </div>
  );
}
