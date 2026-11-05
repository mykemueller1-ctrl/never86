import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('orchestrator oauth-protected-resource metadata', () => {
  it('advertises only the private orchestrator MCP resource', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      resource: 'https://www.never86.ai/api/orchestrator/mcp',
      authorization_servers: ['https://www.never86.ai'],
      bearer_methods_supported: ['header'],
      scopes_supported: ['cursor:read', 'cursor:dispatch'],
    });
  });
});
