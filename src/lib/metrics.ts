export type ZReportNumbers = {
  netSales?: number | null;
  foodSales?: number | null;
  liquorSales?: number | null;
  laborCost?: number | null;
};

export type CostPercentages = {
  foodCostPercent: string | null;
  liquorCostPercent: string | null;
  primeCostPercent: string | null;
};

// These are category sales-mix percentages (category sales ÷ net sales), not
// true cost percentages — true food/prime cost needs COGS reconciled against
// invoices. The DB columns are named *CostPercent for historical reasons; the
// values are sales mix until COGS reconciliation lands.
export function computeCostPercentages(r: ZReportNumbers): CostPercentages {
  const net = r.netSales;
  const hasNet = net != null && net !== 0;
  const ratio = (numerator: number) => ((numerator / (net as number)) * 100).toFixed(2);

  return {
    foodCostPercent: hasNet && r.foodSales != null ? ratio(r.foodSales) : null,
    liquorCostPercent: hasNet && r.liquorSales != null ? ratio(r.liquorSales) : null,
    primeCostPercent: hasNet ? ratio((r.foodSales ?? 0) + (r.laborCost ?? 0)) : null,
  };
}
