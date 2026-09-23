import { describe, expect, it } from 'vitest';
import { filesFromForm, literalTypedDollars, papersIntakeLead, peelLiteralTotals } from './papersIntakeHelpers';

describe('papers intake helpers', () => {
  it('peels literal TOTAL/DUE lines and leaves a SKU price alone', () => {
    const text = [
      'Unit Price 56.00',
      'TOTAL DUE $256.90',
      'Grand Total $3,710.90',
      'Total Amount $0.00',
      'list $541.50',
    ].join('\n');
    expect(peelLiteralTotals(text)).toEqual([
      'TOTAL DUE $256.90',
      'Grand Total $3,710.90',
      'Total Amount $0.00',
    ]);
    expect(peelLiteralTotals(text).join('\n')).not.toMatch(/56\.00|541\.50/);
  });

  it('keeps a chat-typed dollar as the source slice', () => {
    expect(literalTypedDollars('invoice was $999 and again $ 48.00')).toEqual(['$999', '$ 48.00']);
    expect(literalTypedDollars('no amount here')).toEqual([]);
  });

  it('reads FormData file and files', () => {
    const form = new FormData();
    form.set('file', new File(['a'], 'one.txt'));
    form.append('files', new File(['b'], 'two.txt'));
    expect(filesFromForm(form).map((file) => file.name)).toEqual(['one.txt', 'two.txt']);
    expect(filesFromForm(null)).toEqual([]);
  });

  it('elevates photo, upload, and chat when Gmail is off', () => {
    const off = papersIntakeLead({ gmail: false, drive: false });
    expect(off.elevated).toBe(true);
    expect(off.honesty).toBe('Missing');
    expect(off.lead).toEqual(['photo', 'upload', 'chat']);
    expect(papersIntakeLead({ gmail: true, drive: false }).elevated).toBe(false);
    expect(papersIntakeLead({ gmail: true, drive: false }).lead[0]).toBe('gmail');
  });
});
