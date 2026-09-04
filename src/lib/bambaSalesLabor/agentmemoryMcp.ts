import { AGENTMEMORY_MCP, BAMBA_GRAPH_GROUP, BAMBA_MEMORY_ISOLATION, BambaGraphitiMemory, GRAPHITI_PROVIDER } from './graphitiMemory';
import { assertBambaTenant } from './tenant';
import { SALES_LABOR_TENANT_ID, type GraphitiFact } from './types';

export const BAMBA_AGENTMEMORY_MCP_NAME = 'bamba-agentmemory';
export const BAMBA_AGENTMEMORY_CONFIG_PATH = 'config/bamba-agentmemory.json';

export const BAMBA_AGENTMEMORY_TOOLS = [
  {
    name: 'remember_fact',
    description: 'Write one Bamba Graphiti fact with a validity window. Tenant must be bamba.',
  },
  {
    name: 'recall_facts',
    description: 'Recall live Bamba facts at a timestamp. Other tenants are refused.',
  },
  {
    name: 'list_validity_windows',
    description: 'List validity windows for the Bamba graph only.',
  },
] as const;

export type AgentMemoryToolName = (typeof BAMBA_AGENTMEMORY_TOOLS)[number]['name'];

export type AgentMemoryCall =
  | { tool: 'remember_fact'; tenantId: string; fact: GraphitiFact }
  | { tool: 'recall_facts'; tenantId: string; at: string }
  | { tool: 'list_validity_windows'; tenantId: string };

export function getBambaAgentMemoryContract() {
  return {
    mcp: AGENTMEMORY_MCP,
    serverName: BAMBA_AGENTMEMORY_MCP_NAME,
    provider: GRAPHITI_PROVIDER,
    tenantId: SALES_LABOR_TENANT_ID,
    groupId: BAMBA_GRAPH_GROUP,
    isolation: BAMBA_MEMORY_ISOLATION,
    tools: BAMBA_AGENTMEMORY_TOOLS,
    sharedBy: ['cursor-builder', 'grok-swarm'],
    liveWrite: false,
  };
}

export function dispatchAgentMemory(memory: BambaGraphitiMemory, call: AgentMemoryCall) {
  assertBambaTenant(call.tenantId);
  if (call.tool === 'remember_fact') {
    return { ok: true as const, fact: memory.remember(call.fact), snapshot: memory.snapshot() };
  }
  if (call.tool === 'recall_facts') {
    return { ok: true as const, facts: memory.recall(call.at, call.tenantId), snapshot: memory.snapshot() };
  }
  return {
    ok: true as const,
    windows: memory.list().map((fact) => ({
      factId: fact.factId,
      window: fact.window,
    })),
    snapshot: memory.snapshot(),
  };
}
