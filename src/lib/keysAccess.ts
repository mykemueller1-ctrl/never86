/**
 * Never86 keys / env catalog and no-secret probes.
 * Values never leave this module. Presence, length, and HTTP status only.
 */

export const KEYS_ACCESS_TASK_ID = 'keys-access-env-v1';
export const XAI_API_BASE_DEFAULT = 'https://api.x.ai/v1';
export const XAI_MODEL_DEFAULT = 'grok-4.6';
export const PUBLIC_MCP_URL = 'https://www.never86.ai/api/mcp';
export const PRIVATE_ORCHESTRATOR_MCP_URL = 'https://www.never86.ai/api/orchestrator/mcp';
export const KEYS_ACCESS_DOC = 'docs/company/KEYS_ACCESS.md';

export const KEY_STATES = [
  'drafted',
  'staged',
  'tested',
  'committed',
  'pushed',
  'merged',
  'deployed',
  'live-verified',
  'not-configured',
  'fail-closed',
  'needs-human-click',
] as const;

export type KeyState = (typeof KEY_STATES)[number];

export type KeyKind = 'secret' | 'public' | 'flag';
export type KeySurface = 'vercel' | 'cursor-factory' | 'local-env' | 'xai-console' | 'desktop-mcp';

export type KeySpec = {
  name: string;
  purpose: string;
  surfaces: KeySurface[];
  kind: KeyKind;
  required: boolean;
  placeholder: string;
  setup: string;
};

export type KeyPresence = {
  name: string;
  present: boolean;
  nonempty: boolean;
  length: number;
};

export type ProbeStatus =
  | 'live-verified'
  | 'not-configured'
  | 'unauthorized'
  | 'fail-closed'
  | 'error';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Official xAI inference key. Grok Bot workspaces are a separate product. */
export const XAI_API_KEY_NAME = 'XAI_API_KEY';

