/**
 * Never86 orchestration v1 — types only.
 * One supervisor. Five specialists. Tenant key is operator_id.
 * No formula forks. No live writes from this module.
 */

export const ORCHESTRATION_VERSION = '4.0.0' as const;
export const ORCHESTRATION_BRAND_BLUE = '#0066ff' as const;
export const HOUSE_CODE_SEAT_DOOR = '/portal' as const;
export const MCP_PUBLIC_ENDPOINT = 'https://www.never86.ai/api/mcp' as const;

export const SUPERVISOR_ID = 'supervisor' as const;
export const SPECIALIST_IDS = ['labor', 'vendor', 'voids', 'action-shift', 'memory'] as const;
export type SpecialistId = (typeof SPECIALIST_IDS)[number];
export type OrchestrationSeatId = typeof SUPERVISOR_ID | SpecialistId;

export const SOURCE_TAGS = [
  'verified',
  'reconciled',
  'partial',
  'estimated',
  'unverified',
  'missing-evidence',
] as const;
export type SourceTag = (typeof SOURCE_TAGS)[number];

export const LAKE_KINDS = ['source', 'memory', 'receipt', 'route'] as const;
export type LakeKind = (typeof LAKE_KINDS)[number];

export const ORCHESTRATION_NEVER = [
  'auto-mail',
  'auto-post',
  'portal-login',
  'theft-allegation',
  'guaranteed-recovery',
  'forked-business-logic',
  'cross-tenant-read',
  'delete-memory',
  'house-code-in-git',
] as const;

export type OrchestrationSeat = {
  id: OrchestrationSeatId;
  role: 'supervisor' | 'specialist';
  name: string;
  job: string;
  ownsStages: readonly string[];
  publicTools: readonly string[];
  logicDomains: readonly string[];
  resourceUri: string;
  promptUri: string;
  never: readonly string[];
  evidenceNotes: readonly string[];
};

export type RouteReceipt = {
  ok: true;
  orchestrationVersion: typeof ORCHESTRATION_VERSION;
  operatorId: number;
  specialistId: SpecialistId;
  job: string;
  reason: string;
  publicTools: readonly string[];
  never: readonly string[];
  computedDollars: false;
  portalLogin: false;
};

export type RouteFailure = {
  ok: false;
  error:
    | 'operator_id_required'
    | 'house_code_required'
    | 'unknown_intent'
    | 'tenant_mismatch';
  hint: string;
};

export type InventoryDisposition = 'keep' | 'kill' | 'replace' | 'archive' | 'freeze';

export type InventoryRow = {
  id: string;
  name: string;
  kind: 'cursor-cloud' | 'in-repo' | 'mcp' | 'automation' | 'external-repo';
  repo: string;
  purpose: string;
  status: string;
  disposition: InventoryDisposition;
  note: string;
};
