import { describe, expect, it } from 'vitest';
import { ACTION_SHIFT_ROLE_PACKS } from './actionShiftSetup';
import {
  CTAP_COGS_BONUS_POLICY,
  CTAP_LAB_STATION_SEATS,
  CTAP_LAB_TEMPLATES,
  CTAP_VENDOR_CADENCE_RULES,
  buildCtapLabPack,
  checklistItemsForCtapLabShift,
  findCtapLabPackPrivacyHits,
  inferCtapLabShiftPhase,
  selectCtapLabTemplates,
  weekdayFromBusinessDate,
} from './ctapLabPack';

const PRODUCT_ROLE_KEYS = Object.keys(ACTION_SHIFT_ROLE_PACKS);

describe('CTap lab pack', () => {
  it('keeps station seats as labels mapped onto existing product roles', () => {
    expect(CTAP_LAB_STATION_SEATS.map((seat) => seat.label)).toEqual([
      'Owner',
      'FOH Manager',
      'Kitchen Manager',
      'Bartender',
      'Server',
      'Prep',
      'Driver',
    ]);
    expect(CTAP_LAB_STATION_SEATS.every((seat) => seat.kind === 'station_seat')).toBe(true);
    expect(CTAP_LAB_STATION_SEATS.every((seat) => PRODUCT_ROLE_KEYS.includes(seat.roleKey))).toBe(true);
  });

  it('seeds templates only from the approved Drive structure', () => {
    const sources = [...new Set(CTAP_LAB_TEMPLATES.map((template) => template.source))].sort();
    expect(sources).toEqual([
      'bar-open-close',
      'driver-between-runs',
      'kitchen-open-close',
      'manager-expectations',
      'waitstaff-mon-sun',
    ]);
    expect(CTAP_LAB_TEMPLATES.every((template) => PRODUCT_ROLE_KEYS.includes(template.roleKey))).toBe(true);
    expect(CTAP_LAB_TEMPLATES.some((template) => template.id === 'waitstaff-open-monday')).toBe(true);
    expect(CTAP_LAB_TEMPLATES.some((template) => template.id === 'bar-close-sunday')).toBe(true);
    expect(CTAP_LAB_TEMPLATES.some((template) => template.id === 'prep-open')).toBe(true);
    expect(CTAP_LAB_TEMPLATES.some((template) => template.id === 'kitchen-manager-close')).toBe(true);
    expect(CTAP_LAB_TEMPLATES.some((template) => template.id === 'driver-between-runs')).toBe(true);
  });

  it('stores vendor cadence as schedule rules, not live purchase orders', () => {
    expect(CTAP_VENDOR_CADENCE_RULES.map((rule) => `${rule.weekday}:${rule.action}:${rule.vendor}`)).toEqual([
      'Monday:receive:Hy-Vee',
      'Tuesday:receive:Humes',
      'Tuesday:receive:Fort Dodge Distributing',
      'Tuesday:order:Humes',
      'Friday:receive:Humes',
      'Sunday:order:Bud',
    ]);
    expect(CTAP_VENDOR_CADENCE_RULES.every((rule) => /schedule rule only/i.test(rule.note))).toBe(true);
  });

  it('stores COGS bonus tiers as percent constants, not live weekly dollars', () => {
    expect(CTAP_COGS_BONUS_POLICY).toEqual([
      { category: 'food', targetMinPct: 28, targetMaxPct: 30, unit: 'percent_of_category_sales' },
      { category: 'beer', targetMinPct: 22, targetMaxPct: 25, unit: 'percent_of_category_sales' },
      { category: 'liquor', targetMinPct: 18, targetMaxPct: 20, unit: 'percent_of_category_sales' },
    ]);
  });

  it('selects Monday bartender open from the wall-doc pack, not Tuesday beer receive', () => {
    const mondayOpen = selectCtapLabTemplates({
      roleKey: 'bartender',
      weekday: 'Monday',
      shiftPhase: 'open',
    });
    expect(mondayOpen.map((template) => template.id)).toEqual(['bar-open-monday']);
    expect(mondayOpen[0]?.steps.map((step) => step.instruction)).toContain('Stock walk in');
    expect(mondayOpen[0]?.steps.map((step) => step.instruction).join('\n')).not.toMatch(/Beer comes today/);
  });

  it('attaches between-runs dishes to a driver shift and kitchen close to the kitchen manager', () => {
    const driverItems = checklistItemsForCtapLabShift({
      roleKey: 'driver',
      businessDate: '2026-08-24',
      startsAt: '2026-08-24T16:00:00-05:00',
    });
    expect(driverItems.some((item) => /between runs/i.test(item))).toBe(true);

    const kitchenClose = checklistItemsForCtapLabShift({
      roleKey: 'kitchen_manager',
      businessDate: '2026-08-24',
      startsAt: '2026-08-24T16:00:00-05:00',
    });
    expect(kitchenClose).toContain('Turn pizza ovens off');
    expect(kitchenClose).toContain('Take all utensils back to dish area');
  });

  it('maps calendar dates to weekdays without inventing an 8/26 sales figure', () => {
    expect(weekdayFromBusinessDate('2026-08-24')).toBe('Monday');
    expect(weekdayFromBusinessDate('2026-08-26')).toBe('Wednesday');
    expect(inferCtapLabShiftPhase('2026-08-24T08:00:00-05:00')).toBe('open');
    expect(inferCtapLabShiftPhase('2026-08-24T16:00:00-05:00')).toBe('close');
    expect(JSON.stringify(buildCtapLabPack())).not.toMatch(/\$\d/);
  });

  it('keeps phones, emails, PINs, passwords, SSNs, weekly-dollar bonuses, and Facebook out of the pack', () => {
    expect(findCtapLabPackPrivacyHits(buildCtapLabPack())).toEqual([]);
  });
});
