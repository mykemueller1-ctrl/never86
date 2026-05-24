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

// ── Mychael Mueller Logic OS Foundation ──
export const operatorBrands = pgTable('operator_brands', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status').default('active').notNull(),
  brandVoice: jsonb('brand_voice').default({}).notNull(),
  brandPromise: text('brand_promise'),
  targetAudience: text('target_audience'),
  positioning: text('positioning'),
  visualIdentity: jsonb('visual_identity').default({}).notNull(),
  strategyNotes: text('strategy_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const operatorConcepts = pgTable('operator_concepts', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  brandId: integer('brand_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status').default('active').notNull(),
  serviceModel: text('service_model'),
  menuThesis: text('menu_thesis'),
  pricingStrategy: text('pricing_strategy'),
  operatingModel: text('operating_model'),
  customerPromise: text('customer_promise'),
  constraints: jsonb('constraints').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const operatorStoreProfiles = pgTable('operator_store_profiles', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  locationId: integer('location_id').notNull(),
  brandId: integer('brand_id').notNull(),
  conceptId: integer('concept_id').notNull(),
  storeName: text('store_name'),
  localMarket: text('local_market'),
  openingDate: timestamp('opening_date'),
  status: text('status').default('active').notNull(),
  hoursProfile: jsonb('hours_profile').default({}).notNull(),
  storeScorecard: jsonb('store_scorecard').default({}).notNull(),
  localConstraints: jsonb('local_constraints').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmLogicPrinciples = pgTable('mm_logic_principles', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  scopeType: text('scope_type').default('operator').notNull(),
  scopeId: integer('scope_id'),
  principle: text('principle').notNull(),
  rationale: text('rationale'),
  priority: integer('priority').default(50).notNull(),
  confidence: numeric('confidence', { precision: 5, scale: 2 }).default('0.80').notNull(),
  sourceType: text('source_type'),
  sourceRef: text('source_ref'),
  tags: jsonb('tags').default([]).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmDecisionRules = pgTable('mm_decision_rules', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  principleId: integer('principle_id'),
  scopeType: text('scope_type').default('operator').notNull(),
  scopeId: integer('scope_id'),
  triggerName: text('trigger_name').notNull(),
  triggerCondition: jsonb('trigger_condition').default({}).notNull(),
  decisionAction: text('decision_action').notNull(),
  escalationPath: text('escalation_path'),
  severity: text('severity').default('medium').notNull(),
  automationLevel: text('automation_level').default('recommend').notNull(),
  doNotDo: text('do_not_do'),
  successMetric: text('success_metric'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmPlaybooks = pgTable('mm_playbooks', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  brandId: integer('brand_id'),
  conceptId: integer('concept_id'),
  storeProfileId: integer('store_profile_id'),
  ruleId: integer('rule_id'),
  name: text('name').notNull(),
  category: text('category').default('operations').notNull(),
  objective: text('objective'),
  whenToUse: text('when_to_use'),
  ownerRole: text('owner_role'),
  status: text('status').default('draft').notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmPlaybookSteps = pgTable('mm_playbook_steps', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  playbookId: integer('playbook_id').notNull(),
  stepOrder: integer('step_order').notNull(),
  instruction: text('instruction').notNull(),
  evidenceRequired: text('evidence_required'),
  automationHint: text('automation_hint'),
  expectedOutput: text('expected_output'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mmMemoryAtoms = pgTable('mm_memory_atoms', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  brandId: integer('brand_id'),
  conceptId: integer('concept_id'),
  storeProfileId: integer('store_profile_id'),
  sourceTable: text('source_table'),
  sourceRecordId: text('source_record_id'),
  memoryType: text('memory_type').default('lesson').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  confidence: numeric('confidence', { precision: 5, scale: 2 }).default('0.80').notNull(),
  importance: integer('importance').default(50).notNull(),
  embeddingSource: text('embedding_source'),
  tags: jsonb('tags').default([]).notNull(),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validUntil: timestamp('valid_until'),
  archived: boolean('archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmTrainingExamples = pgTable('mm_training_examples', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  memoryAtomId: integer('memory_atom_id'),
  ruleId: integer('rule_id'),
  prompt: text('prompt').notNull(),
  idealResponse: text('ideal_response').notNull(),
  failureMode: text('failure_mode'),
  evaluatorNotes: text('evaluator_notes'),
  trainingStatus: text('training_status').default('candidate').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mmOsRuns = pgTable('mm_os_runs', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  brandId: integer('brand_id'),
  conceptId: integer('concept_id'),
  storeProfileId: integer('store_profile_id'),
  runType: text('run_type').default('decision_support').notNull(),
  inputContext: jsonb('input_context').default({}).notNull(),
  outputSummary: text('output_summary'),
  decisionTaken: text('decision_taken'),
  confidence: numeric('confidence', { precision: 5, scale: 2 }),
  sourceMemoryIds: jsonb('source_memory_ids').default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type OperatorBrand = typeof operatorBrands.$inferSelect;
export type InsertOperatorBrand = typeof operatorBrands.$inferInsert;
export type OperatorConcept = typeof operatorConcepts.$inferSelect;
export type InsertOperatorConcept = typeof operatorConcepts.$inferInsert;
export type OperatorStoreProfile = typeof operatorStoreProfiles.$inferSelect;
export type InsertOperatorStoreProfile = typeof operatorStoreProfiles.$inferInsert;
export type MmLogicPrinciple = typeof mmLogicPrinciples.$inferSelect;
export type InsertMmLogicPrinciple = typeof mmLogicPrinciples.$inferInsert;
export type MmDecisionRule = typeof mmDecisionRules.$inferSelect;
export type InsertMmDecisionRule = typeof mmDecisionRules.$inferInsert;
export type MmPlaybook = typeof mmPlaybooks.$inferSelect;
export type InsertMmPlaybook = typeof mmPlaybooks.$inferInsert;
export type MmPlaybookStep = typeof mmPlaybookSteps.$inferSelect;
export type InsertMmPlaybookStep = typeof mmPlaybookSteps.$inferInsert;
export type MmMemoryAtom = typeof mmMemoryAtoms.$inferSelect;
export type InsertMmMemoryAtom = typeof mmMemoryAtoms.$inferInsert;
export type MmTrainingExample = typeof mmTrainingExamples.$inferSelect;
export type InsertMmTrainingExample = typeof mmTrainingExamples.$inferInsert;
export type MmOsRun = typeof mmOsRuns.$inferSelect;
export type InsertMmOsRun = typeof mmOsRuns.$inferInsert;
