export type BotCard = BotCardShape;
export type BotCardShape = {
  slug: string;
  name: string;
  team: "store" | "company";
  job: string;
  sources: string[];
  never: string[];
  approval_line: string;
  mcp_tools: string[];
};

export const LEAD_BOTS: BotCardShape[] = [
  {
    slug: "store-chief-of-staff",
    name: "Store Chief of Staff",
    team: "store",
    job: "Pick one next action. Keep morning/night/weekly loops on one store.",
    sources: ["prior-day close totals", "open tickets", "missing-evidence list"],
    never: ["invent dollars", "send vendor messages", "mix company GTM into store P&L"],
    approval_line: "Human approves anything that leaves the building.",
    mcp_tools: ["get_operator_system", "build_action_shift"],
  },
  {
    slug: "founder-chief-of-staff",
    name: "Founder Chief of Staff",
    team: "company",
    job: "Route product, truth, and GTM. Keep private store receipts out of public work.",
    sources: ["public answers", "system pack", "approved drafts"],
    never: ["paste private store statements into public posts"],
    approval_line: "Myke approves external messages.",
    mcp_tools: ["get_operator_system", "get_operator_logic", "list_pos_bots", "list_vendor_silos"],
  },
];

const POS_SLUGS = [
  ["toast", "Toast Router", "OrderDetails.csv + PaymentDetails.csv"],
  ["pdq", "PDQ Router", "native-text Z + Sales Details + Third Party Orders"],
  ["square", "Square Router", "Transactions/Orders/Payments/Transfers"],
  ["aloha", "Aloha Router", "versioned Sales Summary + Transactions + Payments"],
  ["simphony", "Simphony Router", "CHDR/CDTL check-level"],
  ["brink", "PAR Brink Router", "Sales2/Data Service + EOD rule"],
  ["lightspeed", "Lightspeed K-Series Router", "current All Orders export"],
  ["clover", "Clover Router", "native order+payment LAB until two files"],
  ["revel", "Revel Router", "native order+payment LAB until two files"],
  ["spoton", "SpotOn Router", "native order+payment LAB until two files"],
] as const;

export const POS_BOTS: BotCardShape[] = POS_SLUGS.map(([slug, name, sources]) => ({
  slug: `pos-${slug}`,
  name,
  team: "store",
  job: `POS router for ${name}. Preserve native labels. Never invent marketplace identity.`,
  sources: [sources],
  never: ["ask for POS login", "treat Delivery/Pickup alone as marketplace identity"],
  approval_line: "Show parsed totals before leak claims.",
  mcp_tools: ["get_pos_router"],
}));

const VENDOR_SLUGS = [
  ["sysco", "Sysco Silo", "Food"],
  ["usfoods", "US Foods Silo", "Food"],
  ["pfg", "PFG / Gordon Silo", "Food"],
  ["reinhart", "Reinhart / Midwest Silo", "Food"],
  ["martin-brothers", "Martin Brothers Silo", "Food"],
  ["produce", "Produce House Silo", "Food"],
  ["coke", "Coca-Cola / Fountain Silo", "Pop/NA Beverage"],
  ["pepsi", "Pepsi / Fountain Silo", "Pop/NA Beverage"],
  ["beer", "Beer Distributor Silo", "Beer"],
  ["chem-paper", "Chem / Paper / Linen Silo", "Chemicals/Paper/Supplies"],
] as const;

export const VENDOR_SILOS: BotCardShape[] = VENDOR_SLUGS.map(([slug, name, bucket]) => ({
  slug: `vendor-${slug}`,
  name,
  team: "store",
  job: `Vendor silo for ${name}. Default bucket ${bucket}. Silence only on operator-approved cadence.`,
  sources: ["invoice PDF/CSV", "credit memo", "delivery ticket"],
  never: ["copy another store cadence", "treat spend as COGS without a count", "ask for vendor portal login"],
  approval_line: "First 14 days advisory. Human sets cadence.",
  mcp_tools: ["build_vendor_silence_ticket", "get_vendor_silo"],
}));

export const MARKETPLACE_BOTS: BotCardShape[] = [
  {
    slug: "3p-doordash",
    name: "DoorDash Statement Bot",
    team: "store",
    job: "Map finalized Page 1 only. Subtotal is eligible sales.",
    sources: ["DoorDash finalized monthly statement Page 1"],
    never: ["use Transactions screen as payout truth", "add tips/taxes back into Sales"],
    approval_line: "Reconcile bridges within $0.02 or stay PARTIAL.",
    mcp_tools: ["calculate_3p_marketplace_cost", "get_operator_logic"],
  },
];

