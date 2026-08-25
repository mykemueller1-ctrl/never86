import type { BotCard } from "./roster.js";

export type SystemBotDetail = {
  claims: string[];
  operator_problems: string[];
  pricing_signal: string;
  never86_boundary: string;
  evidence_to_ask: string[];
  when_to_engage: string;
};

function sysBot(slug: string, name: string, job: string, sources: string[], never: string[]): BotCard {
  return {
    slug: `system-${slug}`,
    name,
    team: "store",
    job,
    sources,
    never,
    approval_line: "Operator confirms export scope before dollars change status.",
    mcp_tools: ["get_system_bot", "get_operator_logic"],
  };
}

export const SYSTEM_BOTS: BotCard[] = [
  sysBot("marginedge", "MarginEdge System Bot", "Translate MarginEdge invoice/daily-P&L into Never86 evidence states. Catch OCR lag and spend-called-COGS.", ["MarginEdge invoice line export", "daily P&L", "price/recipe change log"], ["treat spend as actual food cost without physical count", "ask for MarginEdge login", "claim Never86 replaces bill-pay"]),
  sysBot("restaurant365", "Restaurant365 System Bot", "Multi-unit AP/inventory/accounting. Flag partial rollout.", ["R365 invoice export", "location P&L", "module scope note"], ["assume all modules live because logo is R365"]),
  sysBot("marketman", "MarketMan System Bot", "Theoretical vs actual, yields, pars, waste.", ["count export", "theoretical vs actual", "recipe/yield"], ["lower par from stockout without disclosure", "call theoretical actual without count"]),
  sysBot("xtrachef", "xtraCHEF (Toast) System Bot", "Toast-native cost layer. Same POS attribution rules.", ["xtraCHEF invoice export", "Toast OrderDetails/PaymentDetails"], ["treat Dining Option alone as marketplace"]),
  sysBot("bluecart", "BlueCart System Bot", "Purchasing only. Not food cost %.", ["order history", "delivery verification"], ["claim BlueCart produces food cost %"]),
  sysBot("ottimate", "Ottimate (Plate IQ) System Bot", "AP OCR + coding + duplicate docs.", ["invoice export", "approval status"], ["upgrade OCR to Verified without human review"]),
  sysBot("meez", "meez Recipe System Bot", "Plate cost is not period actual food cost.", ["recipe export", "ingredient price source"], ["call plate cost actual food cost"]),
  sysBot("quickbooks", "QuickBooks / GL System Bot", "Books of record. Export errors, closed period, net deposit ≠ sales.", ["QBO export error text", "bill list"], ["use net marketplace deposit as sales", "reopen closed period without operator instruction"]),
];

