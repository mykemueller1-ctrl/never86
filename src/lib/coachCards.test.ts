import { describe, it, expect } from 'vitest';
import { buildCoachCards } from './coachCards';
import type { CCException } from './commandCenter';

const ex = (o: Partial<CCException>): CCException => ({
  store: 'Downtown',
  rule: 'void_excess',
  observed: '0.83',
  benchmark: '0.45',
  dollarsYr: 12000,
  tier: 'frontline_gm',
  severity: 'low',
  basis: 'measured_leak',
  ...o,
});

describe('coach cards · every leak gets an owner + one action', () => {
  it('void_excess -> Store GM + a concrete next step + $ + verified', () => {
    const [c] = buildCoachCards([ex({})]);
    expect(c.owner).toBe('Store GM');
    expect(c.title).toContain('Downtown');
    expect(c.action.toLowerCase()).toContain('void log');
    expect(c.dollarsYr).toBe(12000);
    expect(c.level).toBe('verified'); // measured_leak
  });

  it('first_party_below_network -> Area Director + estimated (opportunity)', () => {
    const [c] = buildCoachCards([
      ex({ rule: 'first_party_below_network', tier: 'area_director', basis: 'opportunity_flag', severity: 'info', dollarsYr: null, observed: '22.4', benchmark: '38.5' }),
    ]);
    expect(c.owner).toBe('Area Director');
    expect(c.level).toBe('estimated');
    expect(c.action).toContain('first-party');
    expect(c.why).toContain('22.4'); // observed % interpolated in
  });

  it('an unknown rule still produces an owner and a generic action (never a dead end)', () => {
    const [c] = buildCoachCards([ex({ rule: 'mystery_rule', tier: 'regional_vp' })]);
    expect(c.owner).toBe('Regional VP');
    expect(c.title).toContain('mystery rule');
    expect(c.action).toContain('Regional VP');
  });
});

describe('coach cards · ranking', () => {
  it('higher severity ranks above a bigger dollar figure at lower severity', () => {
    const cards = buildCoachCards([
      ex({ store: 'A', rule: 'void_excess', severity: 'low', dollarsYr: 90000 }),
      ex({ store: 'B', rule: 'discount_excess', tier: 'area_director', severity: 'medium', dollarsYr: 1000 }),
    ]);
    expect(cards[0].store).toBe('B'); // medium beats low even with fewer dollars
  });

  it('within the same severity, more dollars ranks first', () => {
    const cards = buildCoachCards([
      ex({ store: 'A', dollarsYr: 5000 }),
      ex({ store: 'B', dollarsYr: 25000 }),
    ]);
    expect(cards[0].store).toBe('B');
  });
});