const POS_DETAIL: Record<string, unknown> = {
  toast: {
    required: ["OrderDetails.csv", "PaymentDetails.csv"],
    attribution: "Two of: Order Source, Dining Option, Revenue Center — unless exact external ID.",
    amount_field: "Amount as TOAST_AMOUNT_FIELD. Do not silently rename.",
    not_identity: ["Dining Option", "Revenue Center", "Delivery"],
  },
  pdq: {
    required: ["native-text Z-report", "Sales Details", "tender/void/refund/EOD"],
    optional: ["Third Party Orders"],
    empty_third_party:
      "Empty Third Party Orders means no qualifying configured payment rows, not zero marketplace sales.",
    not_identity: ["Delivery", "Pickup", "House Account"],
  },
  square: {
    required: ["Transactions or Orders", "Payments"],
    watch: ["Transfers crossing cutoff or location"],
    not_identity: ["Food Delivery Service", "eCommerce"],
  },
  aloha: {
    required: ["versioned Sales Summary + Transactions + Payments"],
    not_identity: ["Web", "Mobile", "order mode"],
  },
  simphony: {
    required: ["CHDR/CDTL check-level"],
    not_enough: ["OCD aggregate"],
    not_identity: ["Order Channel Name"],
  },
  brink: {
    required: ["Sales2/Data Service", "business date", "EOD rule"],
    not_identity: ["external tender alone as settlement"],
  },
  lightspeed: {
    required: ["current All Orders export"],
    not_identity: ["Pickup profile", "Delivery profile"],
  },
  clover: { status: "LAB/PARTIAL until two real files reviewed", required: ["native order+payment"] },
  revel: { status: "LAB/PARTIAL until two real files reviewed", required: ["native order+payment"] },
  spoton: { status: "LAB/PARTIAL until two real files reviewed", required: ["native order+payment"] },
};

const VENDOR_DETAIL: Record<
  string,
  { house: string; bucket_default: string; typical_ask: string; silence_note: string }
> = {
  sysco: {
    house: "Sysco",
    bucket_default: "Food unless line says chemical/paper",
    typical_ask: "invoice PDF + credits",
    silence_note: "Cadence is store-approved.",
  },
  usfoods: {
    house: "US Foods",
    bucket_default: "Food unless line says chemical/paper",
    typical_ask: "invoice + catch-weight lines",
    silence_note: "Do not merge SKUs with Sysco.",
  },
  pfg: {
    house: "PFG / Gordon Food Service",
    bucket_default: "Food",
    typical_ask: "invoice with pack size visible",
    silence_note: "Missing case pack = units-only.",
  },
  reinhart: {
    house: "Reinhart / Performance Midwest",
    bucket_default: "Food",
    typical_ask: "invoice + delivery ticket",
    silence_note: "Store cadence only.",
  },
  "martin-brothers": {
    house: "Martin Brothers (Iowa)",
    bucket_default: "Food",
    typical_ask: "invoice / statement",
    silence_note: "Ask order-day vs truck-day on load-day.",
  },
  produce: {
    house: "Local produce / specialty",
    bucket_default: "Food",
    typical_ask: "invoice + short/credit note",
    silence_note: "Shorts are recon candidates.",
  },
  coke: {
    house: "Coca-Cola bottler / fountain",
    bucket_default: "Pop/NA Beverage",
    typical_ask: "BIB or package invoice",
    silence_note: "Quiet truck ≠ empty gun.",
  },
  pepsi: {
    house: "Pepsi bottler / fountain",
    bucket_default: "Pop/NA Beverage",
    typical_ask: "BIB or package invoice",
    silence_note: "Do not reuse Coke pack math.",
  },
  beer: {
    house: "Licensed beer distributor",
    bucket_default: "Beer",
    typical_ask: "invoice + keg deposit/credit",
    silence_note: "Deposits are not COGS.",
  },
  "chem-paper": {
    house: "Chem / paper / linen / grease",
    bucket_default: "Chemicals/Paper/Supplies",
    typical_ask: "invoice",
    silence_note: "Never bury in Food.",
  },
};

export function listPosBots() {
  return POS_BOTS.map((b) => ({
    slug: b.slug,
    name: b.name,
    job: b.job,
    sources: b.sources,
    never: b.never,
  }));
}

export function listVendorSilos() {
  return VENDOR_SILOS.map((b) => ({
    slug: b.slug,
    name: b.name,
    job: b.job,
    sources: b.sources,
    never: b.never,
  }));
}

export function getPosRouter(slug: string) {
  const key = slug.replace(/^pos-/, "");
  const bot = POS_BOTS.find((b) => b.slug === slug || b.slug === `pos-${key}`);
  const detail = POS_DETAIL[key];
  if (!bot || !detail) {
    return { error: "unknown POS", known: POS_BOTS.map((b) => b.slug) };
  }
  return { bot, routing: detail, evidence_status: "PUBLIC_SPEC" };
}

export function getVendorSilo(slug: string) {
  const key = slug.replace(/^vendor-/, "");
  const bot = VENDOR_SILOS.find((b) => b.slug === slug || b.slug === `vendor-${key}`);
  const detail = VENDOR_DETAIL[key];
  if (!bot || !detail) {
    return { error: "unknown vendor silo", known: VENDOR_SILOS.map((b) => b.slug) };
  }
  return {
    bot,
    house: detail,
    evidence_status: "PUBLIC_SPEC",
    claim_boundary: "Public silo spec is not this store's cadence, price file, or last invoice.",
  };
}

export function listAllBots() {
  return [...LEAD_BOTS, ...POS_BOTS, ...VENDOR_SILOS, ...MARKETPLACE_BOTS];
}
