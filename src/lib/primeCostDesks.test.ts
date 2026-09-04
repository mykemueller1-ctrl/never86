import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BAMBA_AUG12_SYSTEM_CY_SALES } from './bambaSalesLabor/fixtureAug12Daily';
import { getBambaSalesLaborAgents } from './bambaSalesLabor/agents';
import { FOREIGN_TENANT_PATTERN } from './bambaSalesLabor/tenant';
import {
  buildPrimeCostBoard,
  getPrimeCostDesk,
  listPrimeCostSubAgents,
  PRIME_COST_CATEGORIES,
  PRIME_COST_MAX_SUB_AGENTS,
  PRIME_COST_MAX_SUB_AGENTS_PER_TERMINAL,
} from './primeCostDesks';

describe('prime-cost terminals', () => {
  const board = buildPrimeCostBoard();

  it('is seven linked MVPs, not one swarm and not a thousand agents', () => {
    expect(board.desks.map((desk) => desk.category)).toEqual([...PRIME_COST_CATEGORIES]);
    expect(board.notANewProduct).toBe(true);
    expect(board.inventThousandAgents).toBe(false);
    expect(getBambaSalesLaborAgents().seats.map((seat) => seat.seatId)).toEqual(['builder-1', 'qa-1']);
    const seats = listPrimeCostSubAgents(board);
    expect(seats.length).toBeLessThanOrEqual(PRIME_COST_MAX_SUB_AGENTS);
    expect(new Set(seats.map((seat) => seat.seatId)).size).toBe(seats.length);
    for (const desk of board.desks) {
      expect(desk.mvp.length).toBeGreaterThan(20);
      expect(desk.skill.skillId).toBe(`prime-cost-${desk.category}`);
      expect(desk.subAgents.length).toBeGreaterThan(0);
      expect(desk.subAgents.length).toBeLessThanOrEqual(PRIME_COST_MAX_SUB_AGENTS_PER_TERMINAL);
      expect(desk.subAgents.every((seat) => !seat.publishAllowed && !seat.mergeAllowed)).toBe(true);
    }
  });

  it('lets terminals read each other without writing the sales canary', () => {
    const sales = getPrimeCostDesk('sales');
    expect(sales.kpis[0]?.value).toBe(BAMBA_AUG12_SYSTEM_CY_SALES);
    expect(sales.feeds).toEqual(expect.arrayContaining(['labor', 'food', 'menu']));
    expect(getPrimeCostDesk('food').dependsOn).toEqual(expect.arrayContaining(['sales', 'menu', 'inventory']));
    expect(getPrimeCostDesk('menu').feeds).toEqual(expect.arrayContaining(['food', 'liquor', 'beer']));
    expect(getPrimeCostDesk('inventory').feeds).toEqual(expect.arrayContaining(['food', 'liquor', 'beer']));
    expect(sales.subAgents.find((seat) => seat.seatId === 'sales-denom-1')?.stopCondition).toMatch(/downstream desk writes sales/);
  });

  it('keeps food, beer, liquor, menu, labor, and inventory Open until their own evidence lands', () => {
    for (const category of ['labor', 'food', 'menu', 'liquor', 'beer', 'inventory'] as const) {
      const desk = getPrimeCostDesk(category);
      expect(desk.completeness).toBe('open');
      expect(desk.kpis.every((kpi) => kpi.value == null && kpi.evidence === 'open')).toBe(true);
    }
    expect(getPrimeCostDesk('food').skill.gates.join(' ')).toMatch(/Invoice is not COGS/);
    expect(getPrimeCostDesk('beer').skill.gates.join(' ')).toMatch(/own terminal/);
    expect(board.primeCostPct.value).toBeNull();
  });

  it('keeps a skill file for every terminal', () => {
    const root = path.resolve(__dirname, '../..');
    for (const desk of board.desks) {
      expect(readFileSync(path.join(root, desk.skill.path), 'utf8')).toMatch(desk.skill.skillId);
    }
  });

  it('stays in Bamba Lane C and refuses foreign tenants', () => {
    expect(board.tenantId).toBe('bamba');
    expect(JSON.stringify(board)).not.toMatch(FOREIGN_TENANT_PATTERN);
    expect(() => buildPrimeCostBoard('ctap')).toThrow(/Lane C isolation/);
  });
});
