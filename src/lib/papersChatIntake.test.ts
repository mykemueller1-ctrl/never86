import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chatIntakeMap, chatReplyForLine, readChatIntakeLine } from './papersChatIntake';

describe('papers chat intake', () => {
  it('keeps a named paper Missing and never turns chat dollars into evidence', () => {
    const map = chatIntakeMap({ googleReady: false, marks: { invoices: 'named', labor: 'parsed' } });
    expect(map.map((row) => row.honesty)).not.toContain('Verified');
    expect(map.find((row) => row.id === 'google')?.honesty).toBe('Missing');
    expect(map.find((row) => row.id === 'invoices')).toMatchObject({ honesty: 'Missing' });
    expect(map.find((row) => row.id === 'labor')).toMatchObject({ honesty: 'Estimated' });
    expect(map.find((row) => row.id === 'menu')?.honesty).toBe('Missing');

    const line = readChatIntakeLine('invoice was $48 now $56');
    expect(line.slot).toBe('invoices');
    expect(line.ignoredDollars).toBe(true);
    const reply = chatReplyForLine('invoice was $48 now $56', map);
    expect(reply).toMatch(/Missing/);
    expect(reply).toMatch(/not evidence/);
    expect(reply).not.toMatch(/\$48|\$56/);
  });

  it('keeps Google Missing when the client is ready and Gmail is not connected', () => {
    const ready = chatIntakeMap({ googleReady: true, marks: {} });
    expect(ready.find((row) => row.id === 'google')?.honesty).toBe('Missing');
    expect(ready.find((row) => row.id === 'google')?.note).toMatch(/client is ready/);
    expect(ready.every((row) => row.honesty === 'Missing')).toBe(true);
    const page = readFileSync(resolve('src/app/chat/page.tsx'), 'utf8');
    expect(page).toMatch(/PapersChatIntake/);
    expect(page).not.toMatch(/\bdesk\b/i);
    expect(page).not.toMatch(/chatgpt\.site/);
  });
});
