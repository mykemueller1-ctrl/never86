export const NEVER86_MCP_URL = 'https://www.never86.ai/api/mcp';
export const NEVER86_MCP_INSTALL_URL = 'https://www.never86.ai/mcp';
export const NEVER86_SITE_URL = 'https://www.never86.ai';

export const NEVER86_MCP_DISCOVERY = {
  schema_version: '1.0',
  name: 'never86',
  title: "Never86'd Operator",
  description:
    'Restaurant leak detection for Payroll, Prices, and Process. Analyze labor CSVs, read invoice pricing SKU by SKU, and turn a prior-day close into three actions. Read-only.',
  version: '3.1.0',
  homepage: NEVER86_MCP_INSTALL_URL,
  documentation: NEVER86_MCP_INSTALL_URL,
  transport: 'http',
  protocol: 'mcp',
  protocol_version: '2025-03-26',
  endpoint: NEVER86_MCP_URL,
  servers: [
    {
      name: 'never86',
      url: NEVER86_MCP_URL,
      transport: 'http',
      read_only: true,
    },
  ],
  clients: {
    grok: {
      install_url: 'https://grok.com/connectors',
      docs_url: 'https://docs.x.ai/grok/connectors',
      connector_type: 'custom',
      suggested_name: "Never86'd Operator",
    },
    chatgpt: {
      install_url: 'https://chatgpt.com/#settings/Connectors',
      connector_type: 'remote_mcp',
      suggested_name: "Never86'd Operator",
    },
    claude: {
      install_url: 'https://claude.ai/settings/connectors',
      connector_type: 'remote_mcp',
      suggested_name: "Never86'd Operator",
    },
    gemini: {
      install_url: 'https://gemini.google.com/',
      connector_type: 'remote_mcp',
      suggested_name: "Never86'd Operator",
    },
    cursor: {
      install_path: '.cursor/mcp.json',
      connector_type: 'http_mcp',
    },
  },
  capabilities: {
    tools: true,
    resources: false,
    prompts: false,
  },
  authentication: {
    type: 'none',
    note: 'Public read-only analysis of data the operator deliberately supplies. No restaurant login or POS password required.',
  },
} as const;
