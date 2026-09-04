import { describe, expect, it } from 'vitest';
import { BAMBA_AUG12_SYSTEM_CY_SALES } from './bambaSalesLabor/fixtureAug12Daily';
import { getBambaSalesLaborAgents } from './bambaSalesLabor/agents';
import { FOREIGN_TENANT_PATTERN } from './bambaSalesLabor/tenant';
import { buildPrimeCostBoard, getPrimeCostDesk, PRIME_COST_CATEGORIES } from './primeCostDesks';

describe('prime-cost desk family', () => {
  const board = buildPrimeCostBoard();

  it('lists sales, labor, food, liquor, beer, and inventory without inventing a swarm', () => {
    expect(board.desks.map((desk) => desk.category)).toEqual([...PRIME_COST_CATEGORIES]);
    expect(board.notANewProduct).toBe(true);
    expect(board.inventThousandAgents).toBe(false);
    expect(getBambaSalesLaborAgents().seats.map((seat) => seat.seatId)).toEqual(['builder-1', 'qa-1']);
  });

  it('keeps the Aug 12 sales canary and leaves uncounted desks Open', () => {
    expect(getPrimeCostDesk('sales').kpis[0]?.value).toBe(BAMBA_AUG12_SYSTEM_CY_SALES);
    expect(getPrimeCostDesk('sales').completeness).toBe('done');
    expect(getPrimeCostDesk('sales').href).toBe('/command-center/sales-labor');
    for (const category of ['labor', 'food', 'liquor', 'beer', 'inventory'] as const) {
      const desk = getPrimeCostDesk(category);
      expect(desk.completeness).toBe('open');
      expect(desk.kpis.every((kpi) => kpi.value == null && kpi.evidence === 'open')).toBe(true);
    }
    expect(board.primeCostPct.value).toBeNull();
    expect(board.primeCostPct.evidence).toBe('open');
    expect(getPrimeCostDesk('food').gate).toMatch(/No count → no food cost/);
    expect(getPrimeCostDesk('food').gate).toMatch(/Invoice ≠ COGS/);
  });

  it('stays in Bamba Lane C and refuses foreign tenants', () => {
    expect(board.tenantId).toBe('bamba');
    expect(JSON.stringify(board)).not.toMatch(FOREIGN_TENANT_PATTERN);
    expect(() => buildPrimeCostBoard('ctap')).toThrow(/Lane C isolation/);
  });
});
