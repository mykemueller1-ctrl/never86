import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'sql/0005_staff_seat_auth.sql'),
  'utf8',
);

describe('staff seat auth draft migration', () => {
  it('is marked not-applied and keeps tenant composite parent references', () => {
    expect(migration).toMatch(/DRAFT/i);
    expect(migration).toMatch(/Do not apply to live Neon or live Supabase/i);
    expect(migration).toContain('references public.operator_staff_seats(operator_id, id)');
    expect(migration).not.toMatch(/references public\.operator_staff_seats\(id\)/);
    expect(migration).toContain("check (mail_sent = false)");
    expect(migration).toContain("check (live_issuance in ('blocked', 'enabled'))");
    expect(migration).toContain('invite_handle');
    expect(migration).toContain('token_hash');
    expect(migration).toContain('seat_key');
  });

  it('enables RLS without granting anonymous or destructive browser access', () => {
    expect(migration.match(/enable row level security/g)).toHaveLength(2);
    expect(migration).toContain('for select to authenticated');
    expect(migration).toContain('for insert to authenticated');
    expect(migration).toContain('revoke all on table public.staff_seat_invites from anon, authenticated');
    expect(migration).not.toContain('for all to authenticated');
    expect(migration).not.toMatch(/grant select, insert, update, delete on table/);
  });
});
