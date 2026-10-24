import { categoryForLine, slicesFromTable, type Slice, type UnitRef } from "./classify";
import { calloutFor, type Callout, shortStrip } from "./copy";
import {
  addDays,
  CATEGORIES,
  CATEGORY_TITLE,
  type Category,
  type EvidenceLabel,
  type Figure,
  formatDay,
  knownFigure,
  missingFigure,
  numberValue,
  parseDate,
  type FileKind,
  weekStartMonday,
  weakest,
  wholeDollars,
} from "./money";
import { parseTable, readGrid } from "./table";

export interface Move {
  id: string;
  title: string;
  owner: string;
  due: string;
  outcome: string;
  label: EvidenceLabel;
  amount: number | null;
  unitName: string;
  source: string;
  score: number;
  miss: boolean;
}

export interface Tile {
  category: Category;
  title: string;
  spend: Figure;
  percent: Figure;
  targetPct: number | null;
  note: string;
  noteLabel: EvidenceLabel;
  sourceNote: string;
}

export interface DailyRow {
  date: string;
  sales: Figure;
  laborPct: Figure;
  foodCost: Figure;
  comps: Figure;
  voids: Figure;
}

export interface PrimeView {
  dollars: Figure;
  percent: Figure;
  cogs: Figure;
  labor: Figure;
  sales: Figure;
  weekStatus: "open" | "closed" | "missing";
  note: string;
}

export interface ScopeView {
  id: string;
  name: string;
  strip: Array<Callout & { text: string }>;
  tiles: Tile[];
  days: DailyRow[];
  prime: PrimeView;
  actions: Move[];
}

export interface SortRow {
  id: string;
  fileName: string;
  kind: FileKind;
  unitId: string | null;
  readable: boolean;
  detail: string;
}

export interface Board {
  weekStart: string | null;
  latestDay: string | null;
  dayWord: string;
  sorts: SortRow[];
  scopes: ScopeView[];
  notes: string[];
}

interface MoneyFact {
  unitId: string;
  date: string | null;
  amount: number | null;
  label: EvidenceLabel;
  note: string;
  source: string;
}

interface SpendFact extends MoneyFact {
  category: Category;
}

interface CountState {
  begin: number;
  end: number;
  label: EvidenceLabel;
  broken: boolean;
  note: string;
  source: string;
}

interface Draft {
  unitId: string;
  title: string;
  outcome: string;
  label: EvidenceLabel;
  amount: number | null;
  source: string;
  score: number;
}

const SALES_HINT = "Add a POS close with net sales.";
const COUNT_HINT = "Add an inventory count with a beginning and an ending. Invoices stay purchases.";
const CATEGORY_FILE: Record<Category, string> = {
  food: "Add food invoices, or an inventory count with a beginning and an ending.",
  beverage: "Add beverage invoices.",
  paper: "Add paper and packaging invoices.",
  labor: "Add a payroll file with labor dollars, or hours and a wage.",
  delivery: "Add a DoorDash, Uber Eats, or Grubhub statement with commission, marketing, and error charges.",
  other: "Add the invoices that are not food, beverage, or paper.",
};

const FILE_KIND: Record<Category, FileKind> = {
  food: "invoice",
  beverage: "invoice",
  paper: "invoice",
  labor: "labor",
  delivery: "statement",
  other: "invoice",
};

function roleName(value: string | undefined): string {
  const role = value?.trim();
  return role || "that role";
}

function downgrade(label: EvidenceLabel, estimated: boolean): EvidenceLabel {
  if (label === "Missing") return "Missing";
  if (estimated) return "Estimated";
  return label;
}

