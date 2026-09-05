/**
 * One agent · one job. Public governance registry only.
 * Does not fork Action Shift / 3P / CSV math. No private store data.
 */

import { AGENT_SPECS, getAgentSpec } from '../agentSpecs';
import { getCompanyOrg } from '../companyOrg';
import { FREE_AGENT_SLUGS } from '../commandCenterSwarm/types';
import {
  getOrchestrationSeat,
  listOrchestrationSeats,
  orchestrationRule as v1OrchestrationRule,
} from '../orchestration';
import { NEVER86_OPERATOR_SYSTEM } from '../operatorSystem';

export type AgentTeam = 'store' | 'company' | 'free-agent';

export type AgentJob = {
  team: AgentTeam;
  id: string;
  name: string;
  job: string;
  departmentId?: string;
  /** Ordered loop stages this agent owns (subset of operator system loop). */
  ownsStages: readonly string[];
  /** Side effects this agent may never take. */
  never: readonly string[];
};

const STORE_IDS: Record<string, string> = {
  Supervisor: 'supervisor',
  Labor: 'labor',
  Vendor: 'vendor',
  Voids: 'voids',
  'Action Shift': 'action-shift',
  Memory: 'memory',
};

const STORE_STAGES: Record<string, readonly string[]> = {
  supervisor: ['capture', 'truth-gate', 'assign'],
  labor: ['parse', 'truth-gate', 'decide'],
  vendor: ['parse', 'truth-gate', 'decide'],
  voids: ['parse', 'truth-gate'],
  'action-shift': ['decide', 'assign', 'approve', 'prove'],
  memory: ['learn'],
};

const NEVER_SEND = [
  'auto-mail',
  'auto-post',
  'portal-login',
  'theft-allegation',
  'guaranteed-recovery',
] as const;

function storeJobs(): AgentJob[] {
  return listOrchestrationSeats().map((seat) => ({
    team: 'store' as const,
    id: STORE_IDS[seat.name] ?? seat.id,
    name: seat.name,
    job: seat.job,
    ownsStages: STORE_STAGES[seat.id] ?? seat.ownsStages,
    never: NEVER_SEND,
  }));
}

function companyJobs(): AgentJob[] {
  return getCompanyOrg().roles.map((role) => ({
    team: 'company' as const,
    id: role.id,
    name: role.name,
    job: role.job,
    ...(role.departmentId ? { departmentId: role.departmentId } : {}),
    ownsStages: ['decide'] as const,
    never: NEVER_SEND,
  }));
}

function freeAgentJobs(): AgentJob[] {
  return FREE_AGENT_SLUGS.map((slug) => {
    const spec = getAgentSpec(slug) ?? AGENT_SPECS.find((row) => row.slug === slug);
    return {
      team: 'free-agent' as const,
      id: slug,
      name: spec?.name ?? slug,
      job: spec?.headline ?? 'CSV leak hunter — patterns for review, not verdicts.',
      ownsStages: ['parse', 'truth-gate'] as const,
      never: NEVER_SEND,
    };
  });
}

export function listAgentJobs(team: AgentTeam | 'all' = 'all'): AgentJob[] {
  const all = [...storeJobs(), ...companyJobs(), ...freeAgentJobs()];
  if (team === 'all') return all;
  return all.filter((row) => row.team === team);
}

export function getAgentJob(id: string): AgentJob | null {
  const exact = listAgentJobs('all').find((row) => row.id === id);
  if (exact) return exact;
  const aliased = getOrchestrationSeat(id);
  if (!aliased) return null;
  return listAgentJobs('all').find((row) => row.id === aliased.id) ?? null;
}

export function orchestrationRule(): string {
  return v1OrchestrationRule();
}

export function governanceLoop(): readonly { stage: string; rule: string }[] {
  return NEVER86_OPERATOR_SYSTEM.loop;
}
