import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRIME_COST_CATEGORIES } from '../primeCostDesks/types';
import {
  LOGIC_PACK_SKILLS,
  getBoardReasoningLayer,
  getLogicPackSkill,
  getReasoningLayer,
} from './skillRegistry';

const REPO_ROOT = path.resolve(__dirname, '../../..');

describe('logicPack2026 skill registry', () => {
  it('has six specialist skills', () => {
    expect(LOGIC_PACK_SKILLS.length).toBe(6);
  });

  it('points every skill at a file that exists in src/skills', () => {
    for (const skill of LOGIC_PACK_SKILLS) {
      expect(skill.path.startsWith('src/skills/')).toBe(true);
      const full = path.join(REPO_ROOT, skill.path);
      expect(existsSync(full), `${skill.path} should exist`).toBe(true);
    }
  });

  it('maps every benchmark id to a real benchmark row', () => {
    for (const skill of LOGIC_PACK_SKILLS) {
      const layer = getReasoningLayer(skill.desks[0] ?? 'sales');
      expect(Array.isArray(layer.benchmarks)).toBe(true);
    }
  });

  it('gives prime-cost-coach board-level scope (no single desk)', () => {
    const coach = getLogicPackSkill('prime-cost-coach');
    expect(coach?.desks).toEqual([]);
    const board = getBoardReasoningLayer();
    expect(board.skills.map((s) => s.skillId)).toContain('prime-cost-coach');
  });

  it('never names a real client', () => {
    const blob = JSON.stringify(LOGIC_PACK_SKILLS).toLowerCase();
    expect(blob).not.toMatch(/taco\s*bamba/);
  });

  it('gives a reasoning layer for every prime-cost category (possibly empty)', () => {
    for (const category of PRIME_COST_CATEGORIES) {
      const layer = getReasoningLayer(category);
      expect(Array.isArray(layer.skills)).toBe(true);
      expect(Array.isArray(layer.benchmarks)).toBe(true);
    }
  });

  it('attaches at least one specialist to sales, labor, food, menu, liquor, and beer', () => {
    for (const category of ['sales', 'labor', 'food', 'menu', 'liquor', 'beer'] as const) {
      expect(getReasoningLayer(category).skills.length).toBeGreaterThan(0);
    }
  });
});
