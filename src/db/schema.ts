import {
  bigint,
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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

// ── Action Shift workforce and role-specific checklist foundation ──
// Employee values are private runtime data. Source control contains schema only.
export const operatorStaffSeats = pgTable('operator_staff_seats', {
  id: uuid('id').defaultRandom().primaryKey(),
  operatorId: integer('operator_id').notNull(),
  defaultLocationId: integer('default_location_id'),
  authSubject: uuid('auth_subject').unique(),
  displayName: text('display_name').notNull(),
  email: text('email'),
  jobTitle: text('job_title'),
  status: text('status').default('invited').notNull(),
  hiredOn: date('hired_on'),
  terminatedOn: date('terminated_on'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('operator_staff_seats_operator_id_id_unique').on(table.operatorId, table.id),
  index('operator_staff_seats_operator_status_idx').on(table.operatorId, table.status),
  index('operator_staff_seats_operator_location_idx').on(table.operatorId, table.defaultLocationId),
]);

export const actionShiftRoleAssignments = pgTable('action_shift_role_assignments', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  operatorId: integer('operator_id').notNull(),
  seatId: uuid('seat_id').notNull(),
  locationId: integer('location_id'),
  roleKey: text('role_key').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  activeFrom: date('active_from').defaultNow().notNull(),
  activeUntil: date('active_until'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('action_shift_roles_global_scope_unique').on(
    table.operatorId,
    table.seatId,
    table.roleKey,
    table.activeFrom,
  ).where(sql`${table.locationId} is null`),
  uniqueIndex('action_shift_roles_location_scope_unique').on(
    table.operatorId,
    table.seatId,
    table.locationId,
    table.roleKey,
    table.activeFrom,
  ).where(sql`${table.locationId} is not null`),
  foreignKey({
    name: 'action_shift_roles_operator_seat_fkey',
    columns: [table.operatorId, table.seatId],
    foreignColumns: [operatorStaffSeats.operatorId, operatorStaffSeats.id],
  }).onDelete('cascade'),
  index('action_shift_roles_operator_seat_idx').on(table.operatorId, table.seatId, table.activeUntil),
  index('action_shift_roles_operator_location_role_idx').on(table.operatorId, table.locationId, table.roleKey),
]);

export const actionShiftIdentityLinks = pgTable('action_shift_identity_links', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  operatorId: integer('operator_id').notNull(),
  seatId: uuid('seat_id').notNull(),
  systemKind: text('system_kind').notNull(),
  providerKey: text('provider_key').notNull(),
  externalWorkerId: text('external_worker_id').notNull(),
  externalLocationId: text('external_location_id'),
  active: boolean('active').default(true).notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('action_shift_identity_external_unique').on(
    table.operatorId,
    table.providerKey,
    table.externalWorkerId,
  ),
  foreignKey({
    name: 'action_shift_identity_operator_seat_fkey',
    columns: [table.operatorId, table.seatId],
    foreignColumns: [operatorStaffSeats.operatorId, operatorStaffSeats.id],
  }).onDelete('cascade'),
  index('action_shift_identity_seat_idx').on(table.operatorId, table.seatId, table.active),
]);

export const actionShiftScheduleShifts = pgTable('action_shift_schedule_shifts', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  operatorId: integer('operator_id').notNull(),
  locationId: integer('location_id').notNull(),
  seatId: uuid('seat_id'),
  providerKey: text('provider_key').notNull(),
  externalShiftId: text('external_shift_id').notNull(),
  externalWorkerId: text('external_worker_id'),
  positionName: text('position_name'),
  businessDate: date('business_date').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  matchStatus: text('match_status').default('unmatched').notNull(),
  matchReason: text('match_reason'),
  status: text('status').default('scheduled').notNull(),
  sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
  importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
}, (table) => [
  uniqueIndex('action_shift_schedule_external_unique').on(
    table.operatorId,
    table.providerKey,
    table.externalShiftId,
  ),
  uniqueIndex('action_shift_schedule_operator_id_id_unique').on(table.operatorId, table.id),
  foreignKey({
    name: 'action_shift_schedule_operator_seat_fkey',
    columns: [table.operatorId, table.seatId],
    foreignColumns: [operatorStaffSeats.operatorId, operatorStaffSeats.id],
  }).onDelete('restrict'),
  index('action_shift_schedule_location_start_idx').on(table.operatorId, table.locationId, table.startsAt),
  index('action_shift_schedule_seat_start_idx').on(table.operatorId, table.seatId, table.startsAt),
]);

