import { describe, expect, it } from 'vitest';
import { PUBLIC_OPERATOR_LOGIC } from './publicOperatorLogic';
import {
  OPERATOR_V2_BLUE,
  OPERATOR_V2_DAILY_COMPARE,
  OPERATOR_V2_PLATES,
  PAPER_SHOP_ROLES,
  dailyCompareFromEvidence,
  filledPlateIds,
  isOperatorV2PlateId,
  nextMissingPlate,
  projectFoldersFromKinds,
  spawnLaborRoleCards,
} from './operatorV2';

describe('Operator V2 first-class paper-shop folders', () => {
  it('locks schedule and labor cards as first-class OCR folders beside menu and order guide', () => {
    expect(OPERATOR_V2_BLUE).toBe('#0066ff');
    expect(OPERATOR_V2_PLATES.map((plate) => plate.id)).toEqual([
      'schedule',
      'labor-cards',
      'menu',
      'order-guide',
    ]);
    expect(OPERATOR_V2_PLATES.every((plate) => plate.ocrInput === true)).toBe(true);
    expect(OPERATOR_V2_PLATES.every((plate) => plate.firstClass === true)).toBe(true);
    expect(OPERATOR_V2_PLATES.every((plate) => plate.deferred === false)).toBe(true);
    expect(nextMissingPlate(new Set()).id).toBe('schedule');
    expect(nextMissingPlate(new Set(['schedule'])).id).toBe('labor-cards');
    expect(isOperatorV2PlateId('labor-cards')).toBe(true);
    expect(isOperatorV2PlateId('timeclock')).toBe(false);
  });

  it('flips folder chips only when that OCR file lands', () => {
    const empty = projectFoldersFromKinds(new Set());
    expect(empty.every((folder) => folder.state === 'NEED')).toBe(true);
    expect(empty.find((folder) => folder.id === 'labor-cards')?.reason).toMatch(/Roles named on the card/);

    const afterSchedule = projectFoldersFromKinds(new Set(['schedule']));
    expect(afterSchedule.find((folder) => folder.id === 'schedule')?.state).toBe('READY');
    expect(afterSchedule.find((folder) => folder.id === 'labor-cards')?.state).toBe('NEED');
    expect(afterSchedule.find((folder) => folder.id === 'menu')?.state).toBe('NEED');
    expect(filledPlateIds(afterSchedule).has('schedule')).toBe(true);
  });

  it('spawns role-named labor cards from the schedule and keeps punch Missing until the clock', () => {
    expect(PAPER_SHOP_ROLES.map((row) => row.role)).toEqual(['FOH', 'Line', 'Dish', 'Run']);

    const before = spawnLaborRoleCards({
      scheduleReady: false,
      laborCardsReady: false,
      clockReady: false,
    });
    expect(before.every((card) => card.posted === 'Missing')).toBe(true);
    expect(before.every((card) => card.punch === 'Missing')).toBe(true);
    expect(before[0]?.line).toMatch(/schedule first/i);

    const afterSchedule = spawnLaborRoleCards({
      scheduleReady: true,
      laborCardsReady: false,
      clockReady: false,
    });
    expect(afterSchedule.map((card) => card.role)).toEqual(['FOH', 'Line', 'Dish', 'Run']);
    expect(afterSchedule.every((card) => card.posted === 'On schedule')).toBe(true);
    expect(afterSchedule.every((card) => card.punch === 'Missing')).toBe(true);
    expect(afterSchedule.map((card) => card.line).join(' ')).toMatch(/Punch Missing/);
    expect(JSON.stringify(afterSchedule)).not.toMatch(/\$\d/);
    expect(JSON.stringify(afterSchedule)).not.toMatch(/karlee|sturtz|kenzy/i);

    const afterClock = spawnLaborRoleCards({
      scheduleReady: true,
      laborCardsReady: true,
      clockReady: true,
    });
    expect(afterClock.every((card) => card.punch === 'Clock landed')).toBe(true);
    expect(afterClock.map((card) => card.line).join(' ')).toMatch(/Punch ≠ schedule/);
  });

  it('uses published labor formulas for early leave, late leave, and drift', () => {
    expect(OPERATOR_V2_DAILY_COMPARE.earlyClockIn).toBe(PUBLIC_OPERATOR_LOGIC.labor.earlyClockIn);
    expect(OPERATOR_V2_DAILY_COMPARE.lateLeave).toBe(PUBLIC_OPERATOR_LOGIC.labor.lateClockOut);
    expect(OPERATOR_V2_DAILY_COMPARE.laborDrift).toBe(PUBLIC_OPERATOR_LOGIC.labor.overtimeDrift);
    expect(OPERATOR_V2_DAILY_COMPARE.earlyLeave).toMatch(/5 minutes before scheduled end/);
    expect(OPERATOR_V2_DAILY_COMPARE.punchRule).toMatch(/Punch ≠ schedule/);

    const blocked = dailyCompareFromEvidence({ scheduleReady: false, clockReady: false });
    expect(blocked.every((chip) => chip.state === 'NEED')).toBe(true);
    expect(blocked.map((chip) => chip.id)).toEqual(['early-leave', 'late-leave', 'labor-drift']);

    const punchMissing = dailyCompareFromEvidence({ scheduleReady: true, clockReady: false });
    expect(punchMissing.every((chip) => chip.state === 'NEED')).toBe(true);
    expect(punchMissing[0]?.reason).toMatch(/Punch Missing/);

    const ready = dailyCompareFromEvidence({ scheduleReady: true, clockReady: true });
    expect(ready.every((chip) => chip.state === 'READY')).toBe(true);
    expect(ready.find((chip) => chip.id === 'late-leave')?.rule).toBe(
      PUBLIC_OPERATOR_LOGIC.labor.lateClockOut,
    );
    expect(ready.map((chip) => chip.reason).join(' ')).toMatch(/No invented overtime/);
    expect(JSON.stringify(ready)).not.toMatch(/\$\d/);
  });
});
