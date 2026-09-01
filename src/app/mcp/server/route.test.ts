import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

const endpoint = 'https://www.never86.ai/mcp/server';

function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('Never86 MCP Streamable HTTP adapter', () => {
  it('negotiates a supported protocol version during initialize', async () => {
    const response = await POST(post({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const payload = await response.json();
    expect(payload.result.protocolVersion).toBe('2025-11-25');
    expect(payload.result.serverInfo.name).toBe('never86');
    expect(payload.result.instructions).toContain('evidence-first');
  });

  it('advertises titled tools with explicit read-only safety hints', async () => {
    const response = await POST(post({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }, {
      'mcp-protocol-version': '2025-11-25',
    }));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.result.tools).toHaveLength(13);
    const operatorSystem = payload.result.tools.find((tool: { name: string }) => tool.name === 'get_operator_system');
    expect(operatorSystem.title).toBe('Get Never86 operator system');
    expect(operatorSystem.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    });
  });

  it('acknowledges JSON-RPC notifications with HTTP 202 and no body', async () => {
    const response = await POST(post({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    }));

    expect(response.status).toBe(202);
    expect(await response.text()).toBe('');
  });

  it('returns 405 for GET when no standalone SSE stream is offered', async () => {
    const response = await GET(new NextRequest(endpoint, {
      method: 'GET',
      headers: { accept: 'text/event-stream' },
    }));

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });

  it('rejects an unapproved Origin header', async () => {
    const response = await POST(post({
      jsonrpc: '2.0',
      id: 3,
      method: 'ping',
      params: {},
    }, {
      origin: 'https://attacker.example',
    }));

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.error.message).toBe('Origin not allowed.');
  });
});