export const actionShiftChecklistTemplates = pgTable('action_shift_checklist_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  operatorId: integer('operator_id').notNull(),
  locationId: integer('location_id'),
  roleKey: text('role_key'),
  name: text('name').notNull(),
  shiftPhase: text('shift_phase').notNull(),
  version: integer('version').default(1).notNull(),
  status: text('status').default('draft').notNull(),
  effectiveFrom: date('effective_from'),
  effectiveUntil: date('effective_until'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('action_shift_templates_operator_id_id_unique').on(table.operatorId, table.id),
  index('action_shift_templates_scope_idx').on(
    table.operatorId,
    table.locationId,
    table.roleKey,
    table.status,
  ),
]);

export const actionShiftChecklistSteps = pgTable('action_shift_checklist_steps', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  operatorId: integer('operator_id').notNull(),
  templateId: uuid('template_id').notNull(),
  stepOrder: integer('step_order').notNull(),
  instruction: text('instruction').notNull(),
  evidenceType: text('evidence_type').default('attestation').notNull(),
  isRequired: boolean('is_required').default(true).notNull(),
  escalationMinutes: integer('escalation_minutes'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('action_shift_steps_order_unique').on(table.templateId, table.stepOrder),
  uniqueIndex('action_shift_steps_operator_id_id_unique').on(table.operatorId, table.id),
  foreignKey({
    name: 'action_shift_steps_operator_template_fkey',
    columns: [table.operatorId, table.templateId],
    foreignColumns: [actionShiftChecklistTemplates.operatorId, actionShiftChecklistTemplates.id],
  }).onDelete('cascade'),
  index('action_shift_steps_operator_template_idx').on(table.operatorId, table.templateId, table.stepOrder),
]);

export const actionShiftChecklistRuns = pgTable('action_shift_checklist_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  operatorId: integer('operator_id').notNull(),
  locationId: integer('location_id').notNull(),
  templateId: uuid('template_id').notNull(),
  assignedSeatId: uuid('assigned_seat_id'),
  scheduleShiftId: bigint('schedule_shift_id', { mode: 'number' }),
  runKey: text('run_key').notNull(),
  businessDate: date('business_date').notNull(),
  status: text('status').default('assigned').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('action_shift_runs_key_unique').on(table.operatorId, table.runKey),
  uniqueIndex('action_shift_runs_operator_id_id_unique').on(table.operatorId, table.id),
  foreignKey({
    name: 'action_shift_runs_operator_template_fkey',
    columns: [table.operatorId, table.templateId],
    foreignColumns: [actionShiftChecklistTemplates.operatorId, actionShiftChecklistTemplates.id],
  }).onDelete('restrict'),
  foreignKey({
    name: 'action_shift_runs_operator_seat_fkey',
    columns: [table.operatorId, table.assignedSeatId],
    foreignColumns: [operatorStaffSeats.operatorId, operatorStaffSeats.id],
  }).onDelete('restrict'),
  foreignKey({
    name: 'action_shift_runs_operator_schedule_fkey',
    columns: [table.operatorId, table.scheduleShiftId],
    foreignColumns: [actionShiftScheduleShifts.operatorId, actionShiftScheduleShifts.id],
  }).onDelete('restrict'),
  index('action_shift_runs_location_date_idx').on(
    table.operatorId,
    table.locationId,
    table.businessDate,
    table.status,
  ),
  index('action_shift_runs_seat_due_idx').on(table.operatorId, table.assignedSeatId, table.dueAt),
  index('action_shift_runs_template_idx').on(table.templateId),
  index('action_shift_runs_schedule_idx').on(table.scheduleShiftId),
]);

