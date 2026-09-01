import { z } from "zod";

export const viewSchema = z.enum([
  "action_shift",
  "vendor_drift",
  "item_trace",
  "inventory_risk",
]);

export type OperatorView = z.infer<typeof viewSchema>;

export const metricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  status: z.enum(["good", "watch", "risk", "neutral"]),
  detail: z.string().min(1),
});

export const evidenceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  source: z.string().min(1),
  detail: z.string().min(1),
  status: z.enum(["verified", "needs_review"]),
});

export const leakSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  summary: z.string().min(1),
  dollarImpact: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const actionSchema = z.object({
  title: z.string().min(1),
  ownerRole: z.string().min(1),
  due: z.string().min(1),
  proofRequired: z.string().min(1),
  why: z.string().min(1),
});

export const tableRowSchema = z.object({
  label: z.string().min(1),
  current: z.string().min(1),
  baseline: z.string().min(1),
  variance: z.string().min(1),
  status: z.enum(["good", "watch", "risk", "neutral"]),
});

export const operatorSnapshotSchema = z.object({
  view: viewSchema,
  stateVersion: z.number().int().min(1),
  isDemo: z.boolean(),
  locationAlias: z.string().min(1),
  businessDate: z.string().min(1),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  metrics: z.array(metricSchema).max(4),
  leak: leakSchema,
  action: actionSchema,
  evidence: z.array(evidenceSchema).max(6),
  rows: z.array(tableRowSchema).max(8),
  promptSuggestion: z.string().min(1),
});

export type OperatorSnapshot = z.infer<typeof operatorSnapshotSchema>;

export const snapshotOutputSchema = {
  snapshot: operatorSnapshotSchema,
};

export const renderInputSchema = {
  snapshot: operatorSnapshotSchema,
};
