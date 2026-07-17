export type LaborStore = {
  name: string;
  netSales: number;
  laborDollars: number;
  laborPct: number;
  budgetedPct: number;
  overtimeHours: number;
  overtimeDollars: number;
  ghostShiftCount: number;
  ghostShiftDollars: number;
  flagged: boolean;
};

export type LaborOffender = {
  store: string;
  name: string;
  role: string;
  scheduled: number;
  clocked: number;
  overtime: number;
  drift: number;
};

export type LaborLeak = {
  lastIngest: string | null;
  networkNetSales: number;
  networkLabor: number;
  networkLaborPct: number;
  budgetedLaborPct: number;
  overtimeDollarsYr: number;
  ghostShiftDollarsYr: number;
  storesFlagged: number;
  stores: LaborStore[];
  offenders: LaborOffender[];
};