export function buildBoard(input: {
  units: UnitRef[];
  slices: Slice[];
  targets: Partial<Record<Category, number | null>>;
  owner: string;
  today: string;
}): Board {
  const owner = input.owner.trim() || "Owner";
  const due = addDays(input.today, 2);
  const spendFacts: SpendFact[] = [];
  const salesFacts: MoneyFact[] = [];
  const compsFacts: MoneyFact[] = [];
  const voidFacts: MoneyFact[] = [];
  const cogsFacts: MoneyFact[] = [];
  const counts = new Map<string, CountState>();
  const drafts: Draft[] = [];
  const blocked = new Map<string, string>();
  const saw = new Map<string, Set<string>>();
  const notes: string[] = [];
  let outside = false;

  const mark = (unitId: string, flag: string) => {
    const set = saw.get(unitId) ?? new Set<string>();
    set.add(flag);
    saw.set(unitId, set);
  };
  const seen = (unitId: string, flag: string) => saw.get(unitId)?.has(flag) ?? false;

  for (const slice of input.slices) {
    if (!slice.readable) {
      if (slice.unitId) blocked.set(`${slice.unitId}:${slice.kind}`, slice.detail);
      if (!slice.unitId) {
        drafts.push({
          unitId: input.units[0]?.id ?? "all",
          title: `Choose a unit for ${slice.fileName}.`,
          outcome: "The file stays out of the tally until it has a unit.",
          label: "Missing",
          amount: null,
          source: slice.fileName,
          score: 1,
        });
      }
      continue;
    }
    if (!slice.unitId) {
      drafts.push({
        unitId: input.units[0]?.id ?? "all",
        title: `Choose a unit for ${slice.fileName}.`,
        outcome: "Those rows stay out of the tally until you pick a unit.",
        label: "Missing",
        amount: null,
        source: slice.fileName,
        score: 1,
      });
      continue;
    }
    if (slice.kind === "pos") readPos(slice);
    else if (slice.kind === "labor") readLabor(slice);
    else if (slice.kind === "invoice") readInvoice(slice);
    else if (slice.kind === "menu") readMenu(slice);
    else if (slice.kind === "statement") readStatement(slice);
    else if (slice.kind === "count") readCount(slice);
  }

  const dated = [...salesFacts, ...spendFacts, ...cogsFacts]
    .map((fact) => fact.date)
    .filter((date): date is string => Boolean(date))
    .sort();
  const latestDay = dated.length ? dated[dated.length - 1] : null;
  const weekStart = latestDay ? weekStartMonday(latestDay) : null;
  const weekEnd = weekStart ? addDays(weekStart, 6) : null;
  const dayWord = latestDay && latestDay === input.today ? "today" : latestDay ? `on ${formatDay(latestDay)}` : "today";
  if (outside) notes.push("Dates outside this week stay off the board.");
  if ([...spendFacts, ...salesFacts].some((fact) => fact.date === null && fact.amount !== null)) {
    notes.push("Some rows have no date. Those dollars sit in the week total only.");
  }

  const inWeek = (date: string | null) => {
    if (!date || !weekStart || !weekEnd) return false;
    if (date < weekStart || date > weekEnd) {
      outside = true;
      return false;
    }
    return true;
  };
  // Recompute outside now that the week is known.
  outside = [...salesFacts, ...spendFacts, ...cogsFacts].some((fact) => fact.date && weekStart && weekEnd && (fact.date < weekStart || fact.date > weekEnd));
  if (outside && !notes.includes("Dates outside this week stay off the board.")) {
    notes.push("Dates outside this week stay off the board.");
  }

  const hint = (unitId: string, category: Category) =>
    blocked.get(`${unitId}:${FILE_KIND[category]}`) ??
    (category === "food" ? blocked.get(`${unitId}:count`) ?? CATEGORY_FILE[category] : CATEGORY_FILE[category]);

  const salesHint = (unitId: string) => blocked.get(`${unitId}:pos`) ?? SALES_HINT;

  function factsOn<T extends MoneyFact>(facts: T[], unitId: string, date: string): T[] {
    return facts.filter((fact) => fact.unitId === unitId && fact.date === date);
  }

  function sumFacts(facts: MoneyFact[], missing: string): Figure {
    if (!facts.length) return missingFigure(missing);
    if (facts.some((fact) => fact.amount === null || fact.label === "Missing")) {
      return missingFigure(facts.find((fact) => fact.label === "Missing" || fact.amount === null)?.note || missing);
    }
    const label = weakest(facts.map((fact) => fact.label));
    return {
      label,
      amount: facts.reduce((sum, fact) => sum + (fact.amount ?? 0), 0),
      missing: null,
      note: facts.find((fact) => fact.note)?.note ?? "",
    };
  }

  function salesDates(unitId: string): string[] {
    return Array.from(new Set(salesFacts.filter((fact) => fact.unitId === unitId && inWeek(fact.date)).map((fact) => fact.date as string))).sort();
  }

  function daySales(unitId: string, date: string): Figure {
    return sumFacts(factsOn(salesFacts, unitId, date), salesHint(unitId));
  }

  function daySpend(unitId: string, category: Category, date: string): Figure {
    const purchases = sumFacts(factsOn(spendFacts, unitId, date).filter((fact) => fact.category === category), hint(unitId, category));
    if (category === "food" && purchases.label === "Missing") {
      const stated = sumFacts(factsOn(cogsFacts, unitId, date), COUNT_HINT);
      if (stated.label !== "Missing") return stated;
    }
    if (category === "other" && purchases.label === "Missing" && seen(unitId, "invoice")) {
      return knownFigure(0, "Verified", "No other spend on the invoices.");
    }
    return purchases;
  }

  function weekSales(unitId: string): Figure {
    const dates = salesDates(unitId);
    if (!dates.length) return missingFigure(salesHint(unitId));
    return sumFacts(
      salesFacts.filter((fact) => fact.unitId === unitId && (fact.date === null || inWeek(fact.date))),
      salesHint(unitId)
    );
  }

  function weekSpend(unitId: string, category: Category): { spend: Figure; sourceNote: string } {
    const missing = hint(unitId, category);
    const mine = spendFacts.filter((fact) => fact.unitId === unitId && fact.category === category);
    const datedFacts = mine.filter((fact) => inWeek(fact.date));
    const undated = mine.filter((fact) => fact.date === null);
    if (!mine.length) {
      if (category === "other" && seen(unitId, "invoice")) {
        return { spend: knownFigure(0, "Verified", "No other spend on the invoices."), sourceNote: "No other spend on the invoices." };
      }
      return { spend: missingFigure(missing), sourceNote: missing };
    }
    const combined = sumFacts([...datedFacts, ...undated], missing);
    if (combined.label === "Missing") return { spend: combined, sourceNote: combined.note };
    const gaps = salesDates(unitId).filter((date) => !datedFacts.some((fact) => fact.date === date));
    const estimated = gaps.length > 0 || undated.length > 0 || combined.label === "Estimated";
    const label = downgrade(combined.label, estimated);
    const gapNote = gaps.length ? `Missing ${CATEGORY_TITLE[category]} on ${gaps.map(formatDay).join(", ")}.` : combined.note;
    return {
      spend: { label, amount: combined.amount, missing: null, note: gapNote },
      sourceNote: gapNote,
    };
  }

  function cogsFigure(unitId: string): Figure | null {
    const count = counts.get(unitId);
    const purchases = spendFacts.filter((fact) => fact.unitId === unitId && fact.category === "food" && (fact.date === null || inWeek(fact.date)));
    if (count) {
      if (count.broken || purchases.some((fact) => fact.amount === null || fact.label === "Missing") || !purchases.length) {
        return null;
      }
      const purchase = sumFacts(purchases, COUNT_HINT);
      if (purchase.amount === null || purchase.label === "Missing") return null;
      const label = weakest([count.label, purchase.label]);
      return {
        label,
        amount: count.begin + purchase.amount - count.end,
        missing: null,
        note: "COGS from the count and food purchases.",
      };
    }
    const stated = cogsFacts.filter((fact) => fact.unitId === unitId && inWeek(fact.date));
    const dates = salesDates(unitId);
    if (!stated.length || !dates.length) return null;
    if (!dates.every((date) => stated.some((fact) => fact.date === date && fact.amount !== null))) return null;
    return sumFacts(stated, COUNT_HINT);
  }

  function foodTileSpend(unitId: string): { spend: Figure; sourceNote: string } {
    const cogs = cogsFigure(unitId);
    if (cogs && cogs.label !== "Missing" && cogs.amount !== null) {
      const open = salesDates(unitId).length < 7;
      return {
        spend: { ...cogs, label: downgrade(cogs.label, open) },
        sourceNote: cogs.note,
      };
    }
    const purchases = weekSpend(unitId, "food");
    if (purchases.spend.label === "Missing") return purchases;
    return {
      spend: purchases.spend,
      sourceNote: "Food purchases from invoices. COGS needs a count.",
    };
  }

  function categoryPercent(unitId: string, category: Category, spend: Figure, cogs: boolean): Figure {
    const sales = weekSales(unitId);
    if (cogs || category === "other") return percentOf(spend, sales);
    const dates = salesDates(unitId).filter((date) => {
      const day = daySpend(unitId, category, date);
      return day.label !== "Missing" && day.amount !== null;
    });
    if (!dates.length) return percentOf(spend, sales);
    const spendSum = dates.reduce((sum, date) => sum + (daySpend(unitId, category, date).amount ?? 0), 0);
    const salesSum = dates.reduce((sum, date) => sum + (daySales(unitId, date).amount ?? 0), 0);
    const partial = dates.length !== salesDates(unitId).length;
    return percentOf(
      { ...spend, amount: spendSum, label: downgrade(spend.label, partial) },
      { label: sales.label, amount: salesSum, missing: sales.missing, note: sales.note }
    );
  }

  function percentOf(spend: Figure, sales: Figure): Figure {
    if (spend.label === "Missing" || spend.amount === null) return missingFigure(spend.missing ?? "Spend is Missing.");
    if (sales.label === "Missing" || sales.amount === null) return missingFigure(sales.missing ?? SALES_HINT);
    if (wholeDollars(sales.amount) === 0) return missingFigure("Sales are 0, so a percent is not shown.");
    return {
      label: weakest([spend.label, sales.label]),
      amount: (wholeDollars(spend.amount) / wholeDollars(sales.amount)) * 100,
      missing: null,
      note: "Spend divided by sales.",
    };
  }

  function dayFoodCost(unitId: string, date: string): Figure {
    const stated = sumFacts(factsOn(cogsFacts, unitId, date), COUNT_HINT);
    if (stated.label !== "Missing") return stated;
    return missingFigure("Add an inventory count. Food purchases stay on the tally, and they are not food cost.");
  }

  function laborPct(labor: Figure, sales: Figure): Figure {
    if (labor.label === "Missing" || labor.amount === null) return missingFigure(labor.missing ?? CATEGORY_FILE.labor);
    if (sales.label === "Missing" || sales.amount === null) return missingFigure(sales.missing ?? SALES_HINT);
    if (wholeDollars(sales.amount) === 0) return missingFigure("Sales are 0, so a percent is not shown.");
    return {
      label: weakest([labor.label, sales.label]),
      amount: (wholeDollars(labor.amount) / wholeDollars(sales.amount)) * 100,
      missing: null,
      note: "Labor dollars divided by sales.",
    };
  }

  function optionalColumn(unitId: string, facts: MoneyFact[], date: string, flag: string, missing: string): Figure {
    if (!seen(unitId, flag)) return missingFigure(seen(unitId, "pos") ? missing : salesHint(unitId));
    return sumFacts(factsOn(facts, unitId, date), missing);
  }

  const covered = Array.from(new Set(dated.filter((date) => inWeek(date)))).sort();

  function unitCallouts(unitId: string): Callout[] {
    return CATEGORIES.map((category) =>
      calloutFor({
        category,
        dayWord,
        spend: latestDay ? daySpend(unitId, category, latestDay) : missingFigure(hint(unitId, category)),
        sales: latestDay ? daySales(unitId, latestDay) : missingFigure(salesHint(unitId)),
        targetPct: input.targets[category] ?? null,
      })
    );
  }

  function unitDays(unitId: string): DailyRow[] {
    const dates = covered.filter((date) => salesDates(unitId).includes(date) || spendFacts.some((fact) => fact.unitId === unitId && fact.date === date));
    return dates.map((date) => ({
      date,
      sales: daySales(unitId, date),
      laborPct: laborPct(daySpend(unitId, "labor", date), daySales(unitId, date)),
      foodCost: dayFoodCost(unitId, date),
      comps: optionalColumn(unitId, compsFacts, date, "comps", "No comps column on the POS close."),
      voids: optionalColumn(unitId, voidFacts, date, "voids", "No voids column on the POS close."),
    }));
  }

  function unitPrime(unitId: string, sales: Figure, labor: Figure): PrimeView {
    const cogs = cogsFigure(unitId) ?? missingFigure(blocked.get(`${unitId}:count`) ?? COUNT_HINT);
    const days = salesDates(unitId).length;
    const weekStatus: PrimeView["weekStatus"] = days === 0 ? "missing" : days < 7 ? "open" : "closed";
    if (cogs.label === "Missing" || cogs.amount === null || labor.label === "Missing" || labor.amount === null || sales.label === "Missing" || sales.amount === null) {
      const reason = cogs.label === "Missing" ? cogs.missing ?? COUNT_HINT : labor.label === "Missing" ? labor.missing ?? CATEGORY_FILE.labor : sales.missing ?? SALES_HINT;
      return {
        dollars: missingFigure(reason),
        percent: missingFigure(reason),
        cogs,
        labor,
        sales,
        weekStatus: weekStatus === "closed" ? "open" : weekStatus,
        note: `${reason} The week stays open.`,
      };
    }
    const open = weekStatus !== "closed";
    const primeLabel = downgrade(weakest([cogs.label, labor.label]), open);
    const dollars = knownFigure(
      cogs.amount + labor.amount,
      primeLabel === "Missing" ? "Estimated" : primeLabel,
      "COGS plus labor."
    );
    return {
      dollars,
      percent: { ...percentOf(dollars, sales), label: downgrade(percentOf(dollars, sales).label, open) },
      cogs,
      labor,
      sales,
      weekStatus,
      note: open ? `Open week. ${days} dates are on the files. This is not a finished close.` : "COGS plus labor, divided by sales.",
    };
  }

  function rollup(parts: Array<{ name: string; figure: Figure }>, noun: string): Figure {
    const missing = parts.filter((part) => part.figure.label === "Missing" || part.figure.amount === null);
    if (!parts.length || missing.length) {
      const who = missing.map((part) => part.name).join(", ") || "A unit";
      return missingFigure(`${who} needs ${noun}. All units stays open until it lands.`);
    }
    const label = weakest(parts.map((part) => part.figure.label));
    return knownFigure(
      parts.reduce((sum, part) => sum + (part.figure.amount ?? 0), 0),
      label === "Missing" ? "Estimated" : label,
      "Sum of the units."
    );
  }

  function movesFor(unitIds: string[], callouts: Array<{ unitName: string; callout: Callout }>): Move[] {
    const moves: Move[] = [];
    for (const item of callouts) {
      if (!item.callout.miss) continue;
      moves.push({
        id: `miss-${item.unitName}-${item.callout.category}`,
        title: `${item.unitName}: ${item.callout.text}`,
        owner,
        due,
        outcome:
          (item.callout.variance ?? 0) < 0
            ? "Keep what got you under the target. The dollar is the gap versus that percent of the day's sales."
            : "Check it before the next shift or the next order. The dollar is the gap versus the target percent of the day's sales.",
        label: item.callout.label,
        amount: item.callout.variance === null ? null : Math.abs(item.callout.variance),
        unitName: item.unitName,
        source: "How today went",
        score: item.callout.absVariance,
        miss: true,
      });
    }
    for (const draft of drafts) {
      if (!unitIds.includes(draft.unitId)) continue;
      const unitName = input.units.find((unit) => unit.id === draft.unitId)?.name ?? "Unit";
      moves.push({
        id: `check-${moves.length}-${draft.source}`,
        title: draft.title,
        owner,
        due,
        outcome: draft.outcome,
        label: draft.label,
        amount: draft.amount,
        unitName,
        source: draft.source,
        score: draft.score,
        miss: false,
      });
    }
    moves.sort((left, right) => {
      if (left.miss !== right.miss) return left.miss ? -1 : 1;
      return right.score - left.score;
    });
    return moves.slice(0, 3);
  }

  const unitViews = input.units.map((unit) => {
    const callouts = unitCallouts(unit.id);
    const sales = weekSales(unit.id);
    const labor = weekSpend(unit.id, "labor").spend;
    const food = foodTileSpend(unit.id);
    const tiles: Tile[] = CATEGORIES.map((category) => {
      const packed = category === "food" ? food : weekSpend(unit.id, category);
      const spend = packed.spend;
      const percent = categoryPercent(unit.id, category, spend, packed.sourceNote.startsWith("COGS"));
      const noteCallout = callouts.find((item) => item.category === category);
      return {
        category,
        title: CATEGORY_TITLE[category],
        spend,
        percent,
        targetPct: input.targets[category] ?? null,
        note: noteCallout?.text ?? "",
        noteLabel: noteCallout?.label ?? "Missing",
        sourceNote: packed.sourceNote,
      };
    });
    return {
      unit,
      callouts,
      tiles,
      days: unitDays(unit.id),
      prime: unitPrime(unit.id, sales, labor),
      sales,
      labor,
    };
  });

  const scopes: ScopeView[] = unitViews.map((view) => ({
    id: view.unit.id,
    name: view.unit.name,
    strip: shortStrip(view.callouts),
    tiles: view.tiles,
    days: view.days,
    prime: view.prime,
    actions: movesFor(
      [view.unit.id],
      view.callouts.map((callout) => ({ unitName: view.unit.name, callout }))
    ),
  }));

  const allTiles: Tile[] = CATEGORIES.map((category) => {
    const spend = rollup(
      unitViews.map((view) => ({
        name: view.unit.name,
        figure: view.tiles.find((tile) => tile.category === category)?.spend ?? missingFigure(hint(view.unit.id, category)),
      })),
      "this file"
    );
    const sales = rollup(
      unitViews.map((view) => ({ name: view.unit.name, figure: view.sales })),
      "a POS close with net sales"
    );
    const daySpendRoll = latestDay
      ? rollup(
          unitViews.map((view) => ({ name: view.unit.name, figure: daySpend(view.unit.id, category, latestDay) })),
          "this file"
        )
      : missingFigure("Add a POS close with net sales.");
    const daySalesRoll = latestDay
      ? rollup(
          unitViews.map((view) => ({ name: view.unit.name, figure: daySales(view.unit.id, latestDay) })),
          "a POS close with net sales"
        )
      : missingFigure(SALES_HINT);
    const noteCallout = calloutFor({
      category,
      dayWord,
      spend: daySpendRoll,
      sales: daySalesRoll,
      targetPct: input.targets[category] ?? null,
    });
    return {
      category,
      title: CATEGORY_TITLE[category],
      spend,
      percent: percentOf(spend, sales),
      targetPct: input.targets[category] ?? null,
      note: noteCallout.text,
      noteLabel: noteCallout.label,
      sourceNote: spend.note,
    };
  });

  const allCallouts = allTiles.map((tile) =>
    calloutFor({
      category: tile.category,
      dayWord,
      spend: latestDay
        ? rollup(
            unitViews.map((view) => ({ name: view.unit.name, figure: daySpend(view.unit.id, tile.category, latestDay) })),
            "this file"
          )
        : missingFigure(CATEGORY_FILE[tile.category]),
      sales: latestDay
        ? rollup(
            unitViews.map((view) => ({ name: view.unit.name, figure: daySales(view.unit.id, latestDay) })),
            "a POS close with net sales"
          )
        : missingFigure(SALES_HINT),
      targetPct: input.targets[tile.category] ?? null,
    })
  );

  const unitMisses = unitViews.flatMap((view) =>
    view.callouts
      .filter((callout) => callout.miss)
      .map((callout) => ({ ...callout, text: `${view.unit.name}: ${callout.text}` }))
  );
  const allStrip = shortStrip([...unitMisses, ...allCallouts.filter((callout) => !callout.miss)]);
  const allDays: DailyRow[] = covered.map((date) => {
    const sales = rollup(
      unitViews.map((view) => ({ name: view.unit.name, figure: daySales(view.unit.id, date) })),
      "a POS close with net sales"
    );
    const labor = rollup(
      unitViews.map((view) => ({ name: view.unit.name, figure: daySpend(view.unit.id, "labor", date) })),
      "a payroll file"
    );
    const food = rollup(
      unitViews.map((view) => ({ name: view.unit.name, figure: dayFoodCost(view.unit.id, date) })),
      "an inventory count"
    );
    const comps = rollup(
      unitViews.map((view) => ({ name: view.unit.name, figure: optionalColumn(view.unit.id, compsFacts, date, "comps", "a comps column") })),
      "a comps column"
    );
    const voids = rollup(
      unitViews.map((view) => ({ name: view.unit.name, figure: optionalColumn(view.unit.id, voidFacts, date, "voids", "a voids column") })),
      "a voids column"
    );
    return { date, sales, laborPct: laborPct(labor, sales), foodCost: food, comps, voids };
  });
  const allSales = rollup(
    unitViews.map((view) => ({ name: view.unit.name, figure: view.sales })),
    "a POS close with net sales"
  );
  const allLabor = rollup(
    unitViews.map((view) => ({ name: view.unit.name, figure: view.labor })),
    "a payroll file"
  );
  const allCogs = rollup(
    unitViews.map((view) => ({ name: view.unit.name, figure: view.prime.cogs })),
    "an inventory count"
  );
  const allPrime = unitPrimeFromParts(allSales, allLabor, allCogs, covered.length);

  const allScope: ScopeView = {
    id: "all",
    name: "All units",
    strip: allStrip,
    tiles: allTiles,
    days: allDays,
    prime: allPrime,
    actions: movesFor(
      input.units.map((unit) => unit.id),
      unitViews.flatMap((view) => view.callouts.map((callout) => ({ unitName: view.unit.name, callout })))
    ),
  };

  return {
    weekStart,
    latestDay,
    dayWord,
    sorts: input.slices.map((slice) => ({
      id: slice.id,
      fileName: slice.fileName,
      kind: slice.kind,
      unitId: slice.unitId,
      readable: slice.readable,
      detail: slice.detail,
    })),
    scopes: [allScope, ...scopes],
    notes,
  };

  function readPos(slice: Slice) {
    const unitId = slice.unitId as string;
    const grid = readGrid(slice.rows);
    mark(unitId, "pos");
    if (grid.has("comps")) mark(unitId, "comps");
    if (grid.has("voids")) mark(unitId, "voids");
    for (const row of grid.body) {
      const date = parseDate(grid.cell(row, "date"));
      const source = slice.fileName;
      if (grid.has("net")) {
        const amount = numberValue(grid.cell(row, "net"));
        salesFacts.push({
          unitId,
          date,
          amount,
          label: amount === null ? "Missing" : "Verified",
          note: amount === null ? "A blank sales cell is not $0." : "Net sales on the file.",
          source,
        });
      } else if (grid.has("gross")) {
        const amount = numberValue(grid.cell(row, "gross"));
        salesFacts.push({
          unitId,
          date,
          amount,
          label: amount === null ? "Missing" : "Estimated",
          note: amount === null ? "A blank sales cell is not $0." : "Gross sales are on the file. Net sales were not a column.",
          source,
        });
      }
      pushColumn(compsFacts, grid, row, "comps", unitId, date, source, "Comps on the file.");
      pushColumn(voidFacts, grid, row, "voids", unitId, date, source, "Voids on the file.");
      if (grid.has("foodCost")) {
        const amount = numberValue(grid.cell(row, "foodCost"));
        cogsFacts.push({
          unitId,
          date,
          amount,
          label: amount === null ? "Missing" : "Verified",
          note: amount === null ? "A blank food cost cell is not $0." : "Food cost column on the POS file.",
          source,
        });
      }
    }
  }

  function readLabor(slice: Slice) {
    const unitId = slice.unitId as string;
    const grid = readGrid(slice.rows);
    mark(unitId, "labor");
    for (const row of grid.body) {
      const date = parseDate(grid.cell(row, "date"));
      const who = roleName(grid.cell(row, "role"));
      const clock = grid.has("clock") ? numberValue(grid.cell(row, "clock")) : null;
      const scheduled = grid.has("scheduled") ? numberValue(grid.cell(row, "scheduled")) : null;
      const wage = grid.has("wage") ? numberValue(grid.cell(row, "wage")) : null;
      if (grid.has("labor")) {
        const amount = numberValue(grid.cell(row, "labor"));
        spendFacts.push({
          unitId,
          date,
          category: "labor",
          amount,
          label: amount === null ? "Missing" : "Verified",
          note: amount === null ? "A blank labor dollar is not $0." : "Labor dollars on the file.",
          source: slice.fileName,
        });
      } else if (clock !== null && wage !== null) {
        spendFacts.push({
          unitId,
          date,
          category: "labor",
          amount: clock * wage,
          label: "Estimated",
          note: "Hours times the wage on the file.",
          source: slice.fileName,
        });
      } else if (grid.has("clock") || grid.has("wage")) {
        spendFacts.push({
          unitId,
          date,
          category: "labor",
          amount: null,
          label: "Missing",
          note: "Wage is Missing, so the labor dollar stays Missing.",
          source: slice.fileName,
        });
      }
      if (scheduled !== null && clock !== null && scheduled !== clock) {
        const gap = clock - scheduled;
        const direction = gap > 0 ? "over" : "under";
        if (wage === null) {
          drafts.push({
            unitId,
            title: `Ask what kept ${who} ${direction} the plan.`,
            outcome: `${Math.abs(gap)} hours ${direction} the schedule. Wage is Missing, so no dollar is shown.`,
            label: "Verified",
            amount: null,
            source: slice.fileName,
            score: Math.abs(gap),
          });
        } else {
          const cost = gap * wage;
          drafts.push({
            unitId,
            title: `Ask what kept ${who} ${direction} the plan.`,
            outcome: "Hours on the file times the wage on the file. The wage is the rate on the row.",
            label: "Estimated",
            amount: Math.abs(cost),
            source: slice.fileName,
            score: Math.abs(cost),
          });
        }
      }
    }
  }

  function readInvoice(slice: Slice) {
    const unitId = slice.unitId as string;
    const grid = readGrid(slice.rows);
    mark(unitId, "invoice");
    let blankPrice = false;
    for (const row of grid.body) {
      const date = parseDate(grid.cell(row, "date"));
      const item = grid.cell(row, "item")?.trim() || "that item";
      const bucket = categoryForInvoice(grid.cell(row, "category"), grid.cell(row, "item"));
      const priced = lineAmount(grid, row);
      let label: EvidenceLabel = priced.label;
      if (label === "Verified" && bucket.label === "Estimated") label = "Estimated";
      spendFacts.push({
        unitId,
        date,
        category: bucket.category,
        amount: priced.amount,
        label,
        note: `${priced.note} ${bucket.note}`.trim(),
        source: slice.fileName,
      });
      if (grid.has("previous") && grid.has("price")) {
        const current = numberValue(grid.cell(row, "price"));
        const previous = numberValue(grid.cell(row, "previous"));
        if (current === null || previous === null) blankPrice = true;
        else if (current !== previous) {
          const delta = current - previous;
          const weekly = grid.has("weekly") ? numberValue(grid.cell(row, "weekly")) : null;
          const direction = delta > 0 ? "up" : "down";
          if (weekly === null) {
            drafts.push({
              unitId,
              title: `Check the ${item} price with the vendor before the next order.`,
              outcome: `The same pack moved ${direction} by ${Math.abs(delta).toFixed(2)} on the file. Weekly quantity is Missing, so this is the pack change only.`,
              label: "Verified",
              amount: Math.abs(delta),
              source: slice.fileName,
              score: Math.abs(delta),
            });
          } else {
            drafts.push({
              unitId,
              title: `Check the ${item} price with the vendor before the next order.`,
              outcome: "Weekly quantity on the file times the pack change.",
              label: "Estimated",
              amount: Math.abs(delta * weekly),
              source: slice.fileName,
              score: Math.abs(delta * weekly),
            });
          }
        }
      }
    }
    if (blankPrice) {
      drafts.push({
        unitId,
        title: `Add the blank prices on ${slice.fileName}.`,
        outcome: "A blank price is not $0.",
        label: "Missing",
        amount: null,
        source: slice.fileName,
        score: 1,
      });
    }
  }

  function readMenu(slice: Slice) {
    const unitId = slice.unitId as string;
    const grid = readGrid(slice.rows);
    const plates = new Map<string, Array<{ name: string; qty: number | null; cost: number | null }>>();
    for (const row of grid.body) {
      const plate = grid.cell(row, "plate")?.trim() || grid.cell(row, "item")?.trim();
      if (!plate) continue;
      const list = plates.get(plate) ?? [];
      list.push({
        name: grid.cell(row, "ingredient")?.trim() || "an ingredient",
        qty: numberValue(grid.cell(row, "qty")),
        cost: numberValue(grid.cell(row, "unitCost")),
      });
      plates.set(plate, list);
    }
    plates.forEach((lines, plate) => {
      const missing = lines.filter((line) => line.qty === null || line.cost === null);
      if (missing.length || !lines.length) {
        drafts.push({
          unitId,
          title: `Add the ${missing[0]?.name ?? "ingredient"} price for ${plate}.`,
          outcome: "Plate cost stays Missing. A blank ingredient is not $0.",
          label: "Missing",
          amount: null,
          source: slice.fileName,
          score: 1,
        });
        return;
      }
      const cost = lines.reduce((sum, line) => sum + (line.qty ?? 0) * (line.cost ?? 0), 0);
      drafts.push({
        unitId,
        title: `Use the ${plate} plate cost before you change the menu price.`,
        outcome: "Sum of quantity times unit cost on the file.",
        label: "Verified",
        amount: cost,
        source: slice.fileName,
        score: cost,
      });
    });
  }

  function readStatement(slice: Slice) {
    const unitId = slice.unitId as string;
    const grid = readGrid(slice.rows);
    mark(unitId, "statement");
    const fields = ["commission", "marketing", "errors"] as const;
    const names = { commission: "commission", marketing: "marketing", errors: "error charges" };
    grid.body.forEach((row, index) => {
      const platform = grid.cell(row, "platform")?.trim() || `Statement ${index + 1}`;
      const date = parseDate(grid.cell(row, "date"));
      const missingField = fields.find((field) => !grid.has(field) || numberValue(grid.cell(row, field)) === null);
      if (missingField) {
        spendFacts.push({
          unitId,
          date,
          category: "delivery",
          amount: null,
          label: "Missing",
          note: `Add ${names[missingField]} for ${platform}. A missing fee is not $0.`,
          source: slice.fileName,
        });
        drafts.push({
          unitId,
          title: `Add ${names[missingField]} for ${platform}.`,
          outcome: "The statement total stays Missing. Marketing stays its own column.",
          label: "Missing",
          amount: null,
          source: slice.fileName,
          score: 1,
        });
        return;
      }
      const amount = fields.reduce((sum, field) => sum + (numberValue(grid.cell(row, field)) ?? 0), 0);
      spendFacts.push({
        unitId,
        date,
        category: "delivery",
        amount,
        label: "Verified",
        note: "Commission, marketing, and error charges are each on the file. Payout is not the fee.",
        source: slice.fileName,
      });
      drafts.push({
        unitId,
        title: `Review the ${platform} statement before the next payout.`,
        outcome: "Commission, marketing, and error charges are each on the file. Marketing is called out on its own.",
        label: "Verified",
        amount,
        source: slice.fileName,
        score: Math.abs(amount),
      });
    });
  }

  function readCount(slice: Slice) {
    const unitId = slice.unitId as string;
    const grid = readGrid(slice.rows);
    mark(unitId, "count");
    for (const row of grid.body) {
      const begin = grid.has("begin") ? numberValue(grid.cell(row, "begin")) : null;
      const end = grid.has("end") ? numberValue(grid.cell(row, "end")) : null;
      const current = counts.get(unitId) ?? {
        begin: 0,
        end: 0,
        label: "Verified" as EvidenceLabel,
        broken: false,
        note: "",
        source: slice.fileName,
      };
      if (begin === null || end === null) current.broken = true;
      else {
        current.begin += begin;
        current.end += end;
      }
      current.note = current.broken ? "A blank count is not $0." : "Beginning and ending are on the count.";
      counts.set(unitId, current);
    }
  }
}

