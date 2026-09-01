import { NextRequest } from 'next/server';
import { POST as legacyPost } from '@/app/api/mcp/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPPORTED_PROTOCOL_VERSIONS = [
  '2026-07-28',
  '2025-11-25',
  '2025-06-18',
  '2025-03-26',
] as const;

const TOOL_TITLES: Record<string, string> = {
  list_answers: 'List public answers',
  get_answer: 'Get public answer',
  search_answers: 'Search public answers',
  list_free_agents: 'List free restaurant agents',
  get_agent: 'Get restaurant agent',
  list_seats: 'List operator roles',
  list_source_tags: 'List evidence source tags',
  build_action_shift: 'Build prior-day Action Shift',
  build_vendor_silence_ticket: 'Evaluate vendor silence',
  calculate_3p_marketplace_cost: 'Calculate marketplace cost',
  get_3p_audit_logic: 'Get marketplace audit logic',
  get_operator_logic: 'Get operator rulebook',
  get_operator_system: 'Get Never86 operator system',
};

const SERVER_INSTRUCTIONS = [
  "Never86'd is evidence-first restaurant operator intelligence.",
  'Use operator-approved targets only; never invent store-specific rules.',
  'Treat variances as review signals, not proof of theft, fraud, contract violations, or guaranteed savings.',
  'Keep statement math, payout/bank reconciliation, and contract compliance as separate claims.',
  'Public tools are read-only. Human approval is required before external operational actions.',
].join(' ');

type JsonRpcObject = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
  result?: unknown;
  error?: unknown;
};

function rpcError(code: number, message: string, status = 400, id: unknown = null) {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }),
    {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}

function allowedOrigins(request: NextRequest): Set<string> {
  const requestUrl = new URL(request.url);
  const configured = (process.env.MCP_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set([
    `${requestUrl.protocol}//${requestUrl.host}`,
    'https://www.never86.ai',
    'https://never86.ai',
    'https://chatgpt.com',
    'https://chat.openai.com',
    'https://platform.openai.com',
    ...configured,
  ]);
}

function validateOrigin(request: NextRequest): Response | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  if (allowedOrigins(request).has(origin)) return null;

  if (process.env.NODE_ENV !== 'production') {
    try {
      const parsed = new URL(origin);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return null;
    } catch {
      // Fall through to the explicit rejection below.
    }
  }

  return rpcError(-32000, 'Origin not allowed.', 403);
}

function requestedProtocolVersion(body: JsonRpcObject): string | null {
  if (body.method !== 'initialize' || !body.params || typeof body.params !== 'object') return null;
  const value = (body.params as { protocolVersion?: unknown }).protocolVersion;
  return typeof value === 'string' ? value : null;
}

function negotiatedProtocolVersion(requested: string | null): string {
  if (requested && SUPPORTED_PROTOCOL_VERSIONS.includes(requested as (typeof SUPPORTED_PROTOCOL_VERSIONS)[number])) {
    return requested;
  }
  // 2025-11-25 is the broad compatibility target for clients that request
  // an unsupported revision. The endpoint also accepts the 2026-07-28 revision.
  return '2025-11-25';
}

function validateProtocolHeader(request: NextRequest, method: unknown): Response | null {
  if (method === 'initialize') return null;
  const version = request.headers.get('mcp-protocol-version');
  if (!version) return null; // MCP fallback is 2025-03-26 when absent.
  if (SUPPORTED_PROTOCOL_VERSIONS.includes(version as (typeof SUPPORTED_PROTOCOL_VERSIONS)[number])) return null;
  return rpcError(-32600, `Unsupported MCP protocol version: ${version}`, 400);
}

function enrichPayload(payload: unknown, body: JsonRpcObject): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const output = payload as Record<string, unknown>;
  const result = output.result;

  if (body.method === 'initialize' && result && typeof result === 'object' && !Array.isArray(result)) {
    const resultObject = result as Record<string, unknown>;
    resultObject.protocolVersion = negotiatedProtocolVersion(requestedProtocolVersion(body));
    resultObject.instructions = SERVER_INSTRUCTIONS;
  }

  if (body.method === 'tools/list' && result && typeof result === 'object' && !Array.isArray(result)) {
    const resultObject = result as { tools?: unknown };
    if (Array.isArray(resultObject.tools)) {
      resultObject.tools = resultObject.tools.map((tool) => {
        if (!tool || typeof tool !== 'object' || Array.isArray(tool)) return tool;
        const typedTool = tool as Record<string, unknown>;
        const name = typeof typedTool.name === 'string' ? typedTool.name : '';
        return {
          ...typedTool,
          ...(typedTool.title ? {} : { title: TOOL_TITLES[name] ?? name }),
        };
      });
    }
  }

  return output;
}

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return rpcError(-32600, 'MCP POST requests must use application/json.', 415);
  }

  let body: JsonRpcObject;
  try {
    const parsed = await request.clone().json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return rpcError(-32600, 'MCP Streamable HTTP accepts one JSON-RPC message per POST.', 400);
    }
    body = parsed as JsonRpcObject;
  } catch {
    return rpcError(-32700, 'Parse error.', 400);
  }

  if (body.jsonrpc !== '2.0') return rpcError(-32600, 'Invalid JSON-RPC version.', 400, body.id);

  const protocolError = validateProtocolHeader(request, body.method);
  if (protocolError) return protocolError;

  // Client responses are accepted. Never86'd does not currently send server-to-client requests.
  if (typeof body.method !== 'string') {
    if ('result' in body || 'error' in body) return new Response(null, { status: 202 });
    return rpcError(-32600, 'Invalid JSON-RPC request.', 400, body.id);
  }

  // MCP notifications have no id and are acknowledged at the HTTP layer.
  if (!('id' in body) || body.id === undefined) {
    return new Response(null, { status: 202 });
  }

  if (body.method === 'ping') {
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id ?? null, result: {} }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  // Reuse the mature v3 tool implementation. This endpoint only adapts HTTP
  // transport behavior; business logic remains canonical in /api/mcp.
  const legacyResponse = await legacyPost(request);
  let payload: unknown;
  try {
    payload = await legacyResponse.json();
  } catch {
    return rpcError(-32603, 'MCP handler returned an invalid response.', 500, body.id);
  }

  return new Response(JSON.stringify(enrichPayload(payload, body)), {
    status: legacyResponse.status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      vary: 'Origin, MCP-Protocol-Version',
    },
  });
}

export async function GET(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;
  return new Response(null, {
    status: 405,
    headers: {
      allow: 'POST',
      'cache-control': 'no-store',
    },
  });
}

export async function DELETE(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;
  return new Response(null, {
    status: 405,
    headers: {
      allow: 'POST',
      'cache-control': 'no-store',
    },
  });
}
