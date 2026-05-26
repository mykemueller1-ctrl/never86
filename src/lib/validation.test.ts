import { describe, it, expect } from 'vitest';
import { waitlistInput, invoiceInput, zReportInput } from './validation';

describe('waitlistInput', () => {
  it('accepts a valid email with optional fields', () => {
    const parsed = waitlistInput.parse({
      email: 'chef@example.com',
      name: 'Chef Ann',
      restaurantName: 'The Pass',
      role: 'owner',
    });
    expect(parsed.email).toBe('chef@example.com');
    expect(parsed.name).toBe('Chef Ann');
  });

  it('accepts email only (optional fields omitted)', () => {
    const parsed = waitlistInput.parse({ email: 'solo@example.com' });
    expect(parsed.email).toBe('solo@example.com');
    expect(parsed.name).toBeUndefined();
  });

  it('rejects an invalid email', () => {
    expect(waitlistInput.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a missing email', () => {
    expect(waitlistInput.safeParse({ name: 'No Email' }).success).toBe(false);
  });
});

describe('invoiceInput', () => {
  it('defaults userId to "default" when omitted', () => {
    const parsed = invoiceInput.parse({ rawText: 'INVOICE #123' });
    expect(parsed.userId).toBe('default');
  });

  it('rejects empty rawText', () => {
    expect(invoiceInput.safeParse({ rawText: '' }).success).toBe(false);
  });

  it('keeps a provided userId and optional fileUrl', () => {
    const parsed = invoiceInput.parse({
      rawText: 'text',
      userId: 'store-7',
      fileUrl: 'https://files/x.pdf',
    });
    expect(parsed.userId).toBe('store-7');
    expect(parsed.fileUrl).toBe('https://files/x.pdf');
  });
});

describe('zReportInput', () => {
  it('defaults userId and requires rawText', () => {
    const parsed = zReportInput.parse({ rawText: 'Z-REPORT' });
    expect(parsed.userId).toBe('default');
  });

  it('rejects empty rawText', () => {
    expect(zReportInput.safeParse({ rawText: '' }).success).toBe(false);
  });
});
