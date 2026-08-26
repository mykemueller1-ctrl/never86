import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  CursorApiError,
  allowedStartingRefs,
  bearerToken,
  cursorApiRequest,
  launchCursorAgent,
  prepareCursorDispatch,
  safeSecretEqual,
} from '../../../../lib/cursorDispatch';
import { validOAuthAccessToken } from '../../../../lib/orchestratorOAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

const SERVER_INFO = {
  name: 'never86-orchestrator',
  version: '0.1.0',
  description: 'Private authenticated Grok-to-Cursor orchestration for Never86. Repository allowlisted; isolated branches; no merge, deploy, delete, or cancel tools.',
};

const TOOLS = [
  {
    name: 'cursor_list_agents',
    description: 'List recent Cursor Cloud Agents so Grok can see which workers are active, idle, or archived.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', minimum: 1, maximum: 50 } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true, idempotentHint: true },
  },
  {
    name: 'cursor_get_agent',
    description: 'Get one Cursor agent plus its latest run status and evidence.',
    inputSchema: {
      type: 'object',
      properties: { agent_id: { type: 'string', pattern: '^bc-[0-9a-f-]{36}$' } },
      required: ['agent_id'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true, idempotentHint: true },
  },
  {
    name: 'cursor_prepare_dispatch',
    description: 'Validate and preview an allowlisted Never86 Cursor job without launching or spending anything.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', minLength: 3, maxLength: 120 },
        goal: { type: 'string', minLength: 10, maxLength: 8000 },
        acceptance_evidence: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 2, maxLength: 500 } },
        starting_ref: { type: 'string', maxLength: 200 },
        auto_create_pr: { type: 'boolean', default: true },
      },
      required: ['task_id', 'goal', 'acceptance_evidence'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  },
  {
    name: 'cursor_launch_agent',
    description: 'Launch one idempotent Cursor Cloud Agent on an isolated Never86 branch. Requires server-side autonomous dispatch enablement and respects the active-agent cap.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', minLength: 3, maxLength: 120 },
        goal: { type: 'string', minLength: 10, maxLength: 8000 },
        acceptance_evidence: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 2, maxLength: 500 } },
        starting_ref: { type: 'string', maxLength: 200 },
        auto_create_pr: { type: 'boolean', default: true },
      },
      required: ['task_id', 'goal', 'acceptance_evidence'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
  },
];

const DispatchSchema = z.object({
  task_id: z.string().trim().min(3).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/, 'task_id must be a stable machine-safe identifier'),
  goal: z.string().trim().min(10).max(8000),
  acceptance_evidence: z.array(z.string().trim().min(2).max(500)).min(1).max(12),
  starting_ref: z.string().trim().min(1).max(200).optional(),
  auto_create_pr: z.boolean().optional().default(true),
}).strict();

const AgentIdSchema = z.string().regex(/^bc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

function rpcOk(id: JsonRpcRequest['id'], result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

function toolResult(id: JsonRpcRequest['id'], value: unknown, isError = false) {
  return rpcOk(id, { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }], ...(isError ? { isError: true } : {}) });
}

function authorize(req: NextRequest): { ok: true } | { ok: false; status: number; message: string } {
  const expected = process.env.NEVER86_ORCHESTRATOR_TOKEN?.trim();
  const oauthConfigured = Boolean(process.env.NEVER86_OAUTH_CLIENT_SECRET?.trim());
  if (!expected && !oauthConfigured) return { ok: false, status: 503, message: 'Private orchestrator is not configured.' };
  const provided = bearerToken(req.headers.get('authorization'));
  const legacyAuthorized = Boolean(provided && expected && safeSecretEqual(provided, expected));
  if (!legacyAuthorized && !validOAuthAccessToken(provided)) return { ok: false, status: 401, message: 'Unauthorized.' };
  return { ok: true };
}

function authFailure(auth: { status: number; message: string }) {
  return NextResponse.json({ error: auth.message }, {
    status: auth.status,
    ...(auth.status === 401 ? { headers: { 'WWW-Authenticate': 'Bearer resource_metadata="https://www.never86.ai/.well-known/oauth-protected-resource"' } } : {}),
  });
}

function dispatchPlan(raw: unknown) {
  const parsed = DispatchSchema.parse(raw);
  const refs = allowedStartingRefs(process.env.CURSOR_ALLOWED_STARTING_REFS);
  const startingRef = parsed.starting_ref ?? refs[0];
  if (!refs.includes(startingRef)) throw new Error(`starting_ref is not allowlisted. Allowed: ${refs.join(', ')}`);
  return prepareCursorDispatch({
    taskId: parsed.task_id,
    goal: parsed.goal,
    acceptanceEvidence: parsed.acceptance_evidence,
    startingRef,
    autoCreatePr: parsed.auto_create_pr,
  }, process.env.CURSOR_REPO_URL?.trim() || undefined);
}

function runSummary(run: Record<string, unknown> | null) {
  if (!run) return null;
  const result = typeof run.result === 'string' ? run.result.slice(0, 12_000) : undefined;
  return {
    id: run.id,
    agentId: run.agentId,
    status: run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    durationMs: run.durationMs,
    git: run.git,
    ...(result === undefined ? {} : { result }),
  };
}

