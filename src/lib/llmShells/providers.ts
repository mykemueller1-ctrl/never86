import { MCP_PUBLIC_ENDPOINT, MCP_PUBLIC_TOOL_NAMES } from '../mcpPublicContract';
import { certifyReadOnlyThenDraftOnly } from './certification';
import { NEVER86_SKILL_PACK_ID, NEVER86_SKILL_PACK_VERSION, SHARED_SKILL_INSTRUCTIONS, getNever86SkillPack } from './skillPack';

export const LLM_SHELL_PROVIDERS = ['chatgpt', 'claude', 'gemini', 'grok'] as const;
export type LlmShellProvider = (typeof LLM_SHELL_PROVIDERS)[number];

export type HonestInstallStatus = {
  repoState: 'drafted-in-git';
  marketplacePublication: 'not-submitted';
  liveProviderInstall: 'unverified';
  credentials: 'none-claimed';
  oauthForRestaurantTenant: 'not-claimed';
  publicMcpAuth: 'none-public-read-only';
};

const HONEST_STATUS: HonestInstallStatus = {
  repoState: 'drafted-in-git',
  marketplacePublication: 'not-submitted',
  liveProviderInstall: 'unverified',
  credentials: 'none-claimed',
  oauthForRestaurantTenant: 'not-claimed',
  publicMcpAuth: 'none-public-read-only',
};

function sharedShell(provider: LlmShellProvider, label: string, install: {
  client: string;
  docs: string;
  steps: string[];
  nativeConfig: Record<string, unknown>;
}) {
  const pack = getNever86SkillPack();
  const certification = certifyReadOnlyThenDraftOnly();
  return {
    provider,
    label,
    kind: 'thin-install-shell' as const,
    skillPackId: NEVER86_SKILL_PACK_ID,
    skillPackVersion: NEVER86_SKILL_PACK_VERSION,
    operatorSystemVersion: pack.backend.operatorSystemVersion,
    mcp: {
      name: 'never86-operator-system',
      url: MCP_PUBLIC_ENDPOINT,
      tools: MCP_PUBLIC_TOOL_NAMES,
    },
    instructions: SHARED_SKILL_INSTRUCTIONS,
    forbidsForkedBusinessLogic: true,
    certification,
    status: HONEST_STATUS,
    install,
  };
}

export function getChatgptShell() {
  return sharedShell('chatgpt', 'OpenAI ChatGPT', {
    client: 'ChatGPT custom GPT, GPT Actions, or ChatGPT MCP connector when the account has remote MCP.',
    docs: 'https://www.never86.ai/mcp',
    steps: [
      'This listing is not submitted to the GPT Store. Do not treat a store URL as live.',
      'If the ChatGPT account shows Connectors / MCP, add a custom MCP server named Never86\'d Operator Intelligence with URL https://www.never86.ai/api/mcp.',
      'If only Custom GPTs are available, paste the shared skill instructions and point any Action at the same MCP URL. Do not re-declare restaurant formulas as GPT Actions.',
      'Call get_operator_system first. Keep the session READ-ONLY. Vendor copy is DRAFT-ONLY.',
      'No Never86 ChatGPT client secret, operator OAuth client, or GPT Store slug is claimed.',
    ],
    nativeConfig: {
      name: "Never86'd Operator Intelligence",
      mcpServers: [{ name: 'never86-operator-system', type: 'http', url: MCP_PUBLIC_ENDPOINT }],
      gptStore: 'not-submitted',
    },
  });
}

export function getClaudeShell() {
  return sharedShell('claude', 'Anthropic Claude', {
    client: 'Claude Desktop, Claude.ai custom connector, or an Anthropic skill file that only points at MCP.',
    docs: 'https://www.never86.ai/mcp',
    steps: [
      'Not submitted to an Anthropic connector marketplace. Do not invent a directory listing.',
      'Claude Desktop: add a remote MCP server never86-operator-system at https://www.never86.ai/api/mcp. Prefer HTTP MCP if the client supports it; otherwise document the gap instead of forking tools into a local stdio server.',
      'Optional skill file skills/never86/SKILL.md is a thin pointer at the same skill pack. It contains no restaurant math.',
      'Call get_operator_system first. READ-ONLY then DRAFT-ONLY. Do not wire the private orchestrator OAuth client into Claude.',
    ],
    nativeConfig: {
      mcpServers: {
        'never86-operator-system': {
          url: MCP_PUBLIC_ENDPOINT,
        },
      },
      marketplace: 'not-submitted',
    },
  });
}