function categoryForInvoice(categoryCell: string | undefined, item: string | undefined): {
  category: Category;
  label: EvidenceLabel;
  note: string;
} {
  return categoryForLine(categoryCell, item);
}

function lineAmount(grid: ReturnType<typeof readGrid>, row: string[]): { amount: number | null; label: EvidenceLabel; note: string } {
  if (grid.has("extension")) {
    const amount = numberValue(grid.cell(row, "extension"));
    if (amount === null) return { amount: null, label: "Missing", note: "A blank extension is not $0." };
    return { amount, label: "Verified", note: "Printed extension on the file." };
  }
  const qty = grid.has("qty") ? numberValue(grid.cell(row, "qty")) : null;
  const price = grid.has("price") ? numberValue(grid.cell(row, "price")) : null;
  if (qty !== null && price !== null) {
    return { amount: qty * price, label: "Estimated", note: "Quantity times price. No printed extension." };
  }
  return { amount: null, label: "Missing", note: "Add an extension, or a quantity and a price." };
}

function pushColumn(
  target: MoneyFact[],
  grid: ReturnType<typeof readGrid>,
  row: string[],
  field: string,
  unitId: string,
  date: string | null,
  source: string,
  note: string
) {
  if (!grid.has(field)) return;
  const amount = numberValue(grid.cell(row, field));
  target.push({
    unitId,
    date,
    amount,
    label: amount === null ? "Missing" : "Verified",
    note: amount === null ? "A blank cell is not $0." : note,
    source,
  });
}

