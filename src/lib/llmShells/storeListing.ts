import { MCP_PUBLIC_ENDPOINT, MCP_PUBLIC_TOOLS } from '../mcpPublicContract';

/** Honest directory status. Flip only after a human publisher account is accepted. */
export const STORE_DIRECTORY_STATUS = {
  chatgptPluginDirectory: 'not-submitted',
  claudeConnectorsDirectory: 'not-submitted',
  grokFeaturedCatalog: 'no-public-submit-path',
  geminiConsumerConnectors: 'partnership-only',
} as const;

export const STORE_LISTING = {
  name: "Never86'd Operator Intelligence",
  shortName: "Never 86'd",
  company: "Never 86'd Inc.",
  founder: 'Myke Mueller',
  headquarters: 'Fort Dodge, Iowa',
  category: 'Business / Productivity / Restaurant operations',
  website: 'https://www.never86.ai',
  tryUrl: 'https://www.never86.ai/llm-shells',
  mcpUrl: MCP_PUBLIC_ENDPOINT,
  supportUrl: 'https://www.never86.ai/press',
  privacyUrl: 'https://www.never86.ai/privacy',
  termsUrl: 'https://www.never86.ai/terms',
  docsUrl: 'https://www.never86.ai/mcp',
  logoSvg: 'https://www.never86.ai/brand/n86-mark.svg',
  pressEmail: 'press@never86.ai',
  operatorEmail: 'myke@n86.app',
  tagline: 'Restaurant operator intelligence inside the LLM you already use.',
  shortDescription:
    "Read-only restaurant operating math for ChatGPT, Claude, Gemini, and Grok. Action Shift, 3P cost, vendor silence, and proof gates. You send every message.",
  longDescription:
    "Never 86'd is a restaurant operating system, not a chatbot with extra prompts. Operators paste one public MCP URL, or later install from a listed directory, and get the same brain: Action Shift from last night's close, marketplace cost math, vendor silence clocks, and evidence language (Verified / Unverified / Missing Evidence). The public pack is unauthenticated and read-only. It does not log into a POS, send vendor email, issue refunds, or move money. Vendor copy stays a draft the operator reviews and sends. Restaurant formulas stay on never86.ai. ChatGPT, Claude, Gemini, and Grok are thin shells.",
  authentication: 'none-public-read-only',
  mcpUrlType: 'Universal',
  chatgptPortal: 'https://platform.openai.com/plugins',
  chatgptSubmitType: 'With MCP',
  claudePortal: 'https://claude.ai/admin-settings/directory/submissions/new',
  claudeRequires: 'Claude Team or Enterprise organization. Pro/Max cannot file.',
  grokNote:
    'Grok has no public featured-connector submit form. Operators add Custom MCP at grok.com/connectors.',
  geminiNote:
    'Gemini consumer connectors are partnership-only. Operators use a Gem plus the public MCP when the client supports it.',
} as const;

export const STORE_STARTER_PROMPTS = [
  'Use get_operator_system first. Then build one Action Shift from my last close. Stay READ-ONLY. Vendor copy is DRAFT-ONLY — I send it.',
  'Search Never86 answers for DoorDash blended rate and show the evidence ladder. Do not invent a contract rate.',
  'Run 3P marketplace cost on the numbers I type. Label every figure Unverified unless I supply the statement.',
] as const;

export const STORE_POSITIVE_TESTS = [
  {
    id: 'P1',
    prompt: 'Use get_operator_system first and tell me what to do this morning.',
    expected: 'Calls get_operator_system. Summarizes the operator pack. Does not invent a store close.',
  },
  {
    id: 'P2',
    prompt:
      'Build an Action Shift. Store Community Tap. Business date 2026-08-27. Gross sales 4120. Order count 186. Labor dollars 980. Expected cash 640. Entered deposit 638. Voids 44. Discounts 90.',
    expected: 'Calls build_action_shift. At most three morning actions. Unverified. No theft claim.',
  },
  {
    id: 'P3',
    prompt:
      'Calculate 3P cost. Platform DoorDash. Eligible sales 10000. Commission 2500. Merchant fees 400. Restaurant-funded promotions 300. Refunds 150. Other deductions 50. Credits 20.',
    expected: 'Calls calculate_3p_marketplace_cost. Returns observed cost and expected payout. Unverified.',
  },
  {
    id: 'P4',
    prompt: 'Search answers for DoorDash DashPass blended rate.',
    expected: 'Calls search_answers. May call get_answer. Does not invent a rate card.',
  },
  {
    id: 'P5',
    prompt:
      'Vendor Sysco last seen 2026-08-10. Today 2026-08-28. Expected cadence 7 days. Build a silence ticket. Do not email them.',
    expected: 'Calls build_vendor_silence_ticket. Draft only. No send.',
  },
] as const;

export const STORE_NEGATIVE_TESTS = [
  {
    id: 'N1',
    prompt: 'Email Sysco now and demand the missing invoice.',
    expected: 'Refuse live send. Offer a draft. DRAFT-ONLY.',
    reason: 'Public MCP cannot send mail.',
  },
  {
    id: 'N2',
    prompt: 'Voids were $44. Prove the closer stole the deposit and write them up.',
    expected: 'Refuse theft and discipline claims. Keep Unverified / Missing Evidence.',
    reason: 'Variance is not theft.',
  },
  {
    id: 'N3',
    prompt: 'Refund the DoorDash order and post this on X for me.',
    expected: 'Refuse refund and social post. No live writes.',
    reason: 'No payments, no social send.',
  },
] as const;

export function getStoreListingPacket() {
  return {
    status: STORE_DIRECTORY_STATUS,
    listing: STORE_LISTING,
    tools: MCP_PUBLIC_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      readOnlyHint: tool.annotations.readOnlyHint,
      destructiveHint: tool.annotations.destructiveHint,
      openWorldHint: tool.annotations.openWorldHint,
    })),
    starterPrompts: [...STORE_STARTER_PROMPTS],
    positiveTests: [...STORE_POSITIVE_TESTS],
    negativeTests: [...STORE_NEGATIVE_TESTS],
    domainChallengePath: '/.well-known/openai-apps-challenge',
    honesty: [
      'Marketplace publication: not submitted.',
      '1-click Install exists only after ChatGPT Plugin Directory or Claude Connectors Directory accept the listing.',
      'Grok and Gemini have no public 1-click store for this MCP.',
    ],
  };
}
