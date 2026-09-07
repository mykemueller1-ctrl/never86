import { describe, expect, it } from 'vitest';
import {
  flagInvoiceDuplicates,
  invoiceIdentityKey,
  parseLabeledInvoiceTotalCents,
  vendorTotalKey,
} from './invoiceIdentity';

describe('invoice identity + dedup', () => {
  it('keys identity on invoice number, not vendor name', () => {
    expect(invoiceIdentityKey('SYN-PFG-1002')).toBe('inv#:SYN-PFG-1002');
    expect(invoiceIdentityKey('# syn-pfg-1002')).toBe('inv#:SYN-PFG-1002');
    expect(invoiceIdentityKey('12')).toBeNull();
    expect(vendorTotalKey('Sysco', 18450)).toBe('vendor+total:sysco:18450');
    expect(vendorTotalKey('Sysco', null)).toBeNull();
  });

  it('flags the same invoice number twice as a review candidate', () => {
    const hits = flagInvoiceDuplicates([
      { id: 'a', vendor: 'Sysco', invoiceNumber: 'INV-88', totalCents: 1000 },
      { id: 'b', vendor: 'Sysco', invoiceNumber: 'inv-88', totalCents: 1000 },
    ]);
    expect(hits.some((hit) => hit.flag === 'identity')).toBe(true);
    expect(hits.every((hit) => hit.provenDuplicate === false)).toBe(true);
    expect(hits.every((hit) => hit.review === 'candidate')).toBe(true);
  });

  it('red-flags same vendor + same total when invoice numbers differ', () => {
    const hits = flagInvoiceDuplicates([
      { id: 'a', vendor: 'Humes', invoiceNumber: 'H-1', totalCents: 5525 },
      { id: 'b', vendor: 'Humes', invoiceNumber: 'H-2', totalCents: 5525 },
    ]);
    const collision = hits.find((hit) => hit.flag === 'vendor-total');
    expect(collision?.message).toMatch(/red flag/i);
    expect(collision?.provenDuplicate).toBe(false);
    expect(JSON.stringify(hits)).not.toMatch(/thief|steal|fraud/i);
  });

  it('does not invent a total by summing lines', () => {
    expect(parseLabeledInvoiceTotalCents('Item 1 Unit Price 10.00\nItem 2 Unit Price 5.00')).toBeNull();
    expect(parseLabeledInvoiceTotalCents('Invoice #: A100\nGrand Total: $184.50')).toBe(18450);
  });
});