export const actionShiftStepReceipts = pgTable('action_shift_step_receipts', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  operatorId: integer('operator_id').notNull(),
  runId: uuid('run_id').notNull(),
  stepId: bigint('step_id', { mode: 'number' }).notNull(),
  actorSeatId: uuid('actor_seat_id'),
  status: text('status').default('complete').notNull(),
  evidenceUri: text('evidence_uri'),
  valueText: text('value_text'),
  notes: text('notes'),
  observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow().notNull(),
  verifiedBySeatId: uuid('verified_by_seat_id'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('action_shift_receipts_run_step_unique').on(table.runId, table.stepId),
  foreignKey({
    name: 'action_shift_receipts_operator_run_fkey',
    columns: [table.operatorId, table.runId],
    foreignColumns: [actionShiftChecklistRuns.operatorId, actionShiftChecklistRuns.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'action_shift_receipts_operator_step_fkey',
    columns: [table.operatorId, table.stepId],
    foreignColumns: [actionShiftChecklistSteps.operatorId, actionShiftChecklistSteps.id],
  }).onDelete('restrict'),
  foreignKey({
    name: 'action_shift_receipts_operator_actor_fkey',
    columns: [table.operatorId, table.actorSeatId],
    foreignColumns: [operatorStaffSeats.operatorId, operatorStaffSeats.id],
  }).onDelete('restrict'),
  foreignKey({
    name: 'action_shift_receipts_operator_verifier_fkey',
    columns: [table.operatorId, table.verifiedBySeatId],
    foreignColumns: [operatorStaffSeats.operatorId, operatorStaffSeats.id],
  }).onDelete('restrict'),
  index('action_shift_receipts_run_idx').on(table.operatorId, table.runId),
  index('action_shift_receipts_step_idx').on(table.stepId),
  index('action_shift_receipts_actor_idx').on(table.actorSeatId),
  index('action_shift_receipts_verifier_idx').on(table.verifiedBySeatId),
]);

export const actionShiftFeedback = pgTable('action_shift_feedback', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  operatorId: integer('operator_id').notNull(),
  locationId: integer('location_id'),
  runId: uuid('run_id'),
  actorSeatId: uuid('actor_seat_id'),
  sourceKind: text('source_kind').notNull(),
  sourceRef: text('source_ref'),
  verdict: text('verdict').notNull(),
  correction: text('correction'),
  outcome: jsonb('outcome').default({}).notNull(),
  learningStatus: text('learning_status').default('candidate').notNull(),
  reviewedBySeatId: uuid('reviewed_by_seat_id'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    name: 'action_shift_feedback_operator_run_fkey',
    columns: [table.operatorId, table.runId],
    foreignColumns: [actionShiftChecklistRuns.operatorId, actionShiftChecklistRuns.id],
  }).onDelete('restrict'),
  foreignKey({
    name: 'action_shift_feedback_operator_actor_fkey',
    columns: [table.operatorId, table.actorSeatId],
    foreignColumns: [operatorStaffSeats.operatorId, operatorStaffSeats.id],
  }).onDelete('restrict'),
  foreignKey({
    name: 'action_shift_feedback_operator_reviewer_fkey',
    columns: [table.operatorId, table.reviewedBySeatId],
    foreignColumns: [operatorStaffSeats.operatorId, operatorStaffSeats.id],
  }).onDelete('restrict'),
  index('action_shift_feedback_review_idx').on(table.operatorId, table.learningStatus, table.createdAt),
  index('action_shift_feedback_run_idx').on(table.runId),
  index('action_shift_feedback_actor_idx').on(table.actorSeatId),
  index('action_shift_feedback_reviewer_idx').on(table.reviewedBySeatId),
]);

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
export type OperatorStaffSeat = typeof operatorStaffSeats.$inferSelect;
export type InsertOperatorStaffSeat = typeof operatorStaffSeats.$inferInsert;
export type ActionShiftRoleAssignment = typeof actionShiftRoleAssignments.$inferSelect;
export type InsertActionShiftRoleAssignment = typeof actionShiftRoleAssignments.$inferInsert;
export type ActionShiftIdentityLink = typeof actionShiftIdentityLinks.$inferSelect;
export type InsertActionShiftIdentityLink = typeof actionShiftIdentityLinks.$inferInsert;
export type ActionShiftScheduleShift = typeof actionShiftScheduleShifts.$inferSelect;
export type InsertActionShiftScheduleShift = typeof actionShiftScheduleShifts.$inferInsert;
export type ActionShiftChecklistTemplate = typeof actionShiftChecklistTemplates.$inferSelect;
export type InsertActionShiftChecklistTemplate = typeof actionShiftChecklistTemplates.$inferInsert;
export type ActionShiftChecklistStep = typeof actionShiftChecklistSteps.$inferSelect;
export type InsertActionShiftChecklistStep = typeof actionShiftChecklistSteps.$inferInsert;
export type ActionShiftChecklistRun = typeof actionShiftChecklistRuns.$inferSelect;
export type InsertActionShiftChecklistRun = typeof actionShiftChecklistRuns.$inferInsert;
export type ActionShiftStepReceipt = typeof actionShiftStepReceipts.$inferSelect;
export type InsertActionShiftStepReceipt = typeof actionShiftStepReceipts.$inferInsert;
export type ActionShiftFeedback = typeof actionShiftFeedback.$inferSelect;
export type InsertActionShiftFeedback = typeof actionShiftFeedback.$inferInsert;

// ── Free seat (Neon) — Monday gate without Supabase ──
// Lives on primary DATABASE_URL. Supabase OPS stays for Toast/CTAP data later.
// IDs start at 1_000_000 so they never collide with legacy OPS operator_users ids.

export const seatActivationTokens = pgTable('seat_activation_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  restaurantName: text('restaurant_name').notNull(),
  operatorName: text('operator_name'),
  tokenHash: text('token_hash').notNull().unique(),
  sourcePage: text('source_page'),
  consentAt: timestamp('consent_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),
  consumedOperatorId: integer('consumed_operator_id'),
  requestIp: text('request_ip'),
  userAgent: text('user_agent'),
});

