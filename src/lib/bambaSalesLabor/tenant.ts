import { SALES_LABOR_TENANT_ID, type SalesLaborTenantId } from './types';

export const BAMBA_TENANT_LABEL = 'Taco Bamba';
export const BAMBA_LANE = 'C' as const;
export const BAMBA_MEMORY_BOUNDARY =
  'Lane C isolation: Bamba files stay in Bamba tenant memory. Foreign-tenant dollars never enter this desk.';

/** Tokens that prove a foreign tenant leaked into Bamba memory. */
export const FOREIGN_TENANT_PATTERN =
  /\b(ctap|c-tap|community\s*tap|community\s*pizza|new\s*american\s*grill|grill\s*cash|sample\s*store\s*one)\b/i;

export function isBambaTenant(tenantId: string): tenantId is SalesLaborTenantId {
  return tenantId === SALES_LABOR_TENANT_ID;
}

export function assertBambaTenant(tenantId: string): asserts tenantId is SalesLaborTenantId {
  if (!isBambaTenant(tenantId)) {
    throw new Error(`Lane C isolation: refused tenant "${tenantId}". Bamba memory only.`);
  }
}

export function findForeignTenantLeak(text: string): string | null {
  const match = text.match(FOREIGN_TENANT_PATTERN);
  return match ? match[0] : null;
}

export function assertBambaMemory(payload: unknown): void {
  const leak = findForeignTenantLeak(JSON.stringify(payload));
  if (leak) {
    throw new Error(`Lane C isolation: foreign tenant token "${leak}" is not allowed in Bamba memory.`);
  }
}
