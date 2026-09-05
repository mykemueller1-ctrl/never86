/**
 * Canonical one-agent-one-job registry.
 * Supervisor routes. Specialists compute nothing the live MCP does not already own.
 */

import {
  MCP_PUBLIC_ENDPOINT,
  ORCHESTRATION_NEVER,
  ORCHESTRATION_VERSION,
  SPECIALIST_IDS,
  SUPERVISOR_ID,
  type OrchestrationSeat,
  type OrchestrationSeatId,
  type SpecialistId,
} from './types';

export const SUPERVISOR_SEAT: OrchestrationSeat = {
  id: SUPERVISOR_ID,
  role: 'supervisor',
  name: 'Supervisor',
  job: 'Route one operator intent to exactly one specialist. Never compute dollars.',
  ownsStages: ['capture', 'truth-gate', 'assign'],
  publicTools: [
    'get_operator_system',
    'list_agent_jobs',
    'list_specialists',
    'get_operator_logic',
    'get_3p_audit_logic',
  ],
  logicDomains: ['evidence', 'safety', 'action-shift'],
  resourceUri: 'never86://specialist/supervisor',
  promptUri: 'never86://prompts/specialist_brief?specialist_id=supervisor',
  never: ORCHESTRATION_NEVER,
  evidenceNotes: [
    'Call get_operator_system first. Then list_specialists. Then one specialist tool.',
    'POS ≠ payout. Invoice ≠ COGS. No count → no food or beverage cost. Incomplete week stays Open.',
    'House-code portal /portal is the only tenant seat door. Public MCP stays read-only.',
    `Live math stays at ${MCP_PUBLIC_ENDPOINT}. Do not fork formulas into this seat.`,
  ],
};

export const SPECIALIST_SEATS: readonly OrchestrationSeat[] = [
  {
    id: 'labor',
    role: 'specialist',
    name: 'Labor',
    job: 'Reconcile schedule vs clock vs hourly sales for one store day/week; label evidence; rank ≤3 labor moves — never discipline.',
    ownsStages: ['parse', 'truth-gate', 'decide'],
    publicTools: ['get_operator_system', 'list_specialists', 'get_operator_logic', 'analyze_labor'],
    logicDomains: ['labor', 'evidence'],
    resourceUri: 'never86://specialist/labor',
    promptUri: 'never86://prompts/specialist_brief?specialist_id=labor',
    never: ORCHESTRATION_NEVER,
    evidenceNotes: [
      'Hours without sales stay Missing Evidence — not misconduct.',
      'Incomplete week stays Open. Z labor $ is wages, not hours, unless the source supplies hours.',
    ],
  },
  {
    id: 'vendor',
    role: 'specialist',
    name: 'Vendor',
    job: 'Surface invoice price drift and vendor silence from operator-provided files; never convert an invoice into COGS without a count.',
    ownsStages: ['parse', 'truth-gate', 'decide'],
    publicTools: [
      'get_operator_system',
      'list_specialists',
      'get_operator_logic',
      'analyze_vendor_prices',
      'analyze_beverage',
      'analyze_recipe_cost',
      'convert_uom',
      'ask_pour_standards',
      'declare_pour_standards',
      'ask_fountain_standards',
    ],
    logicDomains: ['vendor-drift', 'invoices-daily-prime', 'beverage', 'recipe-cost', 'uom-cost', 'evidence'],
    resourceUri: 'never86://specialist/vendor',
    promptUri: 'never86://prompts/specialist_brief?specialist_id=vendor',
    never: ORCHESTRATION_NEVER,
    evidenceNotes: [
      'Invoice ≠ COGS. No count → no food or beverage cost claim.',
      'Quiet vendor is follow-up, not a missed truck.',
      'Ask this unit’s pour and pack size. Never assume 1.5 / 1.75 / 2.',
    ],
  },
  {
    id: 'voids',
    role: 'specialist',
    name: 'Voids',
    job: 'Flag void and comp patterns versus this store’s own peer band — pattern, not verdict.',
    ownsStages: ['parse', 'truth-gate'],
    publicTools: ['get_operator_system', 'list_specialists', 'get_operator_logic', 'list_free_agents'],
    logicDomains: ['evidence'],
    resourceUri: 'never86://specialist/voids',
    promptUri: 'never86://prompts/specialist_brief?specialist_id=voids',
    never: ORCHESTRATION_NEVER,
    evidenceNotes: [
      'Peer median is this store’s own band, not an industry benchmark.',
      'A name above the band is a 5-minute review lead. It is not theft.',
      'CSV product surface remains /agents/void-hunter. This seat does not invent dollars.',
    ],
  },
  {
    id: 'action-shift',
    role: 'specialist',
    name: 'Action Shift',
    job: 'Turn yesterday into one action with an owner and night proof. ≤3 ranked; usually 1.',
    ownsStages: ['decide', 'assign', 'approve', 'prove'],
    publicTools: ['get_operator_system', 'list_specialists', 'get_operator_logic', 'build_action_shift'],
    logicDomains: ['action-shift', 'evidence'],
    resourceUri: 'never86://specialist/action-shift',
    promptUri: 'never86://prompts/specialist_brief?specialist_id=action-shift',
    never: ORCHESTRATION_NEVER,
    evidenceNotes: [
      'Prior complete business day only. Incomplete current day stays Open.',
      'Verbal yes acknowledges. It does not close. Named proof closes.',
      'LLM ranks. Human sends.',
    ],
  },
  {
    id: 'memory',
    role: 'specialist',
    name: 'Memory',
    job: 'Propose and version human-approved, source-tagged store rules forever. A model guess is not memory.',
    ownsStages: ['learn'],
    publicTools: ['get_operator_system', 'list_specialists'],
    logicDomains: ['evidence'],
    resourceUri: 'never86://specialist/memory',
    promptUri: 'never86://prompts/specialist_brief?specialist_id=memory',
    never: ORCHESTRATION_NEVER,
    evidenceNotes: [
      'Tenant key is operator_id. Never promote one store into a universal rule.',
      'Every atom needs a source tag and a human approver. Nothing is deleted — only superseded.',
      'Allowed types stay the public operator-system memory list.',
    ],
  },
] as const;

