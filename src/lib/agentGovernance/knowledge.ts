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
import {
  getSpecialist,
  listSpecialists,
  specialistBriefPrompt,
  type SpecialistPack,
} from './specialists';

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

export function handleListSpecialists() {
  return {
    discovery: 'get_operator_system → list_agent_jobs → list_specialists → domain tools',
    orchestration: orchestrationRule(),
    specialists: listSpecialists().map((pack) => ({
      id: pack.id,
      name: pack.name,
      job: pack.job,
      seats: pack.seats,
      ownsStages: pack.ownsStages,
      logicDomains: pack.logicDomains,
      publicTools: pack.publicTools,
      resourceUri: pack.resourceUri,
      promptUri: pack.promptUri,
      never: pack.never,
    })),
  };
}

export function handleGetSpecialist(idRaw?: unknown) {
  if (typeof idRaw !== 'string' || !idRaw.trim()) {
    return {
      ok: false as const,
      error: 'Pass specialist_id (labor, beverage, food-invoice, human-coach, design-qa, truth-qa).',
    };
  }
  const pack = getSpecialist(idRaw.trim());
  if (!pack) return { ok: false as const, error: `Unknown specialist "${idRaw}".` };
  return { ok: true as const, specialist: pack as SpecialistPack, brief: specialistBriefPrompt(pack.id) };
}

export const MCP_RESOURCES = [
  {
    uri: 'never86://operator-system',
    name: 'Never86 operator system',
    description: 'Versioned public operator OS pack. Same payload as get_operator_system.',
    mimeType: 'application/json',
  },
  ...listSpecialists().map((pack) => ({
    uri: pack.resourceUri,
    name: pack.name,
    description: pack.job,
    mimeType: 'application/json',
  })),
] as const;

export const MCP_PROMPTS = [
  {
    name: 'specialist_brief',
    description: 'One-agent-one-job system brief for a Never86 specialist. Args: specialist_id.',
    arguments: [
      {
        name: 'specialist_id',
        description: 'labor | beverage | food-invoice | human-coach | design-qa | truth-qa',
        required: true,
      },
    ],
  },
  {
    name: 'truth_gate_check',
    description: 'Critic instructions for unsupported claims. Args: claim (optional free text).',
    arguments: [
      {
        name: 'claim',
        description: 'Optional claim text to stress-test against truth gates.',
        required: false,
      },
    ],
  },
] as const;

export function readMcpResource(uri: string): { ok: true; text: string } | { ok: false; error: string } {
  if (uri === 'never86://operator-system') {
    return { ok: true, text: JSON.stringify(handleGetOperatorSystem(), null, 2) };
  }
  const match = /^never86:\/\/specialist\/([a-z0-9-]+)$/.exec(uri);
  if (match) {
    const pack = getSpecialist(match[1]);
    if (!pack) return { ok: false, error: `Unknown specialist resource: ${uri}` };
    return { ok: true, text: JSON.stringify(pack, null, 2) };
  }
  return { ok: false, error: `Unknown resource: ${uri}` };
}

export function getMcpPrompt(
  name: string,
  args: Record<string, unknown> = {},
): { ok: true; text: string } | { ok: false; error: string } {
  if (name === 'specialist_brief') {
    const id = typeof args.specialist_id === 'string' ? args.specialist_id : '';
    const brief = specialistBriefPrompt(id);
    if (!brief) {
      return {
        ok: false,
        error: 'Pass specialist_id: labor | beverage | food-invoice | human-coach | design-qa | truth-qa',
      };
    }
    return { ok: true, text: brief };
  }
  if (name === 'truth_gate_check') {
    const claim = typeof args.claim === 'string' ? args.claim.trim() : '';
    const critic = specialistBriefPrompt('truth-qa') ?? '';
    return {
      ok: true,
      text: [
        critic,
        claim ? `\nClaim under review:\n${claim}` : '\nNo claim provided — list blockers and required evidence only.',
        '\nReturn: pass | block | missing-evidence, with reason. Do not invent dollars.',
      ].join('\n'),
    };
  }
  return { ok: false, error: `Unknown prompt: ${name}` };
}

export const KNOWLEDGE_TOOL_NAMES = [
  'get_operator_system',
  'get_operator_logic',
  'get_3p_audit_logic',
  'list_answers',
  'list_free_agents',
  'list_agent_jobs',
  'list_specialists',
] as const;