async function handle(request: JsonRpcRequest): Promise<Response> {
  if (request.method === 'initialize') {
    return rpcOk(request.id, { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: SERVER_INFO });
  }
  if (request.method === 'tools/list') return rpcOk(request.id, { tools: TOOLS });
  if (request.method === 'notifications/initialized') return rpcOk(request.id, {});
  if (request.method !== 'tools/call') return rpcError(request.id, -32601, `Method not found: ${request.method}`);

  const name = (request.params as { name?: string } | undefined)?.name;
  const args = (request.params as { arguments?: Record<string, unknown> } | undefined)?.arguments ?? {};

  try {
    if (name === 'cursor_list_agents') {
      const limit = Math.min(50, Math.max(1, Number(args.limit ?? 20) || 20));
      const data = await cursorApiRequest<{ items?: unknown[]; nextCursor?: string }>(`/v1/agents?limit=${limit}&includeArchived=false`);
      return toolResult(request.id, data);
    }

    if (name === 'cursor_get_agent') {
      const agentId = AgentIdSchema.parse(args.agent_id);
      const agent = await cursorApiRequest<Record<string, unknown>>(`/v1/agents/${agentId}`);
      const runId = typeof agent.latestRunId === 'string' ? agent.latestRunId : null;
      const run = runId ? await cursorApiRequest<Record<string, unknown>>(`/v1/agents/${agentId}/runs/${encodeURIComponent(runId)}`) : null;
      return toolResult(request.id, { agent, latestRun: runSummary(run) });
    }

    if (name === 'cursor_prepare_dispatch') {
      const plan = dispatchPlan(args);
      return toolResult(request.id, {
        taskId: plan.taskId,
        agentId: plan.agentId,
        repoUrl: plan.repoUrl,
        startingRef: plan.startingRef,
        isolatedBranch: true,
        autoCreatePr: plan.autoCreatePr,
        acceptanceEvidence: plan.acceptanceEvidence,
        launchEnabled: process.env.CURSOR_AUTONOMOUS_DISPATCH_ENABLED === 'true',
      });
    }

    if (name === 'cursor_launch_agent') {
      if (process.env.CURSOR_AUTONOMOUS_DISPATCH_ENABLED !== 'true') {
        return toolResult(request.id, 'Cursor launch is disabled. Configure credentials, spend limits, and CURSOR_AUTONOMOUS_DISPATCH_ENABLED=true after review.', true);
      }

      const plan = dispatchPlan(args);
      const configuredCap = Number(process.env.CURSOR_MAX_ACTIVE_AGENTS ?? 4);
      const activeCap = Number.isFinite(configuredCap) ? Math.min(16, Math.max(1, Math.floor(configuredCap))) : 4;
      const agents = await cursorApiRequest<{ items?: Array<{ status?: string }> }>('/v1/agents?limit=100&includeArchived=false');
      const active = (agents.items ?? []).filter((agent) => agent.status === 'ACTIVE').length;
      if (active >= activeCap) return toolResult(request.id, `Dispatch blocked: ${active} active Cursor agents meets the configured cap of ${activeCap}.`, true);

      try {
        const launched = await launchCursorAgent(plan);
        return toolResult(request.id, { idempotentTaskId: plan.taskId, launched });
      } catch (error) {
        if (error instanceof CursorApiError && error.status === 409) {
          const existing = await cursorApiRequest<Record<string, unknown>>(`/v1/agents/${plan.agentId}`);
          return toolResult(request.id, { idempotentTaskId: plan.taskId, duplicatePrevented: true, agent: existing });
        }
        throw error;
      }
    }

    return rpcError(request.id, -32601, `Unknown tool: ${name}`);
  } catch (error) {
    if (error instanceof z.ZodError) return toolResult(request.id, error.issues.map((issue) => issue.message).join('; '), true);
    if (error instanceof CursorApiError) return toolResult(request.id, error.message, true);
    return toolResult(request.id, error instanceof Error ? error.message : 'Orchestrator request failed.', true);
  }
}

export async function POST(req: NextRequest) {
  const auth = authorize(req);
  if (!auth.ok) return authFailure(auth);

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await req.json();
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }
  if (Array.isArray(body)) {
    if (body.length === 0) return rpcError(null, -32600, 'Invalid Request');

    // Run batch calls in order. In particular, do not let a caller place several
    // launch checks in one parallel batch and race the active-agent guardrail.
    const payloads: unknown[] = [];
    for (const request of body) {
      const result = await handle(request);
      payloads.push(await result.json());
    }
    return NextResponse.json(payloads);
  }
  return handle(body);
}

export async function GET(req: NextRequest) {
  const auth = authorize(req);
  if (!auth.ok) return authFailure(auth);
  return NextResponse.json({ protocol: 'mcp', transport: 'http+json-rpc-2.0', server: SERVER_INFO, tools: TOOLS.map(({ name, description }) => ({ name, description })) });
}
