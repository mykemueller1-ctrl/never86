import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { applyNightProof, ingestCloseDocuments } from './deskClose';
import { buildActionShift } from './actionShift';
import {
  buildVendorSilenceActionShift,
  evaluateVendorSilenceDocuments,
  feedVendorSilenceIntoActionShift,
  vendorSilenceKey,
} from './vendorSilenceActionShift';
import {
  looksLikeVendorSilence,
  parseVendorSilencePacket,
} from './vendorSilenceParse';
import { looksLikeVendorInvoice } from './vendorInvoiceParse';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures/vendor-silence');
const load = (name: string) => readFileSync(join(fixtureDir, name), 'utf8');

describe('vendor silence classification', () => {
  it('recognizes silence packets and does not treat them as invoices', () => {
    const review = load('syn-review.csv');
    expect(looksLikeVendorSilence(review, 'syn-review.csv')).toBe(true);
    expect(looksLikeVendorInvoice(review, 'syn-review.csv')).toBe(false);
    expect(looksLikeVendorSilence(load('syn-review-native.txt'), 'syn-review-native.txt')).toBe(true);
  });
});

describe('vendor silence evaluation', () => {
  it('opens one review ticket after the 14-day advisory window', () => {
    const compare = evaluateVendorSilenceDocuments([
      parseVendorSilencePacket(load('syn-review.csv'), 'syn-review.csv'),
    ]);
    expect(compare.uniqueTickets).toHaveLength(1);
    expect(compare.uniqueTickets[0]).toEqual(expect.objectContaining({
      ticketAction: 'open',
      evidenceState: 'unverified',
    }));
    expect(compare.uniqueTickets[0].ticket).toEqual(expect.objectContaining({
      status: 'review',
      vendor: 'Example Produce',
      sourceStatus: 'unverified',
      daysQuiet: 5,
    }));
  });

  it('keeps the first 14 calendar days advisory and does not open a ticket', () => {
    const compare = evaluateVendorSilenceDocuments([
      parseVendorSilencePacket(load('syn-advisory.csv'), 'syn-advisory.csv'),
    ]);
    expect(compare.uniqueTickets[0].ticket).toEqual(expect.objectContaining({
      status: 'advisory',
      ticketAction: 'none',
      daysQuiet: 4,
    }));
    expect(compare.uniqueTickets[0].ticketAction).toBe('none');
  });

  it('does not open a second ticket for the same vendor+store+day', () => {
    const compare = evaluateVendorSilenceDocuments([
      parseVendorSilencePacket(load('syn-duplicate.csv'), 'syn-duplicate.csv'),
    ]);
    expect(compare.evaluations).toHaveLength(2);
    expect(compare.uniqueTickets).toHaveLength(1);
    expect(compare.evaluations[0].ticketAction).toBe('open');
    expect(compare.evaluations[1].ticketAction).toBe('keep-open');
    expect(compare.evaluations[1].ticket?.ticketId).toBe(compare.evaluations[0].ticket?.ticketId);
    expect(compare.uniqueTickets[0].silenceKey).toBe(
      vendorSilenceKey('Example Beverage', 'Sample Kitchen Lab', '2026-08-22'),
    );
  });

  it('treats missing cadence as Missing Evidence, not a ticket and not $0', () => {
    const compare = evaluateVendorSilenceDocuments([
      parseVendorSilencePacket(load('syn-missing-cadence.csv'), 'syn-missing-cadence.csv'),
    ]);
    expect(compare.uniqueTickets[0]).toEqual(expect.objectContaining({
      ticket: null,
      ticketAction: 'missing',
      evidenceState: 'missing-evidence',
    }));
    expect(compare.missingEvidence.join(' ')).toMatch(/cadence/i);
    expect(compare.missingEvidence.join(' ')).toMatch(/not a ticket and not \$0/);
  });

  it('stays advisory through calendar day 13 and can open on day 14', () => {
    const day13 = evaluateVendorSilenceDocuments([
      parseVendorSilencePacket(
        'vendor,last_seen_date,as_of_date,expected_cadence_days,program_started_date\nExample Produce,2026-08-10,2026-08-28,4,2026-08-15',
        'day13.csv',
      ),
    ]);
    const day14 = evaluateVendorSilenceDocuments([
      parseVendorSilencePacket(
        'vendor,last_seen_date,as_of_date,expected_cadence_days,program_started_date\nExample Produce,2026-08-10,2026-08-29,4,2026-08-15',
        'day14.csv',
      ),
    ]);
    expect(day13.uniqueTickets[0].ticket).toEqual(expect.objectContaining({
      status: 'advisory',
      ticketAction: 'none',
    }));
    expect(day14.uniqueTickets[0].ticket).toEqual(expect.objectContaining({
      status: 'review',
      ticketAction: 'open',
    }));
  });

  it('treats missing last-seen as Missing Evidence, not a ticket and not $0', () => {
    const compare = evaluateVendorSilenceDocuments([
      parseVendorSilencePacket(load('syn-missing-last-seen.csv'), 'syn-missing-last-seen.csv'),
    ]);
    expect(compare.uniqueTickets[0].ticketAction).toBe('missing');
    expect(compare.uniqueTickets[0].ticket).toBeNull();
    expect(compare.missingEvidence.join(' ')).toMatch(/Last-seen/);
  });
});

