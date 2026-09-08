import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  MAX_PAPERS_PER_DROP,
  OPERATOR_PERSIST_FACT,
  collectUploadFiles,
  folderForLastWeekFamily,
  receivedPapersLine,
  receivingPapersLine,
} from './ownerDeskPapers';

describe('owner seat papers helpers', () => {
  it('collects multiple file fields and caps the drop', () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' }));
    form.append('file', new File([new Uint8Array([2])], 'b.jpg', { type: 'image/jpeg' }));
    form.append('files', new File([new Uint8Array([3])], 'c.pdf', { type: 'application/pdf' }));
    form.append('file', new File([], 'empty.jpg', { type: 'image/jpeg' }));
    const files = collectUploadFiles(form);
    expect(files.map((row) => row.name)).toEqual(['a.jpg', 'b.jpg', 'c.pdf']);
    expect(MAX_PAPERS_PER_DROP).toBe(12);
  });

  it('names the receipt so the operator sees the paper landed', () => {
    expect(receivedPapersLine([])).toBe('No paper reached this seat.');
    expect(receivedPapersLine(['Z.jpg'])).toBe('Z.jpg is on this seat.');
    expect(receivedPapersLine(['a.jpg', 'b.jpg'])).toBe('Received 2 papers on this seat: a.jpg, b.jpg.');
    expect(receivingPapersLine(3)).toMatch(/3 papers/);
    expect(OPERATOR_PERSIST_FACT).not.toMatch(/desk|operator_id|seat:\d/i);
  });

  it('maps last-week families to a paper folder without inventing dollars', () => {
    expect(folderForLastWeekFamily('labor')).toBe('schedule');
    expect(folderForLastWeekFamily('food')).toBe('menu');
    expect(folderForLastWeekFamily('pop')).toBe('invoice-truck');
    expect(folderForLastWeekFamily('week-sales')).toBeUndefined();
  });

  it('locks the One-Seat UI to multi-image + receipt + dock, and bans desk copy', () => {
    const phone = readFileSync(resolve('src/components/FreeOperatorPhone.tsx'), 'utf8');
    const card = readFileSync(resolve('src/components/FreeOperatorAnswerCard.tsx'), 'utf8');
    const page = readFileSync(resolve('src/app/operator/page.tsx'), 'utf8');
    const css = readFileSync(resolve('src/app/globals.css'), 'utf8');
    expect(phone).toMatch(/multiple/);
    expect(phone).toMatch(/onRemoteFiles/);
    expect(phone).toMatch(/owner-seat-receipt|receivedPapersLine/);
    expect(phone).toMatch(/owner-seat-dock/);
    expect(phone).not.toMatch(/capture="environment"/);
    expect(phone).not.toMatch(/event\.target\.files\?\.\[0\]/);
    expect(phone).not.toMatch(/'Owner desk'/);
    expect(phone).not.toMatch(/aria-label="Owner desk/);
    expect(card).not.toMatch(/Back to Owner desk/);
    expect(page).not.toMatch(/Owner desk/);
    expect(css).toMatch(/owner-seat-dock/);
    expect(css).toMatch(/owner-seat-receipt/);
  });
});