function unitPrimeFromParts(sales: Figure, labor: Figure, cogs: Figure, days: number): PrimeView {
  const weekStatus: PrimeView["weekStatus"] = days === 0 ? "missing" : days < 7 ? "open" : "closed";
  if ([sales, labor, cogs].some((figure) => figure.label === "Missing" || figure.amount === null)) {
    const reason = [cogs, labor, sales].find((figure) => figure.label === "Missing" || figure.amount === null);
    return {
      dollars: missingFigure(reason?.missing ?? COUNT_HINT),
      percent: missingFigure(reason?.missing ?? COUNT_HINT),
      cogs,
      labor,
      sales,
      weekStatus: weekStatus === "closed" ? "open" : weekStatus,
      note: `${reason?.missing ?? COUNT_HINT} The week stays open.`,
    };
  }
  const open = weekStatus !== "closed";
  const label = downgrade(weakest([cogs.label, labor.label, sales.label]), open);
  const dollars = knownFigure((cogs.amount ?? 0) + (labor.amount ?? 0), label === "Missing" ? "Estimated" : label, "COGS plus labor.");
  const percent = (wholeDollars(dollars.amount ?? 0) / wholeDollars(sales.amount ?? 0)) * 100;
  return {
    dollars,
    percent:
      wholeDollars(sales.amount ?? 0) === 0
        ? missingFigure("Sales are 0, so a percent is not shown.")
        : { label, amount: percent, missing: null, note: "Prime cost divided by sales." },
    cogs,
    labor,
    sales,
    weekStatus,
    note: open ? `Open week. ${days} dates are on the files. This is not a finished close.` : "COGS plus labor, divided by sales.",
  };
}

export function boardFromCsv(input: {
  units: UnitRef[];
  files: Array<{ name: string; csv: string; readable?: boolean }>;
  targets?: Partial<Record<Category, number | null>>;
  owner?: string;
  today: string;
}): Board {
  const slices = input.files.flatMap((file, index) =>
    slicesFromTable({
      id: `file-${index}`,
      fileName: file.name,
      rows: file.readable === false ? [] : requireTable(file.csv),
      units: input.units,
      readable: file.readable !== false,
    })
  );
  return buildBoard({
    units: input.units,
    slices,
    targets: input.targets ?? {},
    owner: input.owner ?? "Owner",
    today: input.today,
  });
}

function requireTable(csv: string): string[][] {
  return parseTable(csv);
}
