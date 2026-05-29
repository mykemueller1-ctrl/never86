export type CateringStore = {
  name: string;
  cateringNet: number;
  cateringOrders: number;
  avgTicket: number;
  invoicedNet: number;
  reconciledGap: number;
  flagged: boolean;
};

export type CateringChannel = {
  name: string;
  net: number;
  orders: number;
  feePct: number;
};

export type CateringLeak = {
  lastIngest: string | null;
  networkCateringNet: number;
  networkCateringOrders: number;
  networkAvgTicket: number;
  inStoreAvgTicket: number;
  ticketMultiplier: number;
  reconciledGapDollars: number;
  reconciledGapPct: number;
  storesFlagged: number;
  channels: CateringChannel[];
  stores: CateringStore[];
};
