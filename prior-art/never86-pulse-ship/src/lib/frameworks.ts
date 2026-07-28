/**
 * NEVER86'D HUB FRAMEWORKS
 * Direct port of the Hub Knowledge Base v1.0 thresholds.
 * This is the proprietary operator brain — every agent reads from here.
 *
 * DO NOT edit thresholds without versioning. These are battle-tested
 * from real Community Tap operations.
 */

export const HUB_VERSION = '1.0.0';

// ---------- Prime Cost Framework ----------
export const PRIME_COST = {
  elite: 0.55,    // < 55% — top 10%, beats Chipotle
  good: 0.62,     // 55-62% — healthy independent
  watch: 0.68,    // 62-68% — industry median
  // > 68% = danger, likely losing money
} as const;

// ---------- Food Cost ----------
export const FOOD_COST = {
  elite: 0.25,    // < 25% — exceptional
  target: 0.30,   // < 30% — healthy target
  alert: 0.32,    // > 32% triggers P2 (after sales check)
} as const;

// ---------- Labor ----------
export const LABOR = {
  elite: 0.25,    // < 25% — top 10%
  target: 0.28,   // < 28% — full service standard
  alert: 0.30,    // > 30% triggers P2
  danger: 0.38,   // > 38% triggers P1
  overtime_warn_hours: 35,  // flag at 35 to prevent 40+
} as const;

// ---------- Bar & Beverage ----------
export const BAR = {
  liquor_target: 0.20,
  beer_target: 0.25,
  wine_target: 0.30,
  well_floor: 0.15,
  reprice_trigger: 0.40,
  price_floors: {
    domestic_bottle: 4.00,
    import_bottle: 5.50,
    craft_draft_small: 6.00,
    craft_draft_large: 7.50,
    champagne_glass: 8.00,
  },
} as const;

// ---------- Menu Engineering ----------
export const MENU = {
  size_sweet_spot: { min: 90, max: 120 },
  cut_threshold_units: 5,        // < 5 units/month = dog
  cut_threshold_revenue: 50,     // < $50/month
  safe_increase: { min: 0.50, max: 0.75 },
  moderate_increase: { min: 1.00, max: 1.50 },
} as const;

// ---------- Vendor & Purchasing ----------
export const VENDOR = {
  split_purchasing_premium: { min: 0.03, max: 0.08 },  // 3-8% cost
  weekly_review_change_threshold: 0.10,  // flag any item up >10% w/w
  benchmarks: {
    mozzarella_per_lb: { min: 1.85, max: 1.95 },
    beef_patty_80_20_case: { min: 65, max: 80 },
  },
} as const;

// ---------- Weekly Control ----------
export const WEEKLY = {
  sales_variance_alert: 0.10,    // ±10% from target
  food_cost_alert_pct: 0.30,
  labor_alert_pct: 0.30,
  prime_cost_alert: 0.65,
} as const;

// ---------- Alert Priority Levels ----------
export type AlertLevel = 'P1' | 'P2' | 'P3' | 'WIN' | 'INFO';

export interface Alert {
  level: AlertLevel;
  metric: string;
  message: string;
  cause?: string;
  action?: string;
}

// ---------- Classification helpers ----------

export function classifyPrimeCost(primePct: number): {
  band: 'elite' | 'good' | 'watch' | 'danger';
  label: string;
} {
  if (primePct < PRIME_COST.elite) return { band: 'elite', label: 'Elite' };
  if (primePct < PRIME_COST.good) return { band: 'good', label: 'Healthy' };
  if (primePct < PRIME_COST.watch) return { band: 'watch', label: 'Watch' };
  return { band: 'danger', label: 'Danger' };
}

export function classifyFoodCost(foodPct: number): {
  band: 'elite' | 'target' | 'watch' | 'alert';
  label: string;
} {
  if (foodPct < FOOD_COST.elite) return { band: 'elite', label: 'Elite' };
  if (foodPct < FOOD_COST.target) return { band: 'target', label: 'On target' };
  if (foodPct < FOOD_COST.alert) return { band: 'watch', label: 'Watch' };
  return { band: 'alert', label: 'Alert' };
}

export function classifyLabor(laborPct: number): {
  band: 'elite' | 'target' | 'watch' | 'alert' | 'danger';
  label: string;
} {
  if (laborPct < LABOR.elite) return { band: 'elite', label: 'Elite' };
  if (laborPct < LABOR.target) return { band: 'target', label: 'On target' };
  if (laborPct < LABOR.alert) return { band: 'watch', label: 'Watch' };
  if (laborPct < LABOR.danger) return { band: 'alert', label: 'Alert' };
  return { band: 'danger', label: 'Danger' };
}
