import { describe, expect, it } from 'vitest';
import cadenceJson from '../../config/ctap-vendor-cadence.json';
import {
  CTAP_VENDOR_CADENCE,
  matchVendorCadence,
  missingInvoiceNudge,
  vendorBabysitLine,
  vendorsExpectedOn,
} from './vendorCadenceConfig';

describe('CTAP vendor cadence config', () => {
  it('loads the eight CTAP-proven vendors from config, not hardcoded spaghetti', () => {
    expect(CTAP_VENDOR_CADENCE.id).toBe('ctap-vendor-cadence-v1');
    expect(CTAP_VENDOR_CADENCE.customizable).toBe(true);
    expect(CTAP_VENDOR_CADENCE.vendors.map((row) => row.id)).toEqual([
      'fort-dodge-distributing',
      'humes',
      'confluence',
      'hy-vee-wine',
      'pepsi',
      'northern-lights',
      'performance-foodservice',
      'sysco',
    ]);
    expect(cadenceJson.vendors).toHaveLength(8);
    expect(CTAP_VENDOR_CADENCE.boundary.notPaymentWorkflow).toBe(true);
    expect(CTAP_VENDOR_CADENCE.boundary.noCo2Lecture).toBe(true);
    expect(CTAP_VENDOR_CADENCE.boundary.posPayoutsUntrustedUntilReceipt).toBe(true);
  });

  it('nudges a missing ticket as forget-to-snap, never you-did-not-order', () => {
    expect(missingInvoiceNudge('Sysco')).toBe('Usually Sysco Tue/Fri — nothing in. Forget to snap it?');
    expect(missingInvoiceNudge('PFG')).toMatch(/21-day/);
    expect(missingInvoiceNudge('PFG')).toMatch(/Seat 2 orders the day before/);
    expect(missingInvoiceNudge('PFG')).not.toMatch(/pay now|ACH|remit/i);
    expect(missingInvoiceNudge('Humes')).toMatch(/Email the invoice|snap the ticket/);
    expect(missingInvoiceNudge('Humes')).toMatch(/later wave/);
    expect(matchVendorCadence('Humes')?.days).toEqual(['Tue', 'Fri']);
    expect(matchVendorCadence('Humes')?.notes.join(' ')).toMatch(/photo OCR backup/);
    expect(matchVendorCadence('NL')?.days).toEqual(['Tue', 'Fri']);
    expect(matchVendorCadence('Hy-Vee')?.days).toEqual(['Mon', 'Wed', 'Fri']);
    expect(matchVendorCadence('PFG')?.days).toEqual(['Tue', 'Fri']);
    expect(vendorsExpectedOn('Tue').map((row) => row.id)).toEqual(expect.arrayContaining([
      'fort-dodge-distributing',
      'humes',
      'northern-lights',
      'performance-foodservice',
    ]));
    expect(vendorsExpectedOn('Tue').map((row) => row.id)).toContain('sysco');
    expect(vendorBabysitLine({ question: 'Where is the Sysco invoice?' })).toMatch(/forget to snap/i);
    expect(missingInvoiceNudge('Pepsi')).toMatch(/papers-in/);
    expect(missingInvoiceNudge('Fort Dodge')).toMatch(/never email/);
    expect(missingInvoiceNudge('Confluence')).toMatch(/empties photo/);
    expect(missingInvoiceNudge('NL')).toMatch(/inv#/);
    expect(missingInvoiceNudge('Hy-Vee')).toMatch(/owner-email order/);
    expect(missingInvoiceNudge('Hy-Vee')).toMatch(/M\/W\/F is photo/);
    expect(JSON.stringify(CTAP_VENDOR_CADENCE.vendors)).not.toMatch(/you didn’t order|you did not order|theft/i);
    expect(CTAP_VENDOR_CADENCE.vendors.map((row) => row.missingNudge).join(' ')).not.toMatch(/carbon|CO2 savings/i);
  });

  it('matches aliases operators actually say', () => {
    expect(matchVendorCadence('Hy-Vee')?.id).toBe('hy-vee-wine');
    expect(matchVendorCadence('Performance Food Group')?.id).toBe('performance-foodservice');
    expect(matchVendorCadence('NL')?.id).toBe('northern-lights');
    expect(matchVendorCadence('FDD')?.id).toBe('fort-dodge-distributing');
  });
});
