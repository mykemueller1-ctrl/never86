import crypto from 'crypto';

export const CURSOR_API_BASE = 'https://api.cursor.com';
export const NEVER86_REPO_URL = 'https://github.com/mykemueller1-ctrl/never86';
export const NEVER86_MCP_URL = 'https://www.never86.ai/api/mcp';

export type CursorDispatchInput = {
  taskId: string;
  goal: string;
  acceptanceEvidence: string[];
  startingRef: string;
  autoCreatePr: boolean;
};

export type CursorDispatchPlan = CursorDispatchInput & {
  agentId: string;
  repoUrl: string;
  name: string;
  prompt: string;
};

export function safeSecretEqual(provided: string, expected: string): boolean {
  const left = crypto.createHash('sha256').update(provided).digest();
  const right = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(left, right);
}

export function bearerToken(header: string | null): string {
  if (!header) return '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? '';
}

export function cursorAgentIdForTask(taskId: string): string {
  const bytes = Buffer.from(crypto.createHash('sha256').update(`never86:${taskId}`).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `bc-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function allowedStartingRefs(raw: string | undefined): string[] {
  const configured = (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : ['codex/action-shift-122-safe'];
}

export function buildCursorAgentPrompt(input: CursorDispatchInput): string {
  const evidence = input.acceptanceEvidence.map((item) => `- ${item}`).join('\n');
  return [
    'You are a Cursor factory worker for Never86\'d. Grok is Myke\'s command hub; Codex is the watchtower.',
    'Work only in the assigned never86 repository on an isolated Cursor branch.',
    'Read docs/company/intake/CHATGPT_HANDOFF.md and docs/company/intake/INBOX.md before editing.',
    'Preserve unrelated work. Keep private CTAP/customer/employee data out of public Git.',
    'Do not send messages, publish, spend, change production, apply live database migrations, or write CRM records.',
    'Do not merge. Do not work on the starting branch directly. Never expose credentials.',
    'Distinguish drafted, staged, tested, committed, pushed, merged, deployed, and live-verified.',
    '',
    `TASK ID: ${input.taskId}`,
    `GOAL: ${input.goal}`,
    '',
    'ACCEPTANCE EVIDENCE:',
    evidence,
    '',
    'Return one concise packet: outcome, files changed, tests, commit, pushed branch/PR, blockers, and next owner.',
  ].join('\n');
}

export function prepareCursorDispatch(input: CursorDispatchInput, repoUrl = NEVER86_REPO_URL): CursorDispatchPlan {
  return {
    ...input,
    agentId: cursorAgentIdForTask(input.taskId),
    repoUrl,
    name: `Never86 · ${input.taskId}`.slice(0, 100),
    prompt: buildCursorAgentPrompt(input),
  };
}

type CursorRequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  apiKey?: string;
};

export class CursorApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'CursorApiError';
    this.status = status;
  }
}

export async function cursorApiRequest<T>(path: string, options: CursorRequestOptions = {}): Promise<T> {
  const apiKey = options.apiKey ?? process.env.CURSOR_API_KEY;
  if (!apiKey) throw new CursorApiError(503, 'Cursor API is not configured.');

  const response = await fetch(`${CURSOR_API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload?.message === 'string' ? payload.message : `Cursor API returned ${response.status}.`;
    throw new CursorApiError(response.status, detail.slice(0, 500));
  }
  return payload as T;
}

export async function launchCursorAgent(plan: CursorDispatchPlan): Promise<unknown> {
  return cursorApiRequest('/v1/agents', {
    method: 'POST',
    body: {
      agentId: plan.agentId,
      name: plan.name,
      prompt: { text: plan.prompt },
      repos: [{ url: plan.repoUrl, startingRef: plan.startingRef }],
      workOnCurrentBranch: false,
      autoCreatePR: plan.autoCreatePr,
      skipReviewerRequest: false,
      mcpServers: [{ name: 'never86-operator-system', type: 'http', url: NEVER86_MCP_URL }],
      mode: 'agent',
    },
  });
}
