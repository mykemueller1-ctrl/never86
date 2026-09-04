/**
 * Specialist packs — one agent · one job.
 * Discovery only: which tools/domains to call. No formula forks.
 */

export type SpecialistId =
  | 'labor'
  | 'beverage'
  | 'food-invoice'
  | 'recipe-cost'
  | 'human-coach'
  | 'design-qa'
  | 'truth-qa';

export type SpecialistPack = {
  id: SpecialistId;
  name: string;
  job: string;
  /** Registry seat ids this specialist routes through. */
  seats: readonly string[];
  ownsStages: readonly string[];
  logicDomains: readonly string[];
  publicTools: readonly string[];
  promptUri: string;
  resourceUri: string;
  never: readonly string[];
  evidenceNotes: readonly string[];
};

export const SPECIALIST_NEVER = [
  'auto-mail',
  'auto-post',
  'portal-login',
  'theft-allegation',
  'guaranteed-recovery',
  'forked-business-logic',
] as const;

export const SPECIALIST_PACKS: readonly SpecialistPack[] = [
  {
    id: 'labor',
    name: 'Labor · Prime Cost Coach',
    job: 'Reconcile schedule vs clock vs hourly sales for one store day/week; label evidence; rank ≤3 labor moves — never discipline.',
    seats: ['source-collector', 'margin-analyst', 'store-chief-of-staff', 'operator-coach', 'proof-verifier'],
    ownsStages: ['capture', 'parse', 'truth-gate', 'decide', 'assign', 'prove'],
    logicDomains: ['labor', 'action-shift', 'evidence'],
    publicTools: [
      'get_operator_system',
      'list_agent_jobs',
      'get_operator_logic',
      'analyze_labor',
      'build_action_shift',
      'list_answers',
    ],
    promptUri: 'never86://prompts/specialist_brief?specialist_id=labor',
    resourceUri: 'never86://specialist/labor',
    never: SPECIALIST_NEVER,
    evidenceNotes: [
      'Schedule + time clock + hourly sales unlock Prime Cost Coach.',
      'Hours without sales stay Missing Evidence — not misconduct.',
      'Incomplete week stays Open. Z labor $ is wages, not hours, unless the source supplies hours.',
      'Research grounding: just-in-time real-time scheduling can cut productivity (~4.4% in Kamalahmadi/Yu/Zhou Management Science); prefer schedule+sales evidence before cut advice.',
    ],
  },
  {
    id: 'beverage',
    name: 'Beverage margin',
    job: 'Compare draft/package/credits/price changes from operator-provided beverage CSV; stop when count or invoice scope is missing.',
    seats: ['source-collector', 'margin-analyst', 'operator-coach'],
    ownsStages: ['capture', 'parse', 'truth-gate', 'decide'],
    logicDomains: ['beverage', 'vendor-drift', 'uom-cost', 'pour-standards', 'evidence'],
    publicTools: [
      'get_operator_system',
      'list_agent_jobs',
      'get_operator_logic',
      'ask_pour_standards',
      'declare_pour_standards',
      'convert_uom',
      'analyze_beverage',
      'analyze_vendor_prices',
      'list_answers',
    ],
    promptUri: 'never86://prompts/specialist_brief?specialist_id=beverage',
    resourceUri: 'never86://specialist/beverage',
    never: SPECIALIST_NEVER,
    evidenceNotes: [
      'No count → no beverage cost claim.',
      'Quiet vendor is follow-up, not a missed truck.',
      'Tray: pop / beer / liquor — one category ask at a time.',
      'Ask THIS unit’s pour: shot vs mixed (1.5 / 1.75 / 2 / custom). Never assume.',
      'Fluid oz ≠ weight oz. Missing pourSpec or keg size is Missing Evidence.',
    ],
  },
  {
    id: 'food-invoice',
    name: 'Food & invoice truth',
    job: 'Surface invoice price drift and count gaps; never convert an invoice photo into COGS without a count.',
    seats: ['source-collector', 'margin-analyst', 'operator-coach'],
    ownsStages: ['capture', 'parse', 'truth-gate', 'decide'],
    logicDomains: ['invoices-daily-prime', 'vendor-drift', 'product-mix-pars', 'recipe-cost', 'evidence'],
    publicTools: [
      'get_operator_system',
      'list_agent_jobs',
      'get_operator_logic',
      'analyze_vendor_prices',
      'analyze_recipe_cost',
      'list_answers',
    ],
    promptUri: 'never86://prompts/specialist_brief?specialist_id=food-invoice',
    resourceUri: 'never86://specialist/food-invoice',
    never: SPECIALIST_NEVER,
    evidenceNotes: [
      'Invoice ≠ COGS. No count → no food cost.',
      'Price drift >5% between periods is Unverified until pack size/credits confirmed.',
    ],
  },
  {
    id: 'recipe-cost',
    name: 'Recipe · plate · UoM',
    job: 'Convert verified pack/pour/yield into plate cost and theoretical usage; refuse invented case packs or pourSpecs.',
    seats: ['source-collector', 'margin-analyst', 'operator-coach', 'proof-verifier'],
    ownsStages: ['parse', 'truth-gate', 'normalize', 'decide'],
    logicDomains: ['recipe-cost', 'uom-cost', 'pour-standards', 'forensic-pnl', 'product-mix-pars', 'evidence'],
    publicTools: [
      'get_operator_system',
      'list_agent_jobs',
      'get_operator_logic',
      'ask_pour_standards',
      'declare_pour_standards',
      'convert_uom',
      'analyze_recipe_cost',
      'list_answers',
    ],
    promptUri: 'never86://prompts/specialist_brief?specialist_id=recipe-cost',
    resourceUri: 'never86://specialist/recipe-cost',
    never: SPECIALIST_NEVER,
    evidenceNotes: [
      'EP cost = AP cost / yield. Missing yield is Missing Evidence.',
      'Drink recipes: ask house pour per unit before cost-per-pour.',
      'Contribution margin $ beats food-cost % alone for menu decisions.',
      'Prime cost needs disclosed labor basis (wages-only vs loaded).',
    ],
  },
  {
    id: 'human-coach',
    name: 'Operator coach voice',
    job: 'Speak as one Store Chief of Staff: one concept, one tribal question, ≤3 actions — specialists stay backstage.',
    seats: ['store-chief-of-staff', 'operator-coach', 'proof-verifier'],
    ownsStages: ['assign', 'approve', 'prove'],
    logicDomains: ['action-shift', 'service-drafts', 'proof-memory', 'evidence'],
    publicTools: [
      'get_operator_system',
      'list_agent_jobs',
      'get_operator_logic',
      'build_action_shift',
      'list_answers',
    ],
    promptUri: 'never86://prompts/specialist_brief?specialist_id=human-coach',
    resourceUri: 'never86://specialist/human-coach',
    never: SPECIALIST_NEVER,
    evidenceNotes: [
      '5:47am test: one next move without translating.',
      'Missing Evidence feels like a prep checklist, not shame.',
      'LLM ranks; human sends. Verbal yes does not close.',
    ],
  },
  {
    id: 'design-qa',
    name: 'Owner desk design QA',
    job: 'Check public /operator composition against phone-first Owner desk rules — no private restaurant data in critique.',
    seats: ['product-head'],
    ownsStages: ['truth-gate'],
    logicDomains: ['safety'],
    publicTools: ['get_operator_system', 'list_agent_jobs', 'list_specialists'],
    promptUri: 'never86://prompts/specialist_brief?specialist_id=design-qa',
    resourceUri: 'never86://specialist/design-qa',
    never: SPECIALIST_NEVER,
    evidenceNotes: [
      'First viewport: brand, one headline, one sentence, one CTA group, one dominant visual plane — not a dashboard.',
      'Cards only when they are the interaction. Orange #E66B27; peach unlock; mint ready.',
      'Tray: action / food / labor / pop / beer / liquor.',
    ],
  },
  {
    id: 'truth-qa',
    name: 'Truth / QA critic',
    job: 'Block unsupported math, theft language, guaranteed recovery, food-cost-without-count, and incomplete-week closes.',
    seats: ['product-head'],
    ownsStages: ['truth-gate'],
    logicDomains: ['evidence', 'safety', 'marketplace-3p', 'forensic-pnl', 'uom-cost', 'recipe-cost'],
    publicTools: [
      'get_operator_system',
      'get_operator_logic',
      'get_3p_audit_logic',
      'list_agent_jobs',
      'list_specialists',
    ],
    promptUri: 'never86://prompts/specialist_brief?specialist_id=truth-qa',
    resourceUri: 'never86://specialist/truth-qa',
    never: SPECIALIST_NEVER,
    evidenceNotes: [
      'POS ≠ payout. Invoice ≠ COGS. Incomplete week stays Open.',
      'Cannot-answer is first-class. Brand-burn rule: wrong number a customer can prove wrong ends trust.',
    ],
  },
] as const;

export function listSpecialists(): SpecialistPack[] {
  return SPECIALIST_PACKS.map((pack) => ({ ...pack }));
}

export function getSpecialist(id: string): SpecialistPack | null {
  return SPECIALIST_PACKS.find((pack) => pack.id === id) ?? null;
}

export function specialistBriefPrompt(id: string): string | null {
  const pack = getSpecialist(id);
  if (!pack) return null;
  return [
    `You are the Never86'd ${pack.name} specialist.`,
    `ONE JOB: ${pack.job}`,
    `Owns loop stages: ${pack.ownsStages.join(' → ')}.`,
    `Call get_operator_system first, then list_agent_jobs, then only these tools: ${pack.publicTools.join(', ')}.`,
    `Logic domains: ${pack.logicDomains.join(', ')}.`,
    `NEVER: ${pack.never.join('; ')}.`,
    'Evidence notes:',
    ...pack.evidenceNotes.map((note) => `- ${note}`),
    'Speak as one coach when surfacing to the operator. Specialists stay backstage.',
    'Label Verified / Reconciled / Partial / Estimated / Unverified / Missing Evidence. Missing Evidence is not $0.',
    'Do not fork Action Shift, 3P, vendor silence, or labor formulas into this prompt.',
  ].join('\n');
}
