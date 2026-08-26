import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

function request(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/orchestrator/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function toolCall(name: string, args: Record<string, unknown> = {}) {
  return {
    jsonrpc: '2.0' as const,
    id: 1,
    method: 'tools/call',
    params: { name, arguments: args },
  };
}

const dispatch = {
  task_id: 'bridge-smoke-test',
  goal: 'Add one harmless bridge documentation verification.',
  acceptance_evidence: ['Tests pass', 'A new isolated branch is pushed'],
};

describe('private orchestrator MCP route', () => {
  beforeEach(() => {
    process.env.NEVER86_ORCHESTRATOR_TOKEN = 'test-orchestrator-token-not-real';
    process.env.CURSOR_API_KEY = 'test-cursor-token-not-real';
    delete process.env.CURSOR_AUTONOMOUS_DISPATCH_ENABLED;
    delete process.env.CURSOR_MAX_ACTIVE_AGENTS;
    delete process.env.CURSOR_ALLOWED_STARTING_REFS;
    delete process.env.CURSOR_REPO_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEVER86_ORCHESTRATOR_TOKEN;
    delete process.env.CURSOR_API_KEY;
    delete process.env.CURSOR_AUTONOMOUS_DISPATCH_ENABLED;
    delete process.env.CURSOR_MAX_ACTIVE_AGENTS;
  });

  it('fails closed before parsing tools when bearer auth is missing', async () => {
    const response = await POST(request({ jsonrpc: '2.0', id: 1, method: 'tools/list' }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized.' });
  });

  it('lists private tools for the configured Grok connector', async () => {
    const response = await POST(request({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, 'test-orchestrator-token-not-real'));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'cursor_list_agents',
      'cursor_get_agent',
      'cursor_prepare_dispatch',
      'cursor_launch_agent',
    ]);
  });

  it('prepares an allowlisted job without calling Cursor or spending', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(toolCall('cursor_prepare_dispatch', dispatch), 'test-orchestrator-token-not-real'));
    const payload = await response.json();
    const prepared = JSON.parse(payload.result.content[0].text);
    expect(prepared.startingRef).toBe('codex/action-shift-122-safe');
    expect(prepared.isolatedBranch).toBe(true);
    expect(prepared.launchEnabled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks launch while the server-side dispatch switch is off', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(toolCall('cursor_launch_agent', dispatch), 'test-orchestrator-token-not-real'));
    const payload = await response.json();
    expect(payload.result.isError).toBe(true);
    expect(payload.result.content[0].text).toContain('launch is disabled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('enforces the active-agent cap before launch', async () => {
    process.env.CURSOR_AUTONOMOUS_DISPATCH_ENABLED = 'true';
    process.env.CURSOR_MAX_ACTIVE_AGENTS = '1';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ status: 'ACTIVE' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    const response = await POST(request(toolCall('cursor_launch_agent', dispatch), 'test-orchestrator-token-not-real'));
    const payload = await response.json();
    expect(payload.result.isError).toBe(true);
    expect(payload.result.content[0].text).toContain('configured cap of 1');
  });

  it('launches only an isolated allowlisted agent with the Never86 MCP', async () => {
    process.env.CURSOR_AUTONOMOUS_DISPATCH_ENABLED = 'true';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        agent: { id: 'bc-11111111-1111-4111-8111-111111111111', status: 'ACTIVE' },
        run: { id: 'run-1', status: 'CREATING' },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(request(toolCall('cursor_launch_agent', dispatch), 'test-orchestrator-token-not-real'));
    const payload = await response.json();
    expect(payload.result.isError).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const createOptions = fetchMock.mock.calls[1][1] as RequestInit;
    const createBody = JSON.parse(String(createOptions.body));
    expect(createBody.repos).toEqual([{ url: 'https://github.com/mykemueller1-ctrl/never86', startingRef: 'codex/action-shift-122-safe' }]);
    expect(createBody.workOnCurrentBranch).toBe(false);
    expect(createBody.autoCreatePR).toBe(true);
    expect(createBody.mcpServers).toEqual([{ name: 'never86-operator-system', type: 'http', url: 'https://www.never86.ai/api/mcp' }]);
  });
});