export const KEYS_ACCESS_CATALOG: readonly KeySpec[] = [
  {
    name: XAI_API_KEY_NAME,
    purpose: 'xAI Grok model API (OpenAI-compatible). Optional for command-center workers that only use public MCP.',
    surfaces: ['xai-console', 'vercel', 'local-env', 'cursor-factory'],
    kind: 'secret',
    required: false,
    placeholder: 'xai-xxx',
    setup: 'xAI console → API Keys → approved secret storage. Never Git, chat, or a shareable bot.',
  },
  {
    name: 'XAI_API_BASE',
    purpose: 'Override xAI inference base URL. Defaults to https://api.x.ai/v1.',
    surfaces: ['vercel', 'local-env', 'cursor-factory'],
    kind: 'public',
    required: false,
    placeholder: 'https://api.x.ai/v1',
    setup: 'Leave unset unless pointing at a documented xAI endpoint.',
  },
  {
    name: 'XAI_MODEL',
    purpose: 'Override xAI chat-completions model. Defaults to grok-4.6. Not a secret.',
    surfaces: ['vercel', 'local-env', 'cursor-factory'],
    kind: 'public',
    required: false,
    placeholder: 'grok-4.6',
    setup: 'Leave unset to use grok-4.6. YouTube desk and other Grok model callers share this default.',
  },
  {
    name: 'NEVER86_ORCHESTRATOR_TOKEN',
    purpose: 'Legacy bearer for the private Grok → Cursor factory MCP.',
    surfaces: ['vercel'],
    kind: 'secret',
    required: false,
    placeholder: 'replace-with-high-entropy-token',
    setup: 'Approved Vercel secret storage. OAuth secret may replace this for Grok Web.',
  },
  {
    name: 'NEVER86_OAUTH_CLIENT_ID',
    purpose: 'Private Grok OAuth client id. Defaults to grok-never86-cursor.',
    surfaces: ['vercel'],
    kind: 'public',
    required: false,
    placeholder: 'grok-never86-cursor',
    setup: 'Keep the default unless Myke rotates the Grok connector client.',
  },
  {
    name: 'NEVER86_OAUTH_CLIENT_SECRET',
    purpose: 'Confidential Grok OAuth client secret and artifact signing key.',
    surfaces: ['vercel'],
    kind: 'secret',
    required: true,
    placeholder: 'replace-with-high-entropy-secret',
    setup: 'Approved Vercel secret storage. Never Git, prompt, or public connector.',
  },
  {
    name: 'CURSOR_API_KEY',
    purpose: 'Cursor Cloud Agents API key used by the private factory bridge.',
    surfaces: ['vercel'],
    kind: 'secret',
    required: true,
    placeholder: 'key_xxx',
    setup: 'Cursor dashboard → API keys → Vercel secret. Cloud workers do not receive this key.',
  },
  {
    name: 'CURSOR_AUTONOMOUS_DISPATCH_ENABLED',
    purpose: 'Server-side launch switch. Must be exactly true to spend a factory slot.',
    surfaces: ['vercel'],
    kind: 'flag',
    required: false,
    placeholder: 'false',
    setup: 'Leave false until spend and repo access are reviewed.',
  },
  {
    name: 'CURSOR_ALLOWED_STARTING_REFS',
    purpose: 'Comma-separated branch allowlist for factory launches.',
    surfaces: ['vercel'],
    kind: 'public',
    required: false,
    placeholder: 'main,codex/action-shift-122-safe',
    setup: 'Vercel env. Defaults to the public-safe branch when unset.',
  },
  {
    name: 'CURSOR_MAX_ACTIVE_AGENTS',
    purpose: 'Active factory cap. Production uses 1 until the three-clean-job gate.',
    surfaces: ['vercel'],
    kind: 'flag',
    required: false,
    placeholder: '1',
    setup: 'Vercel env. Hard maximum 16 in code.',
  },
  {
    name: 'CURSOR_REPO_URL',
    purpose: 'Optional repository override for factory launches.',
    surfaces: ['vercel'],
    kind: 'public',
    required: false,
    placeholder: 'https://github.com/mykemueller1-ctrl/never86',
    setup: 'Leave unset to keep the canonical never86 repo.',
  },
  {
    name: 'ANTHROPIC_API_KEY',
    purpose: 'Claude invoice / Z-report parsing.',
    surfaces: ['vercel', 'local-env'],
    kind: 'secret',
    required: false,
    placeholder: 'sk-ant-xxx',
    setup: 'console.anthropic.com → Vercel / local .env.local.',
  },
  {
    name: 'RESEND_API_KEY',
    purpose: 'Transactional email. Production fails closed when missing.',
    surfaces: ['vercel', 'local-env'],
    kind: 'secret',
    required: false,
    placeholder: 're_xxx',
    setup: 'resend.com → Vercel secret.',
  },
  {
    name: 'DATABASE_URL',
    purpose: 'Neon app database. Never paste into chat, Git, or a PR.',
    surfaces: ['vercel', 'local-env'],
    kind: 'secret',
    required: false,
    placeholder: 'postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require',
    setup: 'Neon dashboard → Vercel secret. Do not apply live migrations from a factory job.',
  },
  {
    name: 'OPS_DATABASE_URL',
    purpose: 'Supabase ops pooler. Deferred for the free seat.',
    surfaces: ['vercel', 'local-env'],
    kind: 'secret',
    required: false,
    placeholder: 'postgresql://postgres.xxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    setup: 'Supabase project settings → approved secret storage.',
  },
  {
    name: 'CRON_SECRET',
    purpose: 'Vercel cron / admin apply bearer.',
    surfaces: ['vercel'],
    kind: 'secret',
    required: false,
    placeholder: 'your-random-secret-here',
    setup: 'High-entropy string in Vercel.',
  },
  {
    name: 'OWNER_EMAIL',
    purpose: 'Notification recipient. Use a deliverable inbox (Gmail or myke@never86.ai). Never myke@n86.app — Resend bounce-suppressed since 2026-07-25.',
    surfaces: ['vercel', 'local-env'],
    kind: 'public',
    required: false,
    placeholder: 'mykemueller1@gmail.com',
    setup: 'Vercel env. getOwnerEmail() rejects the retired n86.app address.',
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    purpose: 'Google one-seat claim. Fail-closed until present with secret + state.',
    surfaces: ['vercel'],
    kind: 'public',
    required: false,
    placeholder: 'xxx.apps.googleusercontent.com',
    setup: 'Google Cloud OAuth client → Vercel. Not live until Myke enables staff claim.',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    purpose: 'Google one-seat claim secret.',
    surfaces: ['vercel'],
    kind: 'secret',
    required: false,
    placeholder: 'GOCSPX-xxx',
    setup: 'Approved Vercel secret. Do not invent.',
  },
  {
    name: 'STAFF_SEAT_LOGIN_ENABLED',
    purpose: 'Live staff login switch. Must stay unset/false until roster + Neon apply.',
    surfaces: ['vercel'],
    kind: 'flag',
    required: false,
    placeholder: 'false',
    setup: 'Human gate. Factory jobs must not set this to true.',
  },
] as const;

const SECRET_LIKE =
  /(sk-ant-[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9]{16,}|xai-[A-Za-z0-9]{16,}|re_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|key_[A-Za-z0-9]{16,}|postgres:\/\/[^:\s]+:[^@\s]+@)/;

type EnvMap = Record<string, string | undefined>;

export function xaiApiBase(env: EnvMap = process.env): string {
  const raw = env.XAI_API_BASE?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, '') : XAI_API_BASE_DEFAULT;
}

export function xaiModel(env: EnvMap = process.env): string {
  const raw = env.XAI_MODEL?.trim();
  return raw && raw.length > 0 ? raw : XAI_MODEL_DEFAULT;
}

