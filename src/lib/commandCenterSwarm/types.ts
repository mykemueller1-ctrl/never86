import type { ActionShiftResult } from '../actionShift';
import type { DepartmentId } from '../companyOrg';

export const SWARM_VERSION = '1.0.0';
export const SAMPLE_STORE_ID = 'sample-store-one';
export const SAMPLE_STORE_NAME = 'Sample Store One';
export const SAMPLE_BUSINESS_DATE = '2026-08-28';

export const FREE_AGENT_SLUGS = [
  'void-hunter',
  'leak-detector',
  '3p-fee-finder',
  'labor-leak',
  'tip-variance',
  'catering-leak',
  'rate-card-audit',
  'beverage-score',
  'vendor-drift',
  'shift-pulse',
] as const;

export type FreeAgentSlug = (typeof FREE_AGENT_SLUGS)[number];

export const STORE_SPECIALIST_IDS = [
  'store-chief-of-staff',
  'source-collector',
  'margin-analyst',
  'operator-coach',
  'proof-verifier',
  'memory-curator',
] as const;

export type StoreSpecialistId = (typeof STORE_SPECIALIST_IDS)[number];

export type EvidenceState =
  | 'verified'
  | 'reconciled'
  | 'partial'
  | 'estimated'
  | 'unverified'
  | 'missingEvidence';

export type AgentRunStatus =
  | 'idle'
  | 'ran'
  | 'blocked'
  | 'missing-evidence'
  | 'injection-review'
  | 'secret-blocked'
  | 'routed';

export type SendStatus =
  | 'not-applicable'
  | 'draft-only'
  | 'blocked-pending-approval'
  | 'approved-not-sent';

export type FileDefense = {
  filename: string;
  empty: boolean;
  secret: boolean;
  secretLabel?: string;
  injectionSuspected: boolean;
  allowed: boolean;
  label: 'ok' | 'INJECTION_SUSPECTED' | 'SECRET_BLOCKED' | 'EMPTY';
  note: string;
};

export type TruthGateResult = {
  allowed: boolean;
  state: EvidenceState;
  blockedReason?: string;
  claimBoundary: string;
};

export type ExternalSendKind =
  | 'external_email_send'
  | 'social_post'
  | 'social_reply'
  | 'dm_reply'
  | 'podcast_pitch_send'
  | 'partner_outreach_send'
  | 'permissioned_case_study_publish'
  | 'recovery_or_refund_claim'
  | 'vendor_request'
  | 'operational_change';

export type ExternalSendReceipt = {
  kind: ExternalSendKind;
  draft: string;
  delivered: false;
  portalLoginUsed: false;
  status: Extract<SendStatus, 'blocked-pending-approval' | 'approved-not-sent'>;
  humanApproved: boolean;
  approver: string | null;
  note: string;
};

export type AgentRunRecord = {
  slug: string;
  name: string;
  team: 'store-specialist' | 'free-agent' | 'company';
  status: AgentRunStatus;
  lastRunAt: string | null;
  sourceStatus: EvidenceState;
  summary: string;
  rowsParsed?: number;
  injectionSuspected: boolean;
  secretBlocked: boolean;
  portalLoginRequired: false;
  sendStatus: SendStatus;
  missingEvidence: string[];
  claimBoundary?: string;
};

export type StoreSpecialistOutput = {
  id: StoreSpecialistId;
  name: string;
  job: string;
  status: AgentRunStatus;
  summary: string;
  output: Record<string, unknown>;
};

export type CompanyRoute = {
  departmentId: DepartmentId | null;
  departmentName: string;
  headId: string | null;
  roleId: string;
  roleName: string;
  reason: string;
  approvalRequired: string[];
  storePrivateAttached: false;
  nextAction: string;
};

export type SwarmReport = {
  version: typeof SWARM_VERSION;
  operatorSystem: '3.1.0';
  store: { id: string; name: string; businessDate: string };
  ranAt: string;
  loop: string[];
  fileDefenses: FileDefense[];
  freeAgents: AgentRunRecord[];
  storeTeam: StoreSpecialistOutput[];
  companyRoutes: CompanyRoute[];
  actionShift: ActionShiftResult | null;
  actionShiftError: string | null;
  pendingApprovals: ExternalSendReceipt[];
  sendsDelivered: 0;
  portalLogins: 0;
  policy: {
    csvFirst: true;
    humanApprovalRequired: true;
    verbalYesCloses: false;
    storeScoped: true;
    noPortalLogin: true;
  };
};
