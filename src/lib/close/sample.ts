import { slicesFromTable, type Slice, type UnitRef } from "./classify";
import type { Category } from "./money";
import { parseTable } from "./table";

export const SAMPLE_UNITS: UnitRef[] = [
  { id: "harbor", name: "Harbor Grill" },
  { id: "mill", name: "Mill Street" },
];

export const SAMPLE_TARGETS: Partial<Record<Category, string>> = {
  labor: "30",
  food: "30",
};

const FILES: Array<{ name: string; csv: string }> = [
  {
    name: "harbor-sales.csv",
    csv: `date,unit,net_sales,comps,voids
2026-10-20,Harbor Grill,1000,20,5
2026-10-21,Harbor Grill,1200,10,0
2026-10-22,Harbor Grill,800,15,8`,
  },
  {
    name: "harbor-labor.csv",
    csv: `date,unit,role,scheduled_hours,clock_hours,wage,labor_cost
2026-10-22,Harbor Grill,Shift lead,8,10,20,320`,
  },
  {
    name: "harbor-invoices.csv",
    csv: `date,unit,item,category,pack,previous_price,price,qty,extension
2026-10-22,Harbor Grill,Ground beef,food,10 lb,40,50,4,200
2026-10-22,Harbor Grill,House lager,beverage,,,,,60
2026-10-22,Harbor Grill,Foil pans,paper,,,,,25`,
  },
  {
    name: "harbor-doordash.csv",
    csv: `date,unit,platform,subtotal,commission,marketing,error_charges,payout
2026-10-22,Harbor Grill,DoorDash,400,80,20,10,270`,
  },
  {
    name: "mill-invoices.csv",
    csv: `date,unit,item,category,extension
2026-10-22,Mill Street,Cheddar,food,90`,
  },
];

export function sampleSlices(): Slice[] {
  return FILES.flatMap((file, index) =>
    slicesFromTable({
      id: `sample-${index}`,
      fileName: file.name,
      rows: parseTable(file.csv),
      units: SAMPLE_UNITS,
      readable: true,
    })
  );
}
