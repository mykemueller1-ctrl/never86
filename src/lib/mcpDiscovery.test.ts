import { describe, expect, it } from 'vitest';
import { NEVER86_MCP_DISCOVERY, NEVER86_MCP_URL } from './mcpDiscovery';

describe('mcpDiscovery', () => {
  it('points at the public MCP endpoint', () => {
    expect(NEVER86_MCP_DISCOVERY.endpoint).toBe(NEVER86_MCP_URL);
    expect(NEVER86_MCP_DISCOVERY.servers[0]?.url).toBe(NEVER86_MCP_URL);
  });

  it('documents all four LLM install paths', () => {
    expect(NEVER86_MCP_DISCOVERY.clients.grok.install_url).toContain('grok.com');
    expect(NEVER86_MCP_DISCOVERY.clients.chatgpt.install_url).toContain('chatgpt.com');
    expect(NEVER86_MCP_DISCOVERY.clients.claude.install_url).toContain('claude.ai');
    expect(NEVER86_MCP_DISCOVERY.clients.gemini.install_url).toContain('gemini.google.com');
  });
});