export function inspectKeyPresence(
  names: readonly string[],
  env: EnvMap = process.env,
): KeyPresence[] {
  return names.map((name) => {
    const raw = env[name];
    const nonempty = Boolean(raw && raw.trim().length > 0);
    return {
      name,
      present: raw !== undefined,
      nonempty,
      length: nonempty ? raw!.trim().length : 0,
    };
  });
}

export function catalogPresence(env: EnvMap = process.env): KeyPresence[] {
  return inspectKeyPresence(KEYS_ACCESS_CATALOG.map((item) => item.name), env);
}

export function assertNoEmbeddedSecrets(value: unknown, path = 'root'): string[] {
  const leaks: string[] = [];
  if (typeof value === 'string') {
    if (SECRET_LIKE.test(value)) leaks.push(path);
    return leaks;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      leaks.push(...assertNoEmbeddedSecrets(item, `${path}[${index}]`));
    });
    return leaks;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'placeholder') continue;
      leaks.push(...assertNoEmbeddedSecrets(child, `${path}.${key}`));
    }
  }
  return leaks;
}

export async function probeXaiModels(
  env: EnvMap = process.env,
  fetchFn: FetchLike = fetch,
): Promise<{ status: ProbeStatus; httpStatus?: number; modelCount?: number; detail?: string }> {
  const key = env[XAI_API_KEY_NAME]?.trim();
  if (!key) return { status: 'not-configured', detail: 'XAI_API_KEY is absent. Grok Bot and public MCP do not need this key.' };

  const response = await fetchFn(`${xaiApiBase(env)}/models`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    return { status: 'unauthorized', httpStatus: response.status, detail: 'xAI rejected the key. Rotate only with new evidence.' };
  }
  if (!response.ok) {
    return { status: 'error', httpStatus: response.status, detail: `xAI models probe returned ${response.status}.` };
  }

  const body = await response.json().catch(() => ({}));
  const models = Array.isArray(body?.data) ? body.data : Array.isArray(body?.models) ? body.models : [];
  return { status: 'live-verified', httpStatus: response.status, modelCount: models.length };
}

export async function probePublicMcp(
  fetchFn: FetchLike = fetch,
  url = PUBLIC_MCP_URL,
): Promise<{ status: ProbeStatus; httpStatus?: number; serverName?: string; toolCount?: number; detail?: string }> {
  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'never86-keys-access', version: '1.0.0' } } }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { status: 'error', httpStatus: response.status, detail: `Public MCP initialize returned ${response.status}.` };
  }

  const payload = await readJsonRpc(response);
  const serverName = payload?.result?.serverInfo?.name;
  const list = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    cache: 'no-store',
  });
  const listed = list.ok ? await readJsonRpc(list) : null;
  const tools = listed?.result?.tools;
  return {
    status: 'live-verified',
    httpStatus: response.status,
    serverName: typeof serverName === 'string' ? serverName : undefined,
    toolCount: Array.isArray(tools) ? tools.length : undefined,
  };
}

export async function probeOrchestratorUnauthenticated(
  fetchFn: FetchLike = fetch,
  url = PRIVATE_ORCHESTRATOR_MCP_URL,
): Promise<{ status: ProbeStatus; httpStatus?: number; detail?: string }> {
  const response = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    cache: 'no-store',
  });
  if (response.status === 401 || response.status === 503) {
    return { status: 'fail-closed', httpStatus: response.status, detail: 'Private factory MCP rejected unauthenticated access.' };
  }
  return { status: 'error', httpStatus: response.status, detail: `Expected 401/503 from private MCP, got ${response.status}.` };
}

type JsonRpcPayload = {
  result?: {
    serverInfo?: { name?: string };
    tools?: unknown[];
  };
};

async function readJsonRpc(response: Response): Promise<JsonRpcPayload> {
  const text = await response.text();
  const jsonLine = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('{') || line.startsWith('data: {'));
  const raw = jsonLine?.startsWith('data: ') ? jsonLine.slice(6) : jsonLine ?? text;
  try {
    return JSON.parse(raw) as JsonRpcPayload;
  } catch {
    return {};
  }
}

export function keysAccessSummary(presence: KeyPresence[]) {
  const byName = Object.fromEntries(presence.map((item) => [item.name, item]));
  return {
    taskId: KEYS_ACCESS_TASK_ID,
    xaiKey: byName[XAI_API_KEY_NAME]?.nonempty ? 'present' : 'absent',
    oauthSecret: byName.NEVER86_OAUTH_CLIENT_SECRET?.nonempty ? 'present' : 'absent',
    cursorApiKey: byName.CURSOR_API_KEY?.nonempty ? 'present' : 'absent',
    publicMcp: PUBLIC_MCP_URL,
    privateMcp: PRIVATE_ORCHESTRATOR_MCP_URL,
    doc: KEYS_ACCESS_DOC,
    note: 'Presence only. Values are never returned.',
  };
}
