import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET, POST } from './route';
import { MCP_PUBLIC_TOOLS } from '@/lib/mcpPublicContract';

describe('public MCP route', () => {
  it('discovers the shared read-only tool contract', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.endpoint).toBe('https://www.never86.ai/api/mcp');
    expect(body.tools.map((tool: { name: string }) => tool.name)).toEqual(
      MCP_PUBLIC_TOOLS.map((tool) => tool.name),
    );
  });

  it('lists tools with READ-ONLY annotations only', async () => {
    const response = await POST(new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }));
    const body = await response.json();
    expect(body.result.tools).toHaveLength(MCP_PUBLIC_TOOLS.length);
    for (const tool of body.result.tools) {
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(tool.annotations.destructiveHint).toBe(false);
    }
  });
});