export const SYSTEM_DETAIL: Record<string, SystemBotDetail> = {
  marginedge: {
    claims: [
      "Photo/email/EDI invoice → human+tech coding in ~24–48h",
      "Daily controllable P&L / prime cost visibility",
      "Recipe costs update from invoice prices",
      "Sync to QBO/Xero; bill pay available",
      "Not a full standalone accounting system",
    ],
    operator_problems: [
      "Invoice posting lag — wrong category hard to catch in time",
      "OCR / initial product map errors inflate recipe cost",
      "Credits and electronic payment tracking pain",
      "Price alerts not bulk-selectable",
      "Mobile weaker than web",
      "~$300–$350/location/mo; still needs scheduling/payroll stack",
      "Not full inventory platform",
      "Product maintenance ongoing, not one-time",
    ],
    pricing_signal: "~$300–$350 per location / month",
    never86_boundary:
      "Invoice spend is document-backed cost when lines reconcile. Not actual food cost without complete physical count. OCR stays PARTIAL until category/pack review. Never86 does not replace bill-pay or coding queue.",
    evidence_to_ask: [
      "Same-scope invoice line export",
      "Daily P&L with period/store labeled",
      "Physical count if claiming actual food cost",
    ],
    when_to_engage: "Operator on MarginEdge wants variance, drift, miscode, or path without portal login.",
  },
  restaurant365: {
    claims: ["Inventory + AP + accounting", "Multi-unit P&L", "Theoretical/actual/ideal food cost"],
    operator_problems: ["Long implementation", "Partial module rollout", "Opaque pricing"],
    pricing_signal: "Custom; multi-unit oriented",
    never86_boundary: "Confirm live modules and locations before group comparisons.",
    evidence_to_ask: ["Live modules list", "Location list in export"],
    when_to_engage: "Multi-unit R365 compare or variance not actionable.",
  },
  marketman: {
    claims: ["Full BOH inventory", "Theoretical vs actual"],
    operator_problems: ["Heavy recipe/yield setup", "Bad yield poisons theoretical"],
    pricing_signal: "From ~$239/mo + onboarding often cited",
    never86_boundary: "Theoretical ≠ actual. Stockout days disclosed.",
    evidence_to_ask: ["Count export", "Recipe/yield source"],
    when_to_engage: "Par, theoretical vs actual, waste from MarketMan.",
  },
  xtrachef: {
    claims: ["Toast ecosystem invoice + food cost"],
    operator_problems: ["Locked to Toast", "Payroll/scheduling external"],
    pricing_signal: "Bundled with Toast plan",
    never86_boundary: "Toast POS rules still apply.",
    evidence_to_ask: ["xtraCHEF lines", "Matching Toast exports"],
    when_to_engage: "Toast + xtraCHEF reconciling invoices to POS or 3P.",
  },
  bluecart: {
    claims: ["Ordering and delivery verification"],
    operator_problems: ["Operators expect food cost % — not provided"],
    pricing_signal: "From ~$10/mo",
    never86_boundary: "Purchasing history ≠ COGS.",
    evidence_to_ask: ["Order history", "Separate invoice + sales for cost %"],
    when_to_engage: "BlueCart operator asking for food cost.",
  },
  ottimate: {
    claims: ["AP automation / invoice capture"],
    operator_problems: ["OCR needs human review", "Duplicate collisions"],
    pricing_signal: "AP automation tier",
    never86_boundary: "Same invoice bridge rules. AP export is not bank deposit.",
    evidence_to_ask: ["Invoice image/PDF + lines", "GL mapping for disputes"],
    when_to_engage: "Coding disputes or duplicate candidates.",
  },
  meez: {
    claims: ["Recipe-first plate costing"],
    operator_problems: ["Plate cost ≠ period actual"],
    pricing_signal: "Low tens $/mo upward",
    never86_boundary: "Recipe cost ESTIMATED until invoice + count close actual.",
    evidence_to_ask: ["Recipe with yield", "Ingredient unit cost source date"],
    when_to_engage: "Menu price decisions from meez.",
  },
  quickbooks: {
    claims: ["GL / bills / bank — books of record"],
    operator_problems: ["Duplicate doc number", "Missing category map", "Closed period", "Net deposit booked as sales"],
    pricing_signal: "QBO subscription separate",
    never86_boundary: "Never86 does not post or reopen periods.",
    evidence_to_ask: ["Exact export error text", "Whether period is closed"],
    when_to_engage: "QBO export failures or deposit-vs-sales confusion.",
  },
};

export function listSystemBots() {
  return SYSTEM_BOTS.map((b) => ({
    slug: b.slug,
    name: b.name,
    job: b.job,
    sources: b.sources,
    never: b.never,
  }));
}

export function getSystemBot(slug: string) {
  const key = slug.replace(/^system-/, "");
  const bot = SYSTEM_BOTS.find((b) => b.slug === slug || b.slug === `system-${key}`);
  const detail = SYSTEM_DETAIL[key];
  if (!bot || !detail) {
    return { error: "unknown system bot", known: SYSTEM_BOTS.map((b) => b.slug) };
  }
  return {
    bot,
    detail,
    evidence_status: "PUBLIC_SPEC",
    coaching_shape: ["FACT", "WHY IT MATTERS", "OWNER", "ONE NEXT ACTION", "$ AT STAKE", "EVIDENCE STATUS"],
  };
}