export const ORCHESTRATION_SEATS: readonly OrchestrationSeat[] = [SUPERVISOR_SEAT, ...SPECIALIST_SEATS];

/** Old MCP / store-team IDs → new seats. Killed IDs resolve to null. */
export const SEAT_ALIASES: Readonly<Record<string, OrchestrationSeatId | null>> = {
  supervisor: 'supervisor',
  labor: 'labor',
  vendor: 'vendor',
  voids: 'voids',
  'action-shift': 'action-shift',
  memory: 'memory',
  'store-chief-of-staff': 'supervisor',
  'source-collector': 'supervisor',
  'margin-analyst': 'supervisor',
  'operator-coach': 'action-shift',
  'proof-verifier': 'action-shift',
  'memory-curator': 'memory',
  beverage: 'vendor',
  'food-invoice': 'vendor',
  'recipe-cost': 'vendor',
  'human-coach': 'action-shift',
  'truth-qa': 'supervisor',
  'design-qa': null,
};

export function listOrchestrationSeats(): OrchestrationSeat[] {
  return ORCHESTRATION_SEATS.map((seat) => ({ ...seat }));
}

export function listSpecialistSeats(): OrchestrationSeat[] {
  return SPECIALIST_SEATS.map((seat) => ({ ...seat }));
}

export function getOrchestrationSeat(id: string): OrchestrationSeat | null {
  const key = id.trim().toLowerCase();
  if (!(key in SEAT_ALIASES)) {
    return ORCHESTRATION_SEATS.find((seat) => seat.id === key) ?? null;
  }
  const resolved = SEAT_ALIASES[key];
  if (!resolved) return null;
  return ORCHESTRATION_SEATS.find((seat) => seat.id === resolved) ?? null;
}

export function resolveSpecialistId(id: string): SpecialistId | null {
  const seat = getOrchestrationSeat(id);
  if (!seat || seat.role !== 'specialist') return null;
  return seat.id as SpecialistId;
}

export function isSpecialistId(id: string): id is SpecialistId {
  return (SPECIALIST_IDS as readonly string[]).includes(id);
}

export function orchestrationRule(): string {
  return [
    `Never86 orchestration ${ORCHESTRATION_VERSION}: one supervisor routes to labor, vendor, voids, action-shift, or memory.`,
    'One agent · one job. Tenant-scoped by operator_id. Source-tagged memory persists forever.',
    'Email /onboard is the free owner-seat door. House-code /portal stays fail-closed. Live math stays on https://www.never86.ai/api/mcp.',
    'Do not rely on a wandering mega-agent or separate business logic in each LLM.',
  ].join(' ');
}

export function specialistBriefPrompt(id: string): string | null {
  const pack = getOrchestrationSeat(id);
  if (!pack) return null;
  return [
    `You are the Never86'd ${pack.name} ${pack.role}.`,
    `ONE JOB: ${pack.job}`,
    `Owns loop stages: ${pack.ownsStages.join(' → ')}.`,
    `Call get_operator_system first, then list_specialists, then only these tools: ${pack.publicTools.join(', ')}.`,
    `Logic domains: ${pack.logicDomains.join(', ')}.`,
    `NEVER: ${pack.never.join('; ')}.`,
    'Evidence notes:',
    ...pack.evidenceNotes.map((note) => `- ${note}`),
    'Speak as one coach when surfacing to the operator. Specialists stay backstage.',
    'Label Verified / Reconciled / Partial / Estimated / Unverified / Missing Evidence. Missing Evidence is not $0.',
    'Do not fork Action Shift, 3P, vendor silence, or labor formulas into this prompt.',
  ].join('\n');
}