export function getGeminiShell() {
  return sharedShell('gemini', 'Google Gemini', {
    client: 'Gemini Gem custom instructions, or Google AI Studio / Gemini app MCP connector if the account has remote MCP.',
    docs: 'https://www.never86.ai/mcp',
    steps: [
      'Not submitted to Gemini Gems gallery or an extensions marketplace. No live Gem ID is claimed.',
      'Create a Gem (or equivalent custom instruction) named Never86\'d Operator Intelligence and paste the shared skill instructions.',
      'If the Gemini client supports remote MCP, add https://www.never86.ai/api/mcp. If it does not, keep the Gem as instructions-only and still call operators to the public MCP from a compatible client — do not reimplement tools as Gemini function-calling math.',
      'READ-ONLY then DRAFT-ONLY. No Google Cloud service account or Gemini API key belongs in this repo.',
    ],
    nativeConfig: {
      gemName: "Never86'd Operator Intelligence",
      mcpUrl: MCP_PUBLIC_ENDPOINT,
      gemsGallery: 'not-submitted',
    },
  });
}

export function getGrokShell() {
  return sharedShell('grok', 'xAI Grok', {
    client: 'Grok Connectors custom MCP connector.',
    docs: 'https://docs.x.ai/grok/connectors',
    steps: [
      'Open Grok Connectors → New Connector → Custom. This repo does not claim that a named listing is already installed on grok.com.',
      'Name it Never86\'d Operator Intelligence. Paste https://www.never86.ai/api/mcp. No restaurant login or marketplace password is required for the public pack.',
      'Do not attach the private Grok→Cursor orchestrator OAuth client to this operator shell. That bridge is a separate, fail-closed factory endpoint.',
      'Ask Grok to use get_operator_system first. READ-ONLY then DRAFT-ONLY.',
    ],
    nativeConfig: {
      connectorName: "Never86'd Operator Intelligence",
      endpoint: MCP_PUBLIC_ENDPOINT,
      grokDirectory: 'not-submitted',
    },
  });
}

const SHELL_BUILDERS = {
  chatgpt: getChatgptShell,
  claude: getClaudeShell,
  gemini: getGeminiShell,
  grok: getGrokShell,
} as const;

export function getLlmShell(provider: LlmShellProvider) {
  return SHELL_BUILDERS[provider]();
}

export function listLlmShells() {
  return LLM_SHELL_PROVIDERS.map((provider) => getLlmShell(provider));
}

export function isLlmShellProvider(value: string): value is LlmShellProvider {
  return (LLM_SHELL_PROVIDERS as readonly string[]).includes(value);
}

export function getInstallMatrix() {
  const pack = getNever86SkillPack();
  const certification = certifyReadOnlyThenDraftOnly();
  return {
    skillPack: {
      id: pack.id,
      version: pack.version,
      providerNeutral: pack.providerNeutral,
      mcpUrl: pack.backend.mcpUrl,
      operatorSystemVersion: pack.backend.operatorSystemVersion,
      allowedTools: pack.backend.allowedTools,
    },
    certification,
    status: HONEST_STATUS,
    shells: listLlmShells().map((shell) => ({
      provider: shell.provider,
      label: shell.label,
      kind: shell.kind,
      skillPackVersion: shell.skillPackVersion,
      mcpUrl: shell.mcp.url,
      marketplacePublication: shell.status.marketplacePublication,
      liveProviderInstall: shell.status.liveProviderInstall,
      credentials: shell.status.credentials,
      installClient: shell.install.client,
      steps: shell.install.steps,
    })),
    honesty: [
      'One skill pack. Four thin install shells. No forked restaurant logic.',
      'Public MCP is live on www.never86.ai for prior deploys; these shells are drafted in git until a human installs them in each provider UI.',
      'No GPT Store, Claude directory, Gemini gallery, or Grok featured-connector publication is claimed.',
      'No provider secrets, operator OAuth clients, or unverified credentials are included.',
    ],
  };
}

export type LlmShell = ReturnType<typeof getLlmShell>;
export type InstallMatrix = ReturnType<typeof getInstallMatrix>;
