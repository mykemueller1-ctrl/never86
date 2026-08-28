import { MCP_PUBLIC_ENDPOINT, MCP_PUBLIC_TOOL_NAMES } from '../mcpPublicContract';
import { certifyReadOnlyThenDraftOnly } from './certification';
import { NEVER86_SKILL_PACK_ID, NEVER86_SKILL_PACK_VERSION, SHARED_SKILL_INSTRUCTIONS, getNever86SkillPack } from './skillPack';

export const LLM_SHELL_PROVIDERS = ['chatgpt', 'claude', 'gemini', 'grok'] as const;
export type LlmShellProvider = (typeof LLM_SHELL_PROVIDERS)[number];

export type HonestInstallStatus = {
  marketplacePublication: 'not-submitted';
  liveProviderInstall: 'unverified';
  credentials: 'none-claimed';
  oauthForRestaurantTenant: 'not-claimed';
  publicMcpAuth: 'none-public-read-only';
  readOnlyCertified: 'certified-in-repo';
  draftOnlyCertified: 'certified-in-repo';
};

const HONEST_STATUS: HonestInstallStatus = {
  marketplacePublication: 'not-submitted',
  liveProviderInstall: 'unverified',
  credentials: 'none-claimed',
  oauthForRestaurantTenant: 'not-claimed',
  publicMcpAuth: 'none-public-read-only',
  readOnlyCertified: 'certified-in-repo',
  draftOnlyCertified: 'certified-in-repo',
};

/** Durable claims only. Never encode merge/deploy/preview state that goes stale on a live build. */
export const DURABLE_SHELL_CLAIMS = [
  'Provider installation: unverified.',
  'Marketplace publication: not submitted.',
  'Credentials: none claimed.',
  'READ-ONLY and DRAFT-ONLY: certified in repo.',
] as const;

function sharedShell(provider: LlmShellProvider, label: string, install: {
  client: string;
  docs: string;
  openUrl: string;
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
    client: 'ChatGPT Settings → Connectors. Paid plan. Developer Mode if ChatGPT asks for it.',
    docs: 'https://help.openai.com/en/articles/11487775-connectors-in-chatgpt',
    openUrl: 'https://chatgpt.com',
    steps: [
      'Open ChatGPT → Settings → Connectors (or Apps & Connectors). Enable Developer Mode if the screen asks.',
      'Create a custom / remote MCP connector named Never86\'d Operator Intelligence.',
      'Paste https://www.never86.ai/api/mcp. No restaurant login. Then send the first prompt on this page.',
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
    client: 'Claude.ai Customize → Connectors, or Claude Desktop custom connector.',
    docs: 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
    openUrl: 'https://claude.ai/settings/connectors',
    steps: [
      'Open Claude → Customize → Connectors → Add custom connector.',
      'Name it Never86\'d Operator Intelligence.',
      'Paste https://www.never86.ai/api/mcp. Prefer HTTP/remote MCP. Then send the first prompt on this page.',
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
    client: 'Gemini Gem, or Gemini / AI Studio MCP connector when the account has it.',
    docs: 'https://ai.google.dev/gemini-api/docs',
    openUrl: 'https://gemini.google.com',
    steps: [
      'Open Gemini. Create a Gem named Never86\'d Operator Intelligence.',
      'If the account shows Extensions / Connectors, add https://www.never86.ai/api/mcp. If not, paste the shared skill instructions into the Gem.',
      'Do not rebuild restaurant math as Gemini functions. Then send the first prompt on this page.',
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
    client: 'Grok Connectors → New → Custom.',
    docs: 'https://docs.x.ai/grok/connectors',
    openUrl: 'https://grok.com/connectors',
    steps: [
      'Open grok.com/connectors → New Connector → Custom.',
      'Name it Never86\'d Operator Intelligence.',
      'Paste https://www.never86.ai/api/mcp. Save. Then send the first prompt on this page.',
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
      openUrl: shell.install.openUrl,
      steps: shell.install.steps,
    })),
    honesty: [
      'One skill pack. Four thin install shells. No forked restaurant logic.',
      'Provider installation is unverified until a human adds the connector in each provider UI.',
      'No GPT Store, Claude directory, Gemini gallery, or Grok featured-connector publication is claimed.',
      'No provider secrets, operator OAuth clients, or unverified credentials are included.',
      'READ-ONLY and DRAFT-ONLY are certified in repo. Live external writes: none.',
    ],
  };
}

export type LlmShell = ReturnType<typeof getLlmShell>;
export type InstallMatrix = ReturnType<typeof getInstallMatrix>;
