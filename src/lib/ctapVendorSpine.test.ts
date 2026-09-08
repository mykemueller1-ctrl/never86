import { describe, expect, it } from 'vitest';
import { isRegisteredPosFamily, plannedReportAdapterHooks } from './reportAdapters';
import { CTAP_VENDOR_CADENCE, missingInvoiceNudge } from './vendorCadenceConfig';
import {
  CTAP_VENDOR_SCALE_COPY,
  CTAP_VENDOR_SCALE_RULE,
  VENDOR_SPINE_HOOK_IDS,
  answerVendorSpineQuestion,
  vendorHasVerifiedParserThisDraft,
  vendorSpineWaveOrder,
} from './ctapVendorSpine';

describe('CTAP vendor spine — coach / Missing, not AP', () => {
  it('keeps Wave 0 PDQ then Wave 0b Hy-Vee; later waves are hooks', () => {
    expect(vendorSpineWaveOrder().slice(0, 2)).toEqual(['pdq-morning', 'hyvee-liquor']);
    expect(vendorHasVerifiedParserThisDraft('hy-vee-wine')).toBe(true);
    for (const id of VENDOR_SPINE_HOOK_IDS) {
      expect(vendorHasVerifiedParserThisDraft(id)).toBe(false);
    }
    expect(isRegisteredPosFamily('pfg', 'invoice')).toBe(false);
    expect(isRegisteredPosFamily('sysco', 'invoice')).toBe(false);
    expect(isRegisteredPosFamily('pepsi', 'invoice')).toBe(false);
    expect(isRegisteredPosFamily('humes', 'invoice')).toBe(false);
    expect(plannedReportAdapterHooks().filter((row) => row.pos === 'hy-vee')[0]?.status).toBe('registered');
    expect(
      plannedReportAdapterHooks()
        .filter((row) => row.family === 'invoice')
        .every((row) => row.status === 'registered' || /hook|No parse/i.test(row.note)),
    ).toBe(true);
  });

  it('ships the scale rule without AP automation', () => {
    expect(CTAP_VENDOR_SCALE_RULE.day1).toBe('one-folder-ready');
    expect(CTAP_VENDOR_SCALE_RULE.capture).toBe('photo-or-email');
    expect(CTAP_VENDOR_SCALE_RULE.dedup).toBe('invoice-number');
    expect(CTAP_VENDOR_SCALE_RULE.apAutomation).toBe(false);
    expect(CTAP_VENDOR_SCALE_COPY).toMatch(/one folder Ready/);
    expect(CTAP_VENDOR_SCALE_COPY).toMatch(/Never redesign the paper/);
    expect(CTAP_VENDOR_SCALE_COPY).toMatch(/Not AP automation/);
  });

  it('answers later-wave vendors as Missing rhythms, not Verified $', () => {
    const pfg = answerVendorSpineQuestion('What is the PFG invoice total?');
    expect(pfg?.verifiedClose).toBe(false);
    expect(pfg?.sampleDollars).toBe('none-verified');
    expect(pfg?.facts.join(' ')).toMatch(/21-day/);
    expect(pfg?.facts.join(' ')).toMatch(/Seat 2 orders the day before/);
    expect(pfg?.facts.join(' ')).toMatch(/statement pile/);
    expect(pfg?.facts.join(' ')).not.toMatch(/\bTom\b|@gmail|pay now|\bACH\b|30\/60/i);

    const pepsi = answerVendorSpineQuestion('Where is the Pepsi ticket?');
    expect(pepsi?.facts.join(' ')).toMatch(/papers-in/);
    expect(pepsi?.facts.join(' ')).toMatch(/not a savings or CO2 lecture/);

    const sysco = answerVendorSpineQuestion('Sysco invoice missing this week');
    expect(sysco?.facts.join(' ')).toMatch(/nothing in/);
    expect(sysco?.facts.join(' ')).not.toMatch(/you did not order|didn’t order/i);

    expect(answerVendorSpineQuestion('Glue the Hy-Vee wine papers')).toBeNull();
    expect(answerVendorSpineQuestion('Where is the invoice?')).toBeNull();
    expect(answerVendorSpineQuestion('Is the invoice online?')).toBeNull();

    const usFoods = answerVendorSpineQuestion('What is the US Foods invoice total?');
    expect(usFoods?.vendorId).toBe('us-foods');
    expect(usFoods?.facts.join(' ')).toMatch(/same PFG pattern/);
    expect(usFoods?.facts.join(' ')).toMatch(/21-day/);
    expect(usFoods?.verifiedClose).toBe(false);

    const fdd = answerVendorSpineQuestion('Fort Dodge Dist ticket Tuesday');
    expect(fdd?.facts.join(' ')).toMatch(/photo-only/);
    expect(fdd?.facts.join(' ')).toMatch(/never email/);

    const confluence = answerVendorSpineQuestion('Confluence empties credit');
    expect(confluence?.facts.join(' ')).toMatch(/not cash dollars/);

    const nl = answerVendorSpineQuestion('NL invoice number duplicate');
    expect(nl?.facts.join(' ')).toMatch(/dedup on inv#/);
  });

  it('keeps public nudges free of staff names, private mail, CO2, and AP aging', () => {
    const blob = CTAP_VENDOR_CADENCE.vendors.map((row) => `${row.notes.join(' ')} ${row.missingNudge}`).join('\n');
    expect(blob).not.toMatch(/\bTom\b|\bSawyer\b|communitypizza2026|myke@n86\.app|karlee|CO2 savings|pay now|ACH remit/i);
    expect(missingInvoiceNudge('Fort Dodge')).toMatch(/photo-only/);
    expect(missingInvoiceNudge('Confluence')).toMatch(/not cash dollars/);
    expect(missingInvoiceNudge('NL')).toMatch(/dedup on inv#/);
  });
});
