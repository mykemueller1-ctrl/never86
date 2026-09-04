import { BAMBA_AUG12_SYSTEM_CY_SALES } from './fixtureAug12Daily';
import { assertBambaMemory, assertBambaTenant, findForeignTenantLeak } from './tenant';
import {
  SALES_LABOR_BUSINESS_DATE,
  SALES_LABOR_TENANT_ID,
  type BambaMemorySnapshot,
  type GraphitiFact,
  type SalesLaborTenantId,
} from './types';

export const GRAPHITI_PROVIDER = 'zep-graphiti' as const;
export const AGENTMEMORY_MCP = 'agentmemory' as const;
export const BAMBA_GRAPH_GROUP = SALES_LABOR_TENANT_ID;
export const BAMBA_MEMORY_ISOLATION =
  'Zep Graphiti group_id=bamba. Facts carry validity windows. Bamba never bleeds to other tenants.';

const DAILY_WINDOW = {
  validFrom: `${SALES_LABOR_BUSINESS_DATE}T00:00:00-04:00`,
  validUntil: '2026-08-13T00:00:00-04:00',
};

function seedFacts(): GraphitiFact[] {
  return [
    {
      tenantId: SALES_LABOR_TENANT_ID,
      groupId: BAMBA_GRAPH_GROUP,
      factId: 'aug12-system-cy-sales',
      subject: 'bamba-system',
      predicate: 'cy_sales',
      object: String(BAMBA_AUG12_SYSTEM_CY_SALES),
      window: DAILY_WINDOW,
      source: 'Sales Labor Report (MP) v5 Daily',
    },
    {
      tenantId: SALES_LABOR_TENANT_ID,
      groupId: BAMBA_GRAPH_GROUP,
      factId: 'aug12-landmark-highest-void-rate',
      subject: 'Landmark',
      predicate: 'highest_daily_void_rate',
      object: 'true',
      window: DAILY_WINDOW,
      source: 'Sales Labor Report (MP) v5 Daily',
    },
  ];
}

export class BambaGraphitiMemory {
  private readonly facts = new Map<string, GraphitiFact>();

  constructor(facts: GraphitiFact[] = seedFacts()) {
    for (const fact of facts) this.remember(fact);
  }

  remember(fact: GraphitiFact): GraphitiFact {
    assertBambaTenant(fact.tenantId);
    if (fact.groupId !== BAMBA_GRAPH_GROUP) {
      throw new Error(`Lane C isolation: refused Graphiti group "${fact.groupId}". Bamba graph only.`);
    }
    assertBambaMemory(fact);
    this.facts.set(fact.factId, fact);
    return fact;
  }

  recall(atIso: string, tenantId: string = SALES_LABOR_TENANT_ID): GraphitiFact[] {
    assertBambaTenant(tenantId);
    const at = Date.parse(atIso);
    return [...this.facts.values()].filter((fact) => {
      const from = Date.parse(fact.window.validFrom);
      const until = fact.window.validUntil ? Date.parse(fact.window.validUntil) : Number.POSITIVE_INFINITY;
      return at >= from && at < until;
    });
  }

  refuseForeignWrite(tenantId: string, payload: unknown): never {
    const leak = findForeignTenantLeak(JSON.stringify(payload));
    throw new Error(
      `Lane C isolation: refused write for tenant "${tenantId}"${leak ? ` with foreign token "${leak}"` : ''}.`,
    );
  }

  list(): GraphitiFact[] {
    return [...this.facts.values()];
  }

  snapshot(): BambaMemorySnapshot {
    return {
      provider: GRAPHITI_PROVIDER,
      mcp: AGENTMEMORY_MCP,
      tenantId: SALES_LABOR_TENANT_ID,
      groupId: BAMBA_GRAPH_GROUP,
      isolation: BAMBA_MEMORY_ISOLATION,
      factCount: this.facts.size,
    };
  }
}

export function createBambaGraphitiMemory(): BambaGraphitiMemory {
  return new BambaGraphitiMemory();
}

export function isFactLiveForTenant(fact: GraphitiFact, tenantId: SalesLaborTenantId, atIso: string): boolean {
  if (fact.tenantId !== tenantId || fact.groupId !== tenantId) return false;
  const at = Date.parse(atIso);
  const from = Date.parse(fact.window.validFrom);
  const until = fact.window.validUntil ? Date.parse(fact.window.validUntil) : Number.POSITIVE_INFINITY;
  return at >= from && at < until;
}
