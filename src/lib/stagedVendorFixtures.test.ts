import { describe, expect, it } from 'vitest';
import { paperFromChat, paperFromUpload } from './papersDirectIntake';
import { matchStagedVendorPaper } from './stagedVendorFixtures';

function upload(text: string, filename: string) {
  return paperFromUpload(new TextEncoder().encode(text), filename, 'text/plain');
}

describe('staged vendor fixture totals', () => {
  it('keeps each verified total on its own paper and invents no other amount', () => {
    const vestis = upload('Vestis invoice 6340606762 09/17/2026 TOTAL DUE $256.90', 'vestis.txt');
    expect(vestis.honesty).toBe('Estimated');
    expect(vestis.text).toBe('Vestis 6340606762 TOTAL DUE $256.90 (09/17/2026)');
    expect(vestis.note).not.toMatch(/19,354\.85|17,588\.80|3,710\.90|541\.50/);

    const pfg = upload('PFG Cedar Rapids 09/17/26 TOTAL DUE $19,354.85', 'pfg.txt');
    expect(pfg.text).toContain('$19,354.85');
    expect(pfg.text).not.toContain('17,588.80');

    const drive = upload('Drive PFG 08/27/26 TOTAL DUE $17,588.80', 'pfg-drive.txt');
    expect(drive.text).toContain('$17,588.80');
    expect(drive.text).not.toContain('19,354.85');

    const pepsi = upload('PepsiCo Grayhawk 10780288 Total Amount $0.00 list $541.50 not charged', 'pepsi.txt');
    expect(pepsi.honesty).toBe('Estimated');
    expect(pepsi.note).toContain('Total Amount $0.00');
    expect(pepsi.note).toContain('List $541.50 was not charged');

    const pdq = upload('PDQ Z 9/21/2026 Grand Total $3,710.90', 'pdq-z.txt');
    expect(pdq.folder).toBe('z-eod');
    expect(pdq.text).toContain('$3,710.90');
    expect(pdq.note).toContain('POS ≠ payout');
  });

  it('does not stamp a fixture total onto a different amount or a chat line', () => {
    expect(matchStagedVendorPaper('Vestis 6340606762 TOTAL DUE $999.00', 'vestis.txt')).toBeNull();
    const wrong = upload('Vestis 6340606762 TOTAL DUE $999.00', 'vestis.txt');
    expect(wrong.text).not.toContain('256.90');
    expect(wrong.honesty).not.toBe('Verified');

    const chat = paperFromChat('Vestis 6340606762 TOTAL DUE $256.90');
    expect(chat.honesty).toBe('Missing');
    expect(chat.text).toBe('');
    expect(chat.note).not.toContain('256.90');
  });
});
