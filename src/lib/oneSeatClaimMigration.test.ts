import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('one-seat claim migration draft', () => {
  const sql = readFileSync('sql/0006_one_seat_claim.sql', 'utf8');

  it('stays a do-not-apply draft with hashed identifiers and no mail', () => {
    expect(sql).toMatch(/DRAFT/);
    expect(sql).toMatch(/Do not apply/);
    expect(sql).toMatch(/mail_sent boolean not null default false check \(mail_sent = false\)/);
    expect(sql).toMatch(/email_hash/);
    expect(sql).toMatch(/google_sub_hash/);
    expect(sql).toMatch(/decided_by text check \(decided_by in \('myke', 'tom'\)\)/);
    expect(sql).not.toMatch(/@community/);
  });
});
