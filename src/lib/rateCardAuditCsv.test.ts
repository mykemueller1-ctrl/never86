import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RATE_CARD_TOLERANCE_DOLLARS, runRateCardAudit } from './rateCardAuditCsv';

const sample = readFileSync(join(__dirname, '../../public/samples/swarm/rate-card-audit.csv'), 'utf8');

describe('runRateCardAudit', () => {
  it('compares contract rule to statement charge when both sources are present', () => {
    const result = runRateCardAudit(sample);
    expect(result).not.toHaveProperty('ok', false);
    if ('ok' in result) return;
    expect(result.rows[0].expectedCharge).toBe(450);
    expect(result.rows[0].status).toBe('clean');
    expect(result.toleranceDollars).toBe(RATE_CARD_TOLERANCE_DOLLARS);
    expect(result.portalLoginRequired).toBe(false);
  });

  it('stays unresolved when the fee base is missing and never claims overcharge', () => {
    const csv = `Store,Platform,Period,Eligible Sales,Contract Rate Pct,Observed Charge,Fee Base Present,Contract Present
Sample Store One,DoorDash,2026-08,,9.00,450.00,no,yes`;
    const result = runRateCardAudit(csv);
    expect(result).not.toHaveProperty('ok', false);
    if ('ok' in result) return;
    expect(result.rows[0].status).toBe('unresolved');
    expect(result.rows[0].sourceStatus).toBe('missingEvidence');
    expect(result.rows[0].claimBoundary).toMatch(/not an overcharge/i);
  });
});
