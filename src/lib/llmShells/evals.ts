import { buildActionShift } from '../actionShift';
import { planActionShiftWorkforce } from '../actionShiftWorkforce';
import { MCP_PUBLIC_TOOL_NAMES } from '../mcpPublicContract';
import { FORBIDDEN_LIVE_WRITES, getNever86SkillPack } from './skillPack';
import {
  FORBIDDEN_EVIDENCE_CLAIMS,
  SYNTHETIC_MANAGER_CLOSE,
  SYNTHETIC_MISSING_LABOR,
  SYNTHETIC_SIDE_EFFECT_PROMPTS,
  SYNTHETIC_TENANTS,
} from './evalFixtures';
import { LLM_SHELL_PROVIDERS, getLlmShell, type LlmShellProvider } from './providers';

export type ShellRequestedAction = 'read' | 'draft' | 'send' | 'post' | 'refund' | 'cross-tenant-read';

export type ShellPolicyInput = {
  provider: LlmShellProvider;
  actingTenantId: number;
  requestedTenantId?: number;
  requestedAction: ShellRequestedAction;
  userSaidYesWithoutProof?: boolean;
  proofAttached?: boolean;
  overdueUnverified?: boolean;
};

export type ShellPolicyDecision = {
  provider: LlmShellProvider;
  skillPackVersion: string;
  allowedTools: readonly string[];
  tenantAllowed: boolean;
  sideEffect: 'none' | 'draft-only' | 'blocked';
  actionState: 'open' | 'acknowledged' | 'verified' | 'data-missing' | 'escalated';
  escalateTo: 'manager-seat' | null;
  evidenceLanguage: 'Unverified' | 'Missing Evidence' | 'Verified' | null;
  inventedFacts: false;
};

export function applyShellPolicy(input: ShellPolicyInput): ShellPolicyDecision {
  const shell = getLlmShell(input.provider);
  const crossTenant = input.requestedTenantId !== undefined && input.requestedTenantId !== input.actingTenantId;
  const liveWrite = input.requestedAction === 'send' || input.requestedAction === 'post' || input.requestedAction === 'refund';

  let sideEffect: ShellPolicyDecision['sideEffect'] = 'none';
  if (liveWrite || crossTenant) sideEffect = 'blocked';
  else if (input.requestedAction === 'draft') sideEffect = 'draft-only';

  let actionState: ShellPolicyDecision['actionState'] = 'open';
  let escalateTo: ShellPolicyDecision['escalateTo'] = null;
  let evidenceLanguage: ShellPolicyDecision['evidenceLanguage'] = 'Unverified';

  if (crossTenant) {
    actionState = 'data-missing';
    evidenceLanguage = 'Missing Evidence';
  } else if (input.proofAttached) {
    actionState = 'verified';
    evidenceLanguage = 'Verified';
  } else if (input.userSaidYesWithoutProof) {
    actionState = 'acknowledged';
    evidenceLanguage = 'Unverified';
  } else if (input.overdueUnverified) {
    actionState = 'escalated';
    escalateTo = 'manager-seat';
    evidenceLanguage = 'Missing Evidence';
  }

  return {
    provider: input.provider,
    skillPackVersion: shell.skillPackVersion,
    allowedTools: shell.mcp.tools,
    tenantAllowed: !crossTenant,
    sideEffect,
    actionState,
    escalateTo,
    evidenceLanguage,
    inventedFacts: false,
  };
}