describe('vendor silence Action Shift', () => {
  it('emits ≤3 moves with owner, claim boundary, proof object, and null dollars', () => {
    const built = buildVendorSilenceActionShift({
      store: 'Sample Kitchen Lab',
      documents: [{ text: load('syn-review.csv'), filename: 'syn-review.csv' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.result.morningActions.length).toBeGreaterThan(0);
    expect(built.result.morningActions.length).toBeLessThanOrEqual(3);
    expect(built.result.morningActions.every((action) => action.id === 'vendor-silence')).toBe(true);
    expect(built.result.morningActions.every((action) => action.owner)).toBe(true);
    expect(built.result.morningActions.every((action) => action.sourceStatus === 'unverified')).toBe(true);
    expect(built.result.morningActions.every((action) => action.dollarsObserved === null)).toBe(true);
    expect(built.result.morningActions.every((action) => /follow-up signal/i.test(action.claimBoundary))).toBe(true);
    expect(built.result.morningActions.every((action) => /resets last-seen/i.test(action.proof.object))).toBe(true);
    expect(built.result.morningActions.every((action) => action.proof.verbalYesCloses === false)).toBe(true);
    expect(built.result.policy.maxMorningActions).toBe(3);
  });

  it('uses native-text packets the same way as CSV', () => {
    const built = buildVendorSilenceActionShift({
      documents: [{ text: load('syn-review-native.txt'), filename: 'syn-review-native.txt' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.compare.uniqueTickets[0].ticketAction).toBe('open');
    expect(built.result.morningActions[0].title).toMatch(/Example Produce/);
  });

  it('labels the first 14 days advisory on the Action Shift desk', () => {
    const built = buildVendorSilenceActionShift({
      documents: [{ text: load('syn-advisory.csv'), filename: 'syn-advisory.csv' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.result.morningActions).toHaveLength(1);
    expect(built.result.morningActions[0].instanceKey).toMatch(/:advisory:/);
    expect(built.result.summary).toMatch(/advisory/i);
    expect(built.result.morningActions[0].dollarsObserved).toBeNull();
  });

  it('does not emit a second Action Shift ticket for a duplicate vendor+store+day', () => {
    const built = buildVendorSilenceActionShift({
      documents: [{ text: load('syn-duplicate.csv'), filename: 'syn-duplicate.csv' }],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.compare.evaluations).toHaveLength(2);
    expect(built.result.morningActions).toHaveLength(1);
    expect(built.result.morningActions[0].instanceKey).toMatch(/:open:/);
  });

  it('does not invent a ticket or $0 when cadence or last-seen is missing', () => {
    const cadence = buildVendorSilenceActionShift({
      documents: [{ text: load('syn-missing-cadence.csv'), filename: 'syn-missing-cadence.csv' }],
    });
    const lastSeen = buildVendorSilenceActionShift({
      documents: [{ text: load('syn-missing-last-seen.csv'), filename: 'syn-missing-last-seen.csv' }],
    });
    expect(cadence.ok && lastSeen.ok).toBe(true);
    if (!cadence.ok || !lastSeen.ok) return;
    expect(cadence.result.morningActions[0].dollarsObserved).toBeNull();
    expect(cadence.result.morningActions[0].instanceKey).toMatch(/:missing:/);
    expect(cadence.result.missingEvidence.join(' ')).toMatch(/not a ticket and not \$0/);
    expect(lastSeen.result.morningActions[0].instanceKey).toMatch(/:missing:/);
    expect(lastSeen.result.summary).toMatch(/Missing Evidence/);
  });
});

describe('vendor silence feeds Action Shift desk', () => {
  it('turns a synthetic silence packet into a desk Action Shift without a Z', () => {
    const result = ingestCloseDocuments([
      { channel: 'file', filename: 'syn-review.csv', text: load('syn-review.csv') },
    ], 'Sample Kitchen Lab');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.desk.families).toContain('vendor-silence');
    expect(result.desk.sales.display).toBe('Missing Evidence');
    expect(result.desk.actionShift?.morningActions.length).toBeLessThanOrEqual(3);
    expect(result.desk.actionShift?.morningActions[0].id).toBe('vendor-silence');
    expect(result.desk.actionShift?.morningActions[0].owner).toBeTruthy();
    expect(result.desk.actionShift?.morningActions[0].claimBoundary).toMatch(/follow-up signal/);
    expect(result.desk.actionShift?.morningActions[0].proof.object).toMatch(/resets last-seen/);
    expect(result.desk.actionShift?.morningActions[0].dollarsObserved).toBeNull();
  });

  it('ranks a due silence clock into yesterday\'s close moves', () => {
    const pos = buildActionShift({ grossSales: 1000, voids: 12 });
    const silence = buildVendorSilenceActionShift({
      documents: [{ text: load('syn-review.csv'), filename: 'syn-review.csv' }],
    });
    expect(pos.ok && silence.ok).toBe(true);
    if (!pos.ok || !silence.ok) return;
    const merged = feedVendorSilenceIntoActionShift(pos.result, silence.result);
    expect(merged?.morningActions.length).toBeLessThanOrEqual(3);
    expect(merged?.morningActions.some((action) => action.id === 'vendor-silence')).toBe(true);
    expect(merged?.morningActions.every((action) => action.owner && action.proof.object && action.claimBoundary)).toBe(true);
  });
});

describe('vendor silence night proof', () => {
  const action = {
    id: 'vendor-silence' as const,
    proof: {
      object: 'Receiving log, invoice, confirmation, or operator-approved exception that resets last-seen',
      nightCheck: 'Attach the receiving log.',
      verbalYesCloses: false as const,
    },
  };

  it('closes only with proof that resets last-seen', () => {
    expect(applyNightProof({ action, outcome: 'verified', proofKind: 'receiving-log' })).toEqual({
      ok: true,
      state: 'verified',
      lastSeenReset: true,
    });
    expect(applyNightProof({ action, outcome: 'verified', proofKind: 'invoice-packet' })).toEqual({
      ok: true,
      state: 'verified',
      lastSeenReset: true,
    });
  });

  it('rejects a verbal yes or a proof that does not reset last-seen', () => {
    expect(applyNightProof({ action, outcome: 'verified', proofKind: 'verbal' }).ok).toBe(false);
    expect(applyNightProof({ action, outcome: 'verified', proofKind: 'pos-close' })).toEqual({
      ok: false,
      error: expect.stringMatching(/resets last-seen/i),
    });
  });
});