export const seatOperators = pgTable('seat_operators', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  restaurantName: text('restaurant_name').notNull(),
  sourcePage: text('source_page'),
  consentAt: timestamp('consent_at').defaultNow().notNull(),
  activatedAt: timestamp('activated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const seatLocations = pgTable('seat_locations', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('seat_locations_one_free_store_idx').on(table.operatorId),
]);

export const seatCredentials = pgTable('seat_credentials', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  // Null until the operator sets their own password. Activation writes an
  // unusable random placeholder here, so this column is what actually gates
  // "email+password" sign-in vs. always falling back to a fresh email link.
  passwordSetAt: timestamp('password_set_at'),
});

export const seatAuthAttempts = pgTable('seat_auth_attempts', {
  id: serial('id').primaryKey(),
  kind: text('kind').notNull(),
  email: text('email'),
  requestIp: text('request_ip'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const seatIntakeEvents = pgTable('seat_intake_events', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  locationId: integer('location_id').notNull(),
  channel: text('channel').notNull(),
  sourceFilename: text('source_filename'),
  sourceFrom: text('source_from'),
  reportFamily: text('report_family'),
  businessDate: date('business_date'),
  payload: jsonb('payload').default({}).notNull(),
  injectionSuspected: boolean('injection_suspected').default(false).notNull(),
  rejectedReason: text('rejected_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const seatCloses = pgTable('seat_closes', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  locationId: integer('location_id').notNull(),
  businessDate: date('business_date').notNull(),
  desk: jsonb('desk').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('seat_closes_operator_location_date_idx').on(
    table.operatorId,
    table.locationId,
    table.businessDate,
  ),
]);

export const seatProofs = pgTable('seat_proofs', {
  id: serial('id').primaryKey(),
  operatorId: integer('operator_id').notNull(),
  closeId: integer('close_id').notNull(),
  actionId: text('action_id').notNull(),
  outcome: text('outcome').notNull(),
  proofKind: text('proof_kind').notNull(),
  proofNote: text('proof_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SeatActivationToken = typeof seatActivationTokens.$inferSelect;
export type SeatOperator = typeof seatOperators.$inferSelect;
export type SeatLocation = typeof seatLocations.$inferSelect;
export type SeatCredential = typeof seatCredentials.$inferSelect;
export type SeatIntakeEvent = typeof seatIntakeEvents.$inferSelect;
export type SeatClose = typeof seatCloses.$inferSelect;
export type SeatProof = typeof seatProofs.$inferSelect;

// ── Simple Owner Demo (Neon = D1 equivalent in this repo) ──
// Drafted schema. Live apply stays a human gate. Routes ensure-if-missing only.

export const simpleOwnerUploads = pgTable('simple_owner_uploads', {
  id: text('id').primaryKey(),
  operatorId: text('operator_id').notNull(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  byteLength: integer('byte_length').notNull(),
  evidenceKind: text('evidence_kind').notNull(),
  sourceTags: jsonb('source_tags').$type<{ tag: string; source: string }[]>().default([]).notNull(),
  objectKey: text('object_key').notNull(),
  storageBackend: text('storage_backend').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('simple_owner_uploads_operator_idx').on(table.operatorId),
]);

export const simpleOwnerAsks = pgTable('simple_owner_asks', {
  id: text('id').primaryKey(),
  operatorId: text('operator_id').notNull(),
  question: text('question').notNull(),
  tray: text('tray').notNull(),
  mouth: text('mouth').notNull(),
  slug: text('slug'),
  headline: text('headline').notNull(),
  facts: jsonb('facts').$type<string[]>().default([]).notNull(),
  coachTomorrow: text('coach_tomorrow').notNull(),
  needs: text('needs').notNull(),
  sourceTags: jsonb('source_tags').$type<{ tag: string; source: string }[]>().default([]).notNull(),
  inventedClose: boolean('invented_close').default(false).notNull(),
  sampleDollars: text('sample_dollars').default('none-verified').notNull(),
  verifiedClose: boolean('verified_close').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('simple_owner_asks_operator_idx').on(table.operatorId),
]);

export const simpleOwnerBlobs = pgTable('simple_owner_blobs', {
  objectKey: text('object_key').primaryKey(),
  operatorId: text('operator_id').notNull(),
  contentType: text('content_type').notNull(),
  payloadB64: text('payload_b64').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SimpleOwnerUpload = typeof simpleOwnerUploads.$inferSelect;
export type SimpleOwnerAsk = typeof simpleOwnerAsks.$inferSelect;
export type SimpleOwnerBlob = typeof simpleOwnerBlobs.$inferSelect;
