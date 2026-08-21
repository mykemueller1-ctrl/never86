// The ROI math behind the homepage calculator, isolated so it's testable and
// can't drift. "Points" = percentage points of food cost (a point is 1% of
// sales), the unit operators actually think in.

export type RoiResult = { monthly: number; annual: number };

/**
 * What `points` percentage-points of food-cost improvement is worth against a
 * given monthly sales figure. 2 points on $60k/mo = $1,200/mo, $14,400/yr.
 * Negatives are clamped to 0.
 */
export function pointsWorth(monthlySales: number, points = 2): RoiResult {
  const sales = Number.isFinite(monthlySales) && monthlySales > 0 ? monthlySales : 0;
  const p = Number.isFinite(points) && points > 0 ? points : 0;
  const monthly = sales * (p / 100);
  return { monthly, annual: monthly * 12 };
}

/** Format a number as whole dollars (no cents) — "$14,400". */
export function usd(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}
