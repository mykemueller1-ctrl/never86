/**
 * Thin read-only knowledge handlers for public MCP.
 * Wraps existing modules. Does not fork formulas or expose private store data.
 */

import { AGENT_SPECS, getAgentSpec } from '../agentSpecs';
import { listPublishedAnswers } from '../answersDb';
import { FREE_AGENT_SLUGS } from '../commandCenterSwarm/types';
import { getCompanyOrg } from '../companyOrg';
import {
  PUBLIC_LOGIC_DOMAINS,
  getPublicOperatorLogic,
  type PublicLogicDomain,
} from '../publicOperatorLogic';
import { getOperatorSystem } from '../operatorSystem';
import { listAgentJobs, orchestrationRule, type AgentTeam } from './registry';

const WWW = 'https://www.never86.ai';

export function handleGetOperatorSystem() {
  return getOperatorSystem();
}

export function handleGetOperatorLogic(domainRaw?: unknown) {
  const domain = (typeof domainRaw === 'string' && domainRaw.trim() ? domainRaw.trim() : 'all') as PublicLogicDomain;
  if (!(PUBLIC_LOGIC_DOMAINS as readonly string[]).includes(domain)) {
    return {
      ok: false as const,
      error: `Unknown domain. Use one of: ${PUBLIC_LOGIC_DOMAINS.join(', ')}`,
    };
  }
  return { ok: true as const, domain, logic: getPublicOperatorLogic(domain) };
}

export function handleGet3pAuditLogic() {
  return {
    ok: true as const,
    domain: 'marketplace-3p' as const,
    logic: getPublicOperatorLogic('marketplace-3p'),
  };
}

export async function handleListAnswers(limitRaw?: unknown) {
  const rows = await listPublishedAnswers();
  const mapped = rows.map((answer) => ({
    slug: answer.slug,
    title: answer.title,
    question: answer.question,
    audience: answer.audience,
    url: `${WWW}/answers/${answer.slug}`,
  }));
  if (typeof limitRaw === 'number' && Number.isFinite(limitRaw) && limitRaw > 0) {
    return mapped.slice(0, Math.min(100, Math.floor(limitRaw)));
  }
  return mapped;
}

export function handleListFreeAgents() {
  return FREE_AGENT_SLUGS.map((slug) => {
    const spec = getAgentSpec(slug) ?? AGENT_SPECS.find((row) => row.slug === slug);
    return {
      slug,
      name: spec?.name ?? slug,
      audience: spec?.seat ?? null,
      headline: spec?.headline ?? null,
      catches: spec?.catches ?? [],
      sampleSignal: spec?.sampleSignal ?? null,
      posSupport: spec?.posSupport ?? null,
      landingUrl: `${WWW}/agents/${slug}`,
      demoUrl: spec?.href ? `${WWW}${spec.href}` : null,
      csvRunnable: true,
      portalLogin: false,
    };
  });
}

export function handleListAgentJobs(teamRaw?: unknown) {
  const team =
    typeof teamRaw === 'string' && ['store', 'company', 'free-agent', 'all'].includes(teamRaw)
      ? (teamRaw as AgentTeam | 'all')
      : 'all';
  return {
    orchestration: orchestrationRule(),
    companyDepartments: getCompanyOrg().departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
    })),
    jobs: listAgentJobs(team),
  };
}

export const KNOWLEDGE_TOOL_NAMES = [
  'get_operator_system',
  'get_operator_logic',
  'get_3p_audit_logic',
  'list_answers',
  'list_free_agents',
  'list_agent_jobs',
] as const;
