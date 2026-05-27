import { pgTable, serial, integer, varchar, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { operatorUsers } from "./operator-users";
import { operatorLocations } from "./operator-locations";

export const operatorZReports = pgTable("operator_z_reports", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorUsers.id, { onDelete: "cascade" }),
  locationId: integer("location_id").references(() => operatorLocations.id, { onDelete: "set null" }),
  reportDate: varchar("report_date", { length: 20 }).notNull(),
  sales: numeric("sales", { precision: 10, scale: 2 }).notNull(),
  foodCogs: numeric("food_cogs", { precision: 10, scale: 2 }).notNull(),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).notNull(),
  primeCost: numeric("prime_cost", { precision: 10, scale: 2 }).notNull(),
  foodCostPct: numeric("food_cost_pct", { precision: 5, scale: 2 }).notNull(),
  laborCostPct: numeric("labor_cost_pct", { precision: 5, scale: 2 }).notNull(),
  primeCostPct: numeric("prime_cost_pct", { precision: 5, scale: 2 }).notNull(),
  covers: integer("covers"),
  grossSales: numeric("gross_sales", { precision: 10, scale: 2 }),
  taxCollected: numeric("tax_collected", { precision: 10, scale: 2 }),
  discounts: numeric("discounts", { precision: 10, scale: 2 }),
  posRawPayload: jsonb("pos_raw_payload"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
