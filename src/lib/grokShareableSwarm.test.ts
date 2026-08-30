import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GROK_SHAREABLE_SWARM_PATH,
  HARNESS_STATES,
  assertNoEmbeddedSecrets,
  botsMatching,
  findEightySixMatches,
  getGrokShareableSwarm,
  harnessSummary,
  listRecommendedBots,
  listSwarmConnectors,
  listSwarmTeam,
} from './grokShareableSwarm';
import { getRoleById } from './companyOrg';

const REPO_ROOT = path.resolve(__dirname, '../..');

describe('grok shareable swarm catalog', () => {
  it('lists at least 10 recommended shareable bots with names and descriptions', () => {
    const bots = listRecommendedBots();
    expect(bots.length).toBeGreaterThanOrEqual(10);
    for (const bot of bots) {
      expect(bot.name.length).toBeGreaterThan(2);
      expect(bot.description.length).toBeGreaterThan(20);
      expect(bot.shareUrl).toMatch(/^https:\/\/x\.ai\/bot\//);
      expect(HARNESS_STATES).toContain(bot.harnessStatus);
    }
  });

  it('records that no public bot matches branded 86 / Never86', () => {
    const matches = findEightySixMatches();
    expect(matches.found).toBe(false);
    expect(matches.nameOrDescriptionHits).toBe(0);
    expect(matches.note.toLowerCase()).toContain('never86');
    expect(matches.falsePositives.length).toBeGreaterThan(0);
  });

  it('identifies swarm, team, API, orchestrator, and Cursor bots', () => {
    expect(botsMatching('swarm').length).toBeGreaterThan(0);
    expect(botsMatching('team').length).toBeGreaterThan(0);
    expect(botsMatching('api').length).toBeGreaterThan(0);
    expect(botsMatching('orchestrator').length).toBeGreaterThan(0);
    expect(botsMatching('cursor').length).toBeGreaterThan(0);
  });

  it('maps every recommended bot and seat onto a company org role', () => {
    const pack = getGrokShareableSwarm();
    for (const bot of pack.recommended) {
      expect(getRoleById(bot.mapsToRole), bot.mapsToRole).toBeDefined();
    }
    for (const seat of pack.team) {
      expect(getRoleById(seat.mapsToRole), seat.mapsToRole).toBeDefined();
      expect(seat.queue.length).toBeGreaterThan(8);
      expect(seat.stopCondition.length).toBeGreaterThan(8);
    }
  });

  it('keeps API key names only — never embedded credential material', () => {
    const raw = readFileSync(path.join(REPO_ROOT, GROK_SHAREABLE_SWARM_PATH), 'utf8');
    expect(assertNoEmbeddedSecrets(JSON.parse(raw))).toEqual([]);
    const namedSecrets = listSwarmConnectors().flatMap((item) => item.secretEnv ?? []);
    expect(namedSecrets).toEqual(
      expect.arrayContaining(['CURSOR_API_KEY', 'XAI_API_KEY', 'NEVER86_OAUTH_CLIENT_SECRET']),
    );
    expect(
      assertNoEmbeddedSecrets({ leak: 'sk-ant-placeholderFAKESECRET_a1b2c3d4e5f6g7h8i9j0' }),
    ).toEqual(['root.leak']);
  });

  it('distinguishes live public MCP from drafted key setup', () => {
    const connectors = listSwarmConnectors();
    const operator = connectors.find((item) => item.id === 'never86-operator-system');
    const xai = connectors.find((item) => item.id === 'xai-model-api');
    expect(operator?.status).toBe('live-verified');
    expect(xai?.status).toBe('drafted');
    expect(xai?.setup.toLowerCase()).toContain('approved secret storage');
  });

  it('summarizes the harness without claiming live desk adds', () => {
    const summary = harnessSummary();
    expect(summary.recommendedCount).toBeGreaterThanOrEqual(10);
    expect(summary.teamSeats).toBeGreaterThanOrEqual(4);
    expect(summary.eightySixBotsFound).toBe(false);
    expect(summary.overallStatus).toBe('drafted');
    expect(summary.nextOwner.toLowerCase()).toContain('myke');
  });

  it('keeps team seats inside the recommended bot ids', () => {
    const ids = new Set(listRecommendedBots().map((bot) => bot.id));
    for (const seat of listSwarmTeam()) {
      for (const borrowed of seat.borrowedFrom) {
        expect(ids.has(borrowed), borrowed).toBe(true);
      }
    }
  });
});
