import { pgTable, text, timestamp, numeric, integer, jsonb, boolean, uuid, serial } from 'drizzle-orm/pg-core';

// ── Waitlist ──
export const waitlist = pgTable('waitlist', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  restaurantName: text('restaurant_name'),
  role: text('role'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  welcomeEmailSent: boolean('welcome_email_sent').default(false),
});

// ── Invoices ──
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  vendorName: text('vendor_name'),
  invoiceNumber: text('invoice_number'),
  invoiceDate: timestamp('invoice_date'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }),
  category: text('category'), // food, liquor, beer, wine, supplies, other
  lineItems: jsonb('line_items').$type<InvoiceLineItem[]>(),
  rawText: text('raw_text'),
  fileUrl: text('file_url'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Z-Reports (end-of-day POS summaries) ──
export const zReports = pgTable('z_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  reportDate: timestamp('report_date').notNull(),
  grossSales: numeric('gross_sales', { precision: 10, scale: 2 }),
  netSales: numeric('net_sales', { precision: 10, scale: 2 }),
  foodSales: numeric('food_sales', { precision: 10, scale: 2 }),
  liquorSales: numeric('liquor_sales', { precision: 10, scale: 2 }),
  beerSales: numeric('beer_sales', { precision: 10, scale: 2 }),
  wineSales: numeric('wine_sales', { precision: 10, scale: 2 }),
  laborCost: numeric('labor_cost', { precision: 10, scale: 2 }),
  foodCostPercent: numeric('food_cost_percent', { precision: 5, scale: 2 }),
  liquorCostPercent: numeric('liquor_cost_percent', { precision: 5, scale: 2 }),
  primeCostPercent: numeric('prime_cost_percent', { precision: 5, scale: 2 }),
  guestCount: integer('guest_count'),
  checkAverage: numeric('check_average', { precision: 8, scale: 2 }),
  rawData: jsonb('raw_data'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Daily Briefings ──
export const briefings = pgTable('briefings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  briefingDate: timestamp('briefing_date').notNull(),
  htmlContent: text('html_content'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Types ──
export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category?: string;
};