export function evaluateTenantIsolation() {
  const alpha = SYNTHETIC_TENANTS.alpha;
  const beta = SYNTHETIC_TENANTS.beta;
  const plan = planActionShiftWorkforce({
    seats: [
      { id: alpha.seatId, operatorId: alpha.operatorId, status: 'active' },
      { id: beta.seatId, operatorId: beta.operatorId, status: 'active' },
    ],
    roleAssignments: [
      {
        operatorId: alpha.operatorId,
        seatId: alpha.seatId,
        locationId: alpha.locationId,
        roleKey: 'manager',
        activeFrom: '2026-01-01',
      },
    ],
    identityLinks: [
      {
        operatorId: alpha.operatorId,
        seatId: alpha.seatId,
        providerKey: 'synthetic-clock',
        externalWorkerId: alpha.workerId,
        active: true,
      },
    ],
    checklistTemplates: [
      {
        id: 'manager-close-alpha',
        operatorId: alpha.operatorId,
        locationId: alpha.locationId,
        roleKey: 'manager',
        status: 'active',
      },
      {
        id: 'manager-close-beta',
        operatorId: beta.operatorId,
        locationId: beta.locationId,
        roleKey: 'manager',
        status: 'active',
      },
    ],
    shifts: [
      {
        operatorId: alpha.operatorId,
        locationId: alpha.locationId,
        providerKey: 'synthetic-clock',
        externalShiftId: 'shift-alpha',
        externalWorkerId: alpha.workerId,
        startsAt: '2026-08-26T16:00:00-05:00',
        endsAt: '2026-08-26T23:00:00-05:00',
      },
      {
        operatorId: beta.operatorId,
        locationId: beta.locationId,
        providerKey: 'synthetic-clock',
        externalShiftId: 'shift-beta-steal',
        externalWorkerId: alpha.workerId,
        startsAt: '2026-08-26T16:00:00-05:00',
        endsAt: '2026-08-26T23:00:00-05:00',
      },
    ],
  });

  const shellDecisions = LLM_SHELL_PROVIDERS.map((provider) => applyShellPolicy({
    provider,
    actingTenantId: alpha.operatorId,
    requestedTenantId: beta.operatorId,
    requestedAction: 'cross-tenant-read',
  }));

  return { plan, shellDecisions };
}

export function evaluateManagerProofEscalation() {
  const shift = buildActionShift(SYNTHETIC_MANAGER_CLOSE);
  const verbal = applyShellPolicy({
    provider: 'chatgpt',
    actingTenantId: SYNTHETIC_TENANTS.alpha.operatorId,
    requestedAction: 'read',
    userSaidYesWithoutProof: true,
    proofAttached: false,
  });
  const overdue = applyShellPolicy({
    provider: 'claude',
    actingTenantId: SYNTHETIC_TENANTS.alpha.operatorId,
    requestedAction: 'read',
    overdueUnverified: true,
  });
  const proven = applyShellPolicy({
    provider: 'grok',
    actingTenantId: SYNTHETIC_TENANTS.alpha.operatorId,
    requestedAction: 'read',
    proofAttached: true,
  });
  return { shift, verbal, overdue, proven };
}

export function evaluateEvidenceLanguage() {
  const missingTarget = buildActionShift(SYNTHETIC_MISSING_LABOR);
  const pack = getNever86SkillPack();
  return { missingTarget, pack, forbiddenClaims: FORBIDDEN_EVIDENCE_CLAIMS };
}

export function evaluateNoSideEffectSafety() {
  return SYNTHETIC_SIDE_EFFECT_PROMPTS.map((prompt) => ({
    prompt,
    decision: applyShellPolicy({
      provider: 'gemini',
      actingTenantId: SYNTHETIC_TENANTS.alpha.operatorId,
      requestedAction: prompt.requestedAction,
    }),
    forbiddenLiveWrites: FORBIDDEN_LIVE_WRITES,
    allowedTools: MCP_PUBLIC_TOOL_NAMES,
  }));
}

export function evaluateProviderShellParity() {
  const shells = LLM_SHELL_PROVIDERS.map((provider) => getLlmShell(provider));
  const decisions = LLM_SHELL_PROVIDERS.map((provider) => applyShellPolicy({
    provider,
    actingTenantId: SYNTHETIC_TENANTS.alpha.operatorId,
    requestedAction: 'draft',
  }));
  return { shells, decisions };
}
