import { describe, expect, it } from 'vitest';
import { plateById } from './operatorV2';
import {
  DAY1_FOLDER_COACH,
  DAY1_HOOK_PLATE_ID,
  DAY1_SOR_OPTIONS,
  STREAM_A_LOCKS,
  day1CoachById,
  day1CoachCorpus,
  day1HookCoach,
  day1HookPlate,
  firstPhotoWinLine,
  looksLikeDay1VendorAsk,
  siloCueIsOptional,
} from './day1Coach';

describe('day-1 10-minute hook', () => {
  it('prefers order guide as the first photo win', () => {
    expect(DAY1_HOOK_PLATE_ID).toBe('order-guide');
    expect(day1HookPlate(new Set()).id).toBe('order-guide');
    expect(day1HookCoach(new Set()).chip).toMatch(/order guide/i);
    expect(DAY1_FOLDER_COACH.map((row) => row.id)).toEqual([
      'schedule',
      'labor-cards',
      'menu',
      'order-guide',
    ]);
  });

  it('after order guide lands, next ask is schedule — not a module tour', () => {
    expect(day1HookPlate(new Set(['order-guide'])).id).toBe('schedule');
    expect(day1HookPlate(new Set(['order-guide', 'schedule'])).id).toBe('labor-cards');
  });

  it('speaks operator snaps, not SaaS setup', () => {
    const text = DAY1_FOLDER_COACH.map((row) => `${row.ask} ${row.winning}`).join(' ');
    expect(text).toMatch(/snap/i);
    expect(text).toMatch(/you’re winning/i);
    expect(text.toLowerCase()).not.toMatch(/unlock|dashboard|module|integration|portal password/);
    expect(JSON.stringify(DAY1_FOLDER_COACH)).not.toMatch(/\$\d/);
    expect(firstPhotoWinLine('order-guide')).toMatch(/you’re winning/i);
    expect(day1CoachById('menu')?.ask).toMatch(/picture of the menu/i);
  });

  it('only opens vendor babysit when they asked about a truck', () => {
    expect(looksLikeDay1VendorAsk('Why did labor feel wrong last night?')).toBe(false);
    expect(looksLikeDay1VendorAsk('Usually Sysco Tue/Fri — forget to snap?')).toBe(true);
    expect(looksLikeDay1VendorAsk('Humes invoice')).toBe(true);
  });
});

describe('Research Stream A must-not-violate', () => {
  it('keeps Review Fail on the 10-minute hook and forbids dashboard-first', () => {
    expect(STREAM_A_LOCKS.tenMinuteHook).toBe(true);
    expect(STREAM_A_LOCKS.reviewFailIncludesTenMinuteHook).toBe(true);
    expect(STREAM_A_LOCKS.dashboardFirst).toBe(false);
    expect(STREAM_A_LOCKS.replacesSilosOnDay1).toBe(false);
    expect(DAY1_HOOK_PLATE_ID).toBe('order-guide');
    expect(day1CoachCorpus().toLowerCase()).not.toMatch(/dashboard first|module map|kpi tile/);
  });

  it('treats familiar silo names as optional cues only — never the required path', () => {
    expect(STREAM_A_LOCKS.siloNames).toBe('optional-cues-only');
    expect(STREAM_A_LOCKS.hardcodedVendorPath).toBe(false);
    const corpus = day1CoachCorpus();
    for (const silo of STREAM_A_LOCKS.optionalSiloCues) {
      expect(siloCueIsOptional(corpus, silo)).toBe(true);
    }
    expect(corpus).not.toMatch(/open 7shifts|export from toast|log into toast|switch off 7shifts/i);
    expect(corpus).not.toMatch(/we replace (7shifts|toast)/i);
    expect(siloCueIsOptional('Open 7shifts and sync labor.', '7shifts')).toBe(false);
    expect(siloCueIsOptional('7shifts or Toast is a cue only. We don’t replace them on day 1.', '7shifts')).toBe(
      true,
    );
  });

  it('keeps order-guide OCR outside the POS — paper / photo / MarginEdge-class', () => {
    expect(STREAM_A_LOCKS.orderGuideOcr).toBe('outside-pos');
    expect(STREAM_A_LOCKS.nativeToastOrderGuide).toBe(false);
    expect([...STREAM_A_LOCKS.orderGuideSources]).toEqual(['paper', 'photo', 'marginedge-class']);
    const guide = day1CoachById('order-guide');
    expect(guide?.ask).toMatch(/paper/i);
    expect(guide?.ask).toMatch(/photo/i);
    expect(guide?.attachHint).toMatch(/outside the pos/i);
    expect(guide?.attachHint).toMatch(/marginedge-class/i);
    expect(`${guide?.ask} ${guide?.attachHint}`).not.toMatch(/toast order guide|native toast/i);
    expect(guide?.askSystemOfRecord).toBe(false);
  });

  it('asks which system-of-record for schedule, labor, and menu — never invents usage %', () => {
    expect(STREAM_A_LOCKS.systemOfRecordAsk).toBe(true);
    expect(STREAM_A_LOCKS.inventedUsagePct).toBe(false);
    expect([...STREAM_A_LOCKS.systemOfRecordOptions]).toEqual([...DAY1_SOR_OPTIONS]);
    expect([...DAY1_SOR_OPTIONS]).toEqual(['POS', 'app', 'Sheets', 'paper']);

    for (const id of STREAM_A_LOCKS.systemOfRecordFolders) {
      const row = day1CoachById(id);
      expect(row?.askSystemOfRecord).toBe(true);
      const hay = `${row?.ask} ${row?.attachHint}`;
      for (const option of DAY1_SOR_OPTIONS) {
        expect(hay).toMatch(new RegExp(option, 'i'));
      }
    }

    expect(day1CoachCorpus()).not.toMatch(/\d+\s*%/);
    expect(day1CoachCorpus()).not.toMatch(/most (toast|7shifts|operators)/i);
  });

  it('keeps Operator V2 plate asks in lockstep with day-1 coach', () => {
    for (const coach of DAY1_FOLDER_COACH) {
      expect(plateById(coach.id)?.ask).toBe(coach.ask);
    }
  });
});
