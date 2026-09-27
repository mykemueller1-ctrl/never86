import { MCP_PUBLIC_ENDPOINT, MCP_PUBLIC_TOOL_NAMES } from '../mcpPublicContract';
import { certifyReadOnlyThenDraftOnly } from './certification';
import { NEVER86_SKILL_PACK_ID, NEVER86_SKILL_PACK_VERSION, SHARED_SKILL_INSTRUCTIONS, getNever86SkillPack } from './skillPack';

export const LLM_SHELL_PROVIDERS = ['chatgpt', 'claude', 'perplexity', 'grok', 'gemini'] as const;
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
  'Provider-specific remote MCP paths are documented; each live Never86’d account connection still requires verification.',
  'Marketplace publication: not submitted.',
  'Credentials: none claimed.',
  'Consumer Gemini custom-MCP install: not claimed.',
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
    client: 'ChatGPT custom app / remote MCP in developer mode when required by the plan or workspace.',
    docs: 'https://help.openai.com/en/articles/12584461',
    openUrl: 'https://chatgpt.com',
    steps: [
      'Open ChatGPT settings or workspace settings → Apps. Enable Developer Mode if the workspace requires it.',
      'Create a custom app named Never86’d Operator Intelligence.',
      'Enter https://www.never86.ai/api/mcp, scan the tools, and test the public read-only connector.',
    ],
    nativeConfig: {
      name: "Never86'd Operator Intelligence",
      mcpServers: [{ name: 'never86-operator-system', type: 'http', url: MCP_PUBLIC_ENDPOINT }],
      pluginDirectory: 'not-submitted',
    },
  });
}

export function getClaudeShell() {
  return sharedShell('claude', 'Anthropic Claude', {
    client: 'Claude.ai Customize → Connectors → custom remote connector.',
    docs: 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
    openUrl: 'https://claude.ai',
    steps: [
      'Open Claude → Customize → Connectors → Add custom connector.',
      'Name it Never86’d Operator Intelligence.',
      'Enter https://www.never86.ai/api/mcp, add the connector, and enable it in the conversation.',
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

export function getPerplexityShell() {
  return sharedShell('perplexity', 'Perplexity', {
    client: 'Perplexity Account settings → Connectors → Custom connector → Remote.',
    docs: 'https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors',
    openUrl: 'https://www.perplexity.ai',
    steps: [
      'Open Perplexity → Account settings → Connectors.',
      'Choose Custom connector → Remote and name it Never86’d Operator Intelligence.',
      'Enter https://www.never86.ai/api/mcp. Use no application credentials for the public read-only connector.',
    ],
    nativeConfig: {
      connectorName: "Never86'd Operator Intelligence",
      endpoint: MCP_PUBLIC_ENDPOINT,
      authentication: 'none-public-read-only',
    },
  });
}

export function getGrokShell() {
  return sharedShell('grok', 'xAI Grok', {
    client: 'Grok Connectors → New Connector → Custom. Business / Enterprise may require admin provisioning.',
    docs: 'https://docs.x.ai/grok/connectors',
    openUrl: 'https://grok.com/connectors',
    steps: [
      'Open grok.com/connectors → New Connector → Custom.',
      'Name it Never86’d Operator Intelligence.',
      'Enter https://www.never86.ai/api/mcp and complete any connector confirmation. Business / Enterprise workspaces may require an admin first.',
    ],
    nativeConfig: {
      connectorName: "Never86'd Operator Intelligence",
      endpoint: MCP_PUBLIC_ENDPOINT,
      grokCatalog: 'not-claimed',
    },
  });
}

export function getGeminiShell() {
  return sharedShell('gemini', 'Google Gemini API', {
    client: 'Gemini API remote MCP on compatible API/model flows. No consumer Gemini custom-connector claim.',
    docs: 'https://ai.google.dev/gemini-api/docs/function-calling',
    openUrl: 'https://aistudio.google.com',
    steps: [
      'Use a Gemini API flow/model that supports remote MCP over Streamable HTTP.',
      'Configure an MCP server with URL https://www.never86.ai/api/mcp and a server name without hyphens, such as never86_operator_system.',
      'Do not describe this as a generic consumer Gemini-app connector. It is a developer/API path.',
    ],
    nativeConfig: {
      type: 'mcp_server',
      name: 'never86_operator_system',
      url: MCP_PUBLIC_ENDPOINT,
      consumerGeminiConnector: 'not-claimed',
    },
  });
}

const SHELL_BUILDERS = {
  chatgpt: getChatgptShell,
  claude: getClaudeShell,
  perplexity: getPerplexityShell,
  grok: getGrokShell,
  gemini: getGeminiShell,
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
      'One skill pack. Five provider guidance shells. No forked restaurant logic.',
      'Documented connector/API paths do not prove that the Never86’d connector has been tested in every account or plan.',
      'No ChatGPT Plugin Directory, Claude marketplace, Grok featured-catalog, or consumer Gemini connector publication is claimed.',
      'No provider secrets, operator OAuth clients, or unverified credentials are included in the public MCP.',
      'READ-ONLY and DRAFT-ONLY are certified in repo. Live external writes: none.',
    ],
  };
}

export type LlmShell = ReturnType<typeof getLlmShell>;
export type InstallMatrix = ReturnType<typeof getInstallMatrix>;
