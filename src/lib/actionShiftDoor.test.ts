import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Action Shift door matches the app', () => {
  const door = readFileSync(resolve('src/components/ActionShiftDoor.tsx'), 'utf8');

  it('leads with one question and three checks', () => {
    expect(door).toMatch(/Know what to/);
    expect(door).toMatch(/Start with my invoices/);
    expect(door).toMatch(/href="\/check\/invoices"/);
    expect(door).toMatch(/href="\/check\/labor"/);
    expect(door).toMatch(/href="\/check\/menu"/);
    expect(door).toMatch(/FICTIONAL EXAMPLE/);
    expect(door).toMatch(/one restaurant and one login/i);
    expect(door).not.toMatch(/\$\d/);
  });

  it('is the face of the seat door, not the compass hour', () => {
    const trial = readFileSync(resolve('src/app/trial/page.tsx'), 'utf8');
    expect(trial).toMatch(/ActionShiftDoor/);
    expect(trial).not.toMatch(/One seat\. <em>Your restaurant\.<\/em>/);
    expect(trial).not.toMatch(/from ['"]@\/db['"]/);
    expect(trial).not.toMatch(/DATABASE_URL/);
  });
});
