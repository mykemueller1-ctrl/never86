import {
  CATEGORY_NAME,
  type Category,
  type EvidenceLabel,
  type Figure,
  money,
  weakest,
  wholeDollars,
} from "./money";

export interface Callout {
  category: Category;
  label: EvidenceLabel;
  text: string;
  variance: number | null;
  absVariance: number;
  miss: boolean;
}

function spendWords(figure: Figure): string {
  if (figure.label === "Missing" || figure.amount === null) return "Missing";
  return money(figure.amount);
}

function percentWords(spend: Figure, sales: Figure): string {
  if (spend.label === "Missing" || spend.amount === null) return "Missing";
  if (sales.label === "Missing" || sales.amount === null) return "Missing";
  if (wholeDollars(sales.amount) === 0) return "Missing";
  const pct = wholeDollars((wholeDollars(spend.amount) / wholeDollars(sales.amount)) * 100);
  return `${pct}%`;
}

function pair(category: Category, spend: Figure, sales: Figure, extra: string): string {
  const name = CATEGORY_NAME[category];
  return `${name} dollars: ${spendWords(spend)}. ${name} percent: ${percentWords(spend, sales)}. ${extra}`;
}

export function calloutFor(input: {
  category: Category;
  dayWord: string;
  spend: Figure;
  sales: Figure;
  targetPct: number | null;
}): Callout {
  const { category, dayWord, spend, sales, targetPct } = input;
  const name = CATEGORY_NAME[category];
  const spendMissing = spend.label === "Missing" || spend.amount === null;
  const salesMissing = sales.label === "Missing" || sales.amount === null;
  const salesZero = !salesMissing && sales.amount !== null && wholeDollars(sales.amount) === 0;

  if (spendMissing || salesMissing || salesZero) {
    const reason = spendMissing
      ? spend.missing ?? `${name} needs a file.`
      : salesZero
        ? "Sales are 0, so a percent is not shown."
        : sales.missing ?? "Add a POS close with net sales.";
    return {
      category,
      label: "Missing",
      text: pair(category, spend, sales, reason),
      variance: null,
      absVariance: 0,
      miss: false,
    };
  }

  const spendWhole = wholeDollars(spend.amount as number);
  const salesWhole = wholeDollars(sales.amount as number);
  const pct = wholeDollars((spendWhole / salesWhole) * 100);
  const label = weakest([spend.label, sales.label]);

  if (targetPct === null) {
    const verb = category === "delivery" ? "are" : "is";
    return {
      category,
      label,
      text: `${name} ${verb} ${money(spendWhole)} ${dayWord}, ${pct}% of sales. Set a ${name.toLowerCase()} target if you want an over or under.`,
      variance: null,
      absVariance: Math.abs(spendWhole),
      miss: false,
    };
  }

  const target = wholeDollars(targetPct);
  const variance = spendWhole - wholeDollars((target / 100) * salesWhole);
  if (variance > 0) {
    return {
      category,
      label,
      text: `${name} ran ${money(variance)} over ${dayWord}. That's ${pct}% of sales, and your target is ${target}%.`,
      variance,
      absVariance: variance,
      miss: true,
    };
  }
  if (variance < 0) {
    return {
      category,
      label,
      text: `${name} came in ${money(Math.abs(variance))} under ${dayWord}. Nice, that's ${pct}% of sales.`,
      variance,
      absVariance: Math.abs(variance),
      miss: true,
    };
  }
  return {
    category,
    label,
    text: `${name} landed on the target ${dayWord}. That's ${pct}% of sales.`,
    variance: 0,
    absVariance: 0,
    miss: false,
  };
}

export function sortCallouts(list: Callout[]): Callout[] {
  return [...list].sort((left, right) => {
    if (left.miss !== right.miss) return left.miss ? -1 : 1;
    if (right.absVariance !== left.absVariance) return right.absVariance - left.absVariance;
    return (right.variance ?? 0) - (left.variance ?? 0);
  });
}

export function shortStrip(list: Callout[]): Callout[] {
  const sorted = sortCallouts(list);
  const misses = sorted.filter((item) => item.miss);
  if (misses.length >= 3) return misses.slice(0, 3);
  return sorted.slice(0, 3);
}
