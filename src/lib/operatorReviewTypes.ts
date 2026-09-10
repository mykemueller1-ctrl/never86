export type OperatorReviewRule = { id: string; title: string; detail: string; section: string };
export type OperatorReviewData = {
  workspaceName: string;
  location: string;
  source: { title: string; label: string; text: string };
  rules: OperatorReviewRule[];
};

export function localReviewEnabled(nodeEnv: string | undefined, host: string | null, dataPath: string | undefined) {
  if (nodeEnv !== 'development' || !dataPath) return false;
  return /^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(host ?? '');
}

// Formula only. These inputs are entered by the person reviewing the screen.
export function spiritCostPerPour(bottleCost: number, bottleMl: number, pourOz: number): number | null {
  if (![bottleCost, bottleMl, pourOz].every(Number.isFinite) || bottleCost <= 0 || bottleMl <= 0 || pourOz <= 0) return null;
  return bottleCost * pourOz * 29.5735295625 / bottleMl;
}
