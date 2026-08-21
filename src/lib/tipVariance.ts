export type TipStore = {
  name: string;
  totalTips: number;
  perCoverAvg: number;
  weekVariance: number;
  flagged: boolean;
};

export type TipVarianceEmployee = {
  store: string;
  name: string;
  role: string;
  tipsThisWeek: number;
  tipsLastWeek: number;
  deltaPct: number;
};

export type TipVariance = {
  lastIngest: string | null;
  weekLabel: string;
  networkTotalTips: number;
  networkAvgPerCover: number;
  networkVariancePct: number;
  storesFlagged: number;
  stores: TipStore[];
  movers: TipVarianceEmployee[];
};
