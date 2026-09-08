/**
 * Locked NAG Toast ground truth for this draft.
 * Never invent a substitute dollar. Tests must match these cents.
 *
 * Score file (box, not in this git unless already committed):
 *   missions/kristin-nag/breaktest/GROUND-TRUTH-Qs-1-8-10-11.md
 *
 * Taco Bomba / related-not-nag-tacobamba sheets are Toast-parse
 * training shapes only. Keep them off these NAG answers.
 */
export const NAG_TOAST_GT = {
  laborDate: '2026-08-31',
  laborCost: 1211.85,
  laborPctNet: 35.56,
  laborPctGross: 33.94,
  dayNetSales: 3408.15,
  dayGrossSales: 3570.5,
  weekStart: '2026-08-24',
  weekEnd: '2026-08-30',
  weekNetSales: 36827.34,
  strongestItemDay: '2026-08-25',
  strongestItemNet: 6619,
  voidLines: 24,
} as const;
