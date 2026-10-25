"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
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

function chipClass(label: EvidenceLabel) {
  if (label === "Verified") return "bg-[#12382c] text-[#b7f0d2]";
  if (label === "Estimated") return "bg-[#3a2e10] text-[#f3d48a]";
  return "bg-[#24302c] text-[#d5ddd8]";
}

function Chip({ label }: { label: EvidenceLabel }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${chipClass(label)}`}>{label}</span>;
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

  return (
    <div className="min-h-screen bg-[#0c1412] text-[#f4f1ea]">
      <a href="#today" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-[#f0c94a] focus:px-3 focus:py-2 focus:text-[#1a1404]">
        Skip to how today went
      </a>
      <SiteHeader tone="board" />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
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
            scopes={board.scopes}
            focus={focus}
            targets={targets}
            paste={paste}
            pasteName={pasteName}
            onFocus={setFocus}
            onFiles={addFiles}
            onPaste={setPaste}
            onPasteName={setPasteName}
            onAddPaste={addPaste}
            onSlice={updateSlice}
            onTarget={(category, value) => setTargets((current) => ({ ...current, [category]: value }))}
            onSample={loadSample}
          />
        ) : null}
      </main>
    </div>
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
    <section className="mx-auto grid w-full max-w-xl gap-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f0c94a]">Never86.ai</p>
      <h1 className="text-4xl font-semibold tracking-tight">Name the units. Then drop the week.</h1>
      <p className="text-base leading-7 text-[#d5ddd8]">
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
            className="min-h-12 rounded-xl border border-[#2a3b34] bg-[#13201c] px-3 text-base font-normal"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Who owns the next move
          <input
            value={props.owner}
            onChange={(event) => props.onOwner(event.target.value)}
            placeholder="Owner"
            className="min-h-12 rounded-xl border border-[#2a3b34] bg-[#13201c] px-3 text-base font-normal"
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
                  className="min-h-12 rounded-xl border border-[#2a3b34] bg-[#13201c] px-3 text-base"
                />
              </label>
              {props.units.length > 1 ? (
                <button
                  type="button"
                  className="min-h-12 rounded-xl border border-[#2a3b34] px-3 text-sm"
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
            className="min-h-12 rounded-xl border border-dashed border-[#3d5349] text-sm disabled:opacity-40"
            onClick={() => props.onUnits([...props.units, newUnit(props.units.length + 1)])}
          >
            {props.units.length >= 9 ? "9 units is the stretch" : "Add a unit"}
          </button>
        </fieldset>
        <button type="submit" disabled={!props.ready} className="min-h-12 rounded-full bg-[#f0c94a] font-semibold text-[#1a1404] disabled:opacity-40">
          Open the board
        </button>
      </form>
      <button type="button" onClick={props.onSample} className="text-left text-sm text-[#f0c94a] underline-offset-4 hover:underline">
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
  scopes: ScopeView[];
  focus: string;
  targets: Record<Category, string>;
  paste: string;
  pasteName: string;
  onFocus: (id: string) => void;
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f0c94a]">{props.groupName}</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">Yesterday, across the units.</h1>
        <p className="max-w-2xl text-[#d5ddd8]">
          Drop the close, the invoices, payroll, and the delivery statements. The board sorts them, then keeps at most three moves.
        </p>
        {props.sampleOn ? (
          <p className="rounded-2xl border border-[#f0c94a]/40 bg-[#f0c94a]/10 p-4 text-sm leading-6">
            Sample data. Fictional restaurants. These numbers are not your close. Labor and food targets are filled in so you can see an over and an under. Clear a target to get the prompt.
          </p>
        ) : (
          <button type="button" onClick={props.onSample} className="w-fit text-sm text-[#f0c94a] underline-offset-4 hover:underline">
            Load fictional sample data
          </button>
        )}
      </section>

      <DropZone busy={props.busy} onFiles={props.onFiles} />

      <form
        className="grid gap-3 rounded-2xl border border-[#24332d] bg-[#13201c] p-4"
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
            className="rounded-xl border border-[#2a3b34] bg-[#0c1412] p-3 font-mono text-sm font-normal"
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="grid flex-1 gap-1 text-sm font-semibold">
            Name this paste
            <input
              value={props.pasteName}
              onChange={(event) => props.onPasteName(event.target.value)}
              className="min-h-12 rounded-xl border border-[#2a3b34] bg-[#0c1412] px-3 font-normal"
            />
          </label>
          <button type="submit" className="min-h-12 rounded-full bg-[#f4f1ea] px-5 font-semibold text-[#0c1412] sm:self-end">
            Add rows
          </button>
        </div>
      </form>

      <section className="grid gap-3" aria-labelledby="sort-heading">
        <h2 id="sort-heading" className="text-2xl font-semibold">
          Sorting summary
        </h2>
        <p className="text-sm text-[#d5ddd8]">Each file lands in a type and a unit. Change either one if the sort is wrong. The tally updates with the correction.</p>
        {props.slices.length === 0 ? (
          <p className="text-sm text-[#d5ddd8]">Awaiting files.</p>
        ) : (
          <ul className="grid gap-3">
            {props.slices.map((slice) => (
              <li key={slice.id} className="grid gap-3 rounded-2xl border border-[#24332d] bg-[#13201c] p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div>
                  <p className="font-semibold">{slice.fileName}</p>
                  <p className="mt-1 text-sm text-[#d5ddd8]">{slice.detail}</p>
                </div>
                <label className="grid gap-1 text-sm font-semibold">
                  Type
                  <select
                    value={slice.kind}
                    onChange={(event) => props.onSlice(slice.id, { kind: event.target.value as FileKind })}
                    className="min-h-12 rounded-xl border border-[#2a3b34] bg-[#0c1412] px-2 font-normal"
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
                    className="min-h-12 rounded-xl border border-[#2a3b34] bg-[#0c1412] px-2 font-normal"
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

      <div role="radiogroup" aria-label="Unit" className="flex gap-2 overflow-x-auto pb-1">
        {props.scopes.map((item) => {
          const selected = item.id === props.scope.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => props.onFocus(item.id)}
              className={`min-h-12 shrink-0 rounded-full px-4 text-sm font-semibold ${selected ? "bg-[#f0c94a] text-[#1a1404]" : "border border-[#3d5349] text-[#f4f1ea]"}`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <section id="today" aria-live="polite" className="grid gap-4">
        <div className="rounded-3xl border border-[#f0c94a]/50 bg-[#18241f] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f0c94a]">{kicker}</p>
          <h2 className="mt-2 text-2xl font-semibold">{props.scope.name}</h2>
          {props.scope.strip.length === 0 ? (
            <p className="mt-3 text-[#d5ddd8]">Awaiting a day with sales and spend.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {props.scope.strip.map((line) => (
                <li key={`${line.category}-${line.text}`} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="max-w-3xl text-base leading-7">{line.text}</p>
                  <Chip label={line.label} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Week tally</h2>
          <p className="text-sm text-[#d5ddd8]">{props.boardWeek ? `Week of ${formatDay(props.boardWeek)}` : "No dated rows yet"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {props.scope.tiles.map((tile) => (
            <TileCard key={tile.category} tile={tile} target={props.targets[tile.category]} onTarget={props.onTarget} />
          ))}
        </div>
        {props.notes.map((note) => (
          <p key={note} className="text-sm text-[#d5ddd8]">
            {note}
          </p>
        ))}
      </section>

      <section className="grid gap-3" aria-labelledby="daily-heading">
        <h2 id="daily-heading" className="text-2xl font-semibold">
          Daily numbers
        </h2>
        {props.scope.days.length === 0 ? (
          <p className="text-sm text-[#d5ddd8]">No dates on the files yet.</p>
        ) : (
          <ul className="grid gap-3">
            {props.scope.days.map((day) => (
              <li key={day.date} className="rounded-2xl border border-[#24332d] bg-[#13201c] p-4">
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

      <section className="grid gap-3 rounded-3xl border border-[#24332d] bg-[#13201c] p-5" aria-labelledby="prime-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="prime-heading" className="text-2xl font-semibold">
            Weekly prime cost
          </h2>
          <Chip label={props.scope.prime.dollars.label} />
          <span className="rounded-full border border-[#3d5349] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em]">
            {props.scope.prime.weekStatus === "closed" ? "Closed week" : "Open week"}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d5ddd8]">Dollars</p>
            <p className="mt-1 font-mono text-4xl">{showMoney(props.scope.prime.dollars)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d5ddd8]">Of sales</p>
            <p className="mt-1 font-mono text-4xl">{showPercent(props.scope.prime.percent)}</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-[#d5ddd8]">{props.scope.prime.note}</p>
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
      className="relative rounded-3xl border border-dashed border-[#f0c94a] bg-[#13201c] p-6"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files);
      }}
    >
      <input
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
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f0c94a]">One drop</p>
      <p className="mt-2 text-2xl font-semibold">{busy ? "Reading files..." : "Drop yesterday's close"}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#d5ddd8]">
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
    <article className="flex flex-col gap-3 rounded-2xl border border-[#24332d] bg-[#13201c] p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{tile.title}</h3>
        <Chip label={tile.spend.label} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d5ddd8]">Week dollars</p>
          <p className="mt-1 font-mono text-3xl">{showMoney(tile.spend)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d5ddd8]">Of sales</p>
          <p className="mt-1 font-mono text-3xl">{showPercent(tile.percent)}</p>
        </div>
      </div>
      {tile.spend.label === "Missing" ? null : <p className="text-sm leading-6 text-[#d5ddd8]">{tile.sourceNote}</p>}
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
          className="min-h-12 rounded-xl border border-[#2a3b34] bg-[#0c1412] px-3 font-normal"
        />
      </label>
    </article>
  );
}

function DailyFact({ label, figure, kind }: { label: string; figure: Figure; kind: "money" | "percent" }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d5ddd8]">{label}</dt>
      <dd className="mt-1 font-mono text-xl">{kind === "money" ? showMoney(figure) : showPercent(figure)}</dd>
      <dd className="mt-1">
        <Chip label={figure.label} />
      </dd>
      {figure.missing ? <dd className="mt-1 text-xs leading-5 text-[#d5ddd8]">{figure.missing}</dd> : null}
    </div>
  );
}

function ActionList({ actions }: { actions: Move[] }) {
  if (!actions.length) {
    return <p className="text-sm text-[#d5ddd8]">Nothing to move on yet. Add a file, or set a target if you want an over or under.</p>;
  }
  return (
    <ol className="grid gap-3">
      {actions.slice(0, 3).map((action, index) => (
        <li key={action.id} className="rounded-2xl border border-[#24332d] bg-[#13201c] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f0c94a]">Next action {index + 1}</p>
          <h3 className="mt-2 text-xl font-semibold">{action.title}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Chip label={action.label} />
            <p className="font-mono text-3xl">{action.amount === null || action.label === "Missing" ? "Missing" : money(action.amount)}</p>
          </div>
          <p className="mt-3 text-sm">Owner: {action.owner}</p>
          <p className="text-sm">Due: {formatDay(action.due)}</p>
          <p className="mt-2 text-sm leading-6">Expected outcome: {action.outcome}</p>
          <p className="mt-2 text-sm text-[#d5ddd8]">Source: {action.source}</p>
        </li>
      ))}
    </ol>
  );
}
