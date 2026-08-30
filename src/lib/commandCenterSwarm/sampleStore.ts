import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ActionShiftInput } from '../actionShift';
import type { FreeAgentSlug } from './types';
import { FREE_AGENT_SLUGS, SAMPLE_BUSINESS_DATE, SAMPLE_STORE_NAME } from './types';

const SAMPLE_DIR = join(process.cwd(), 'public/samples/swarm');

export const SAMPLE_STORE_CLOSE: ActionShiftInput = {
  store: SAMPLE_STORE_NAME,
  businessDate: SAMPLE_BUSINESS_DATE,
  grossSales: 8420,
  orderCount: 210,
  laborDollars: 2610,
  laborTargetPct: 28,
  expectedCash: 1840,
  enteredDeposit: 1765,
  cashEntered: true,
  payouts: 85,
  discounts: 120,
  promotions: 40,
  voids: 62,
  lateDeliveryCount: 6,
  lateDeliverySales: 280,
  averageDeliveryMinutes: 22,
  targetDeliveryMinutes: 18,
};

export const FREE_AGENT_SAMPLE_FILES: Record<FreeAgentSlug, string> = {
  'void-hunter': 'void-hunter.csv',
  'leak-detector': 'leak-detector.csv',
  '3p-fee-finder': '3p-fee-finder.csv',
  'labor-leak': 'labor-leak.csv',
  'tip-variance': 'tip-variance.csv',
  'catering-leak': 'catering-leak.csv',
  'rate-card-audit': 'rate-card-audit.csv',
  'beverage-score': 'beverage-score.csv',
  'vendor-drift': 'vendor-drift.csv',
  'shift-pulse': 'shift-pulse.csv',
};

export function readSwarmSampleCsv(slug: FreeAgentSlug): string {
  return readFileSync(join(SAMPLE_DIR, FREE_AGENT_SAMPLE_FILES[slug]), 'utf8');
}

export function loadSampleStoreFiles(): Record<FreeAgentSlug, string> {
  const files = {} as Record<FreeAgentSlug, string>;
  for (const slug of FREE_AGENT_SLUGS) {
    files[slug] = readSwarmSampleCsv(slug);
  }
  return files;
}
