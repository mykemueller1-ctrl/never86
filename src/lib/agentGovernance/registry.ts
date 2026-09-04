/**
 * One agent · one job. Public governance registry only.
 * Does not fork Action Shift / 3P / CSV math. No private store data.
 */

import { AGENT_SPECS, getAgentSpec } from '../agentSpecs';
import { getCompanyOrg } from '../companyOrg';
import { FREE_AGENT_SLUGS } from '../commandCenterSwarm/types';
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
  'Store Chief of Staff': 'store-chief-of-staff',
  'Source Collector': 'source-collector',
  'Margin Analyst': 'margin-analyst',
  'Operator Coach': 'operator-coach',
  'Proof Verifier': 'proof-verifier',
  'Memory Curator': 'memory-curator',
};

const STORE_STAGES: Record<string, readonly string[]> = {
  'store-chief-of-staff': ['decide', 'assign'],
  'source-collector': ['capture', 'parse'],
  'margin-analyst': ['truth-gate', 'normalize', 'decide'],
  'operator-coach': ['assign'],
  'proof-verifier': ['prove'],
  'memory-curator': ['learn'],
};

const NEVER_SEND = [
  'auto-mail',
  'auto-post',
  'portal-login',
  'theft-allegation',
  'guaranteed-recovery',
] as const;

function storeJobs(): AgentJob[] {
  return NEVER86_OPERATOR_SYSTEM.agents.storeTeam.map((member) => {
    const id = STORE_IDS[member.name] ?? member.name.toLowerCase().replace(/\s+/g, '-');
    return {
      team: 'store' as const,
      id,
      name: member.name,
      job: member.job,
      ownsStages: STORE_STAGES[id] ?? [],
      never: NEVER_SEND,
    };
  });
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
  return listAgentJobs('all').find((row) => row.id === id) ?? null;
}

export function orchestrationRule(): string {
  return NEVER86_OPERATOR_SYSTEM.agents.orchestration;
}

export function governanceLoop(): readonly { stage: string; rule: string }[] {
  return NEVER86_OPERATOR_SYSTEM.loop;
}
