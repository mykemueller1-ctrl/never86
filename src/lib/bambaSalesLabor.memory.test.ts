import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BAMBA_AGENTMEMORY_CONFIG_PATH, dispatchAgentMemory, getBambaAgentMemoryContract } from './bambaSalesLabor/agentmemoryMcp';
import { createBambaGraphitiMemory } from './bambaSalesLabor/graphitiMemory';
import { BAMBA_STORE_ROSTER } from './bambaSalesLabor/roster';
import { assertBambaTenant, FOREIGN_TENANT_PATTERN } from './bambaSalesLabor/tenant';
import { SALES_LABOR_TENANT_ID, type GraphitiFact } from './bambaSalesLabor/types';

const ROOT = path.resolve(__dirname, '../..');

describe('bamba Graphiti + agentmemory isolation', () => {
  it('recalls Aug 12 facts only inside their validity window', () => {
    const memory = createBambaGraphitiMemory();
    const live = memory.recall('2026-08-12T12:00:00-04:00');
    expect(live.map((fact) => fact.factId).sort()).toEqual([
      'aug12-landmark-highest-void-rate',
      'aug12-system-cy-sales',
    ]);
    expect(live.find((fact) => fact.predicate === 'cy_sales')?.object).toBe('125273.41');
    expect(memory.recall('2026-08-13T00:00:00-04:00')).toEqual([]);
  });

  it('refuses a foreign tenant write and never stores that payload', () => {
    const memory = createBambaGraphitiMemory();
    expect(() => assertBambaTenant('ctap')).toThrow(/Bamba memory only/);
    expect(() =>
      memory.remember({
        tenantId: 'ctap' as never,
        groupId: 'ctap' as never,
        factId: 'leak',
        subject: 'x',
        predicate: 'y',
        object: '1',
        window: { validFrom: '2026-08-12T00:00:00-04:00', validUntil: null },
        source: 'test',
      }),
    ).toThrow(/Lane C isolation/);
    expect(() =>
      dispatchAgentMemory(memory, {
        tool: 'recall_facts',
        tenantId: 'grill',
        at: '2026-08-12T12:00:00-04:00',
      }),
    ).toThrow(/Bamba memory only/);
  });

  it('wires the agentmemory MCP contract to the Bamba Graphiti group', () => {
    const contract = getBambaAgentMemoryContract();
    expect(contract.mcp).toBe('agentmemory');
    expect(contract.provider).toBe('zep-graphiti');
    expect(contract.tenantId).toBe(SALES_LABOR_TENANT_ID);
    expect(contract.groupId).toBe('bamba');
    expect(contract.liveWrite).toBe(false);
    expect(contract.tools.map((tool) => tool.name)).toEqual([
      'remember_fact',
      'recall_facts',
      'list_validity_windows',
    ]);

    const written = JSON.parse(readFileSync(path.join(ROOT, BAMBA_AGENTMEMORY_CONFIG_PATH), 'utf8')) as {
      tenantId: string;
      groupId: string;
    };
    const mcp = readFileSync(path.join(ROOT, '.cursor/mcp.json'), 'utf8');
    expect(written.tenantId).toBe('bamba');
    expect(written.groupId).toBe('bamba');
    expect(mcp).toContain('bamba-agentmemory');
    expect(mcp).toContain('scripts/bamba-agentmemory-mcp.mjs');
    expect(mcp).not.toMatch(FOREIGN_TENANT_PATTERN);
  });

  it('keeps the 16-store roster and seeded facts free of foreign-tenant dollars', () => {
    const memory = createBambaGraphitiMemory();
    const fact: GraphitiFact = memory.list()[0];
    expect(BAMBA_STORE_ROSTER).toHaveLength(16);
    expect(JSON.stringify({ roster: BAMBA_STORE_ROSTER, facts: memory.list(), fact })).not.toMatch(FOREIGN_TENANT_PATTERN);
  });
});
