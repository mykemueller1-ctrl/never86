import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260826005152_action_shift_workforce.sql'),
  'utf8',
);

describe('Action Shift workforce migration guardrails', () => {
  it('enforces tenant-safe composite parent references', () => {
    const requiredReferences = [
      'references public.operator_locations(operator_id, id)',
      'references public.operator_staff_seats(operator_id, id)',
      'references public.action_shift_checklist_templates(operator_id, id)',
      'references public.action_shift_schedule_shifts(operator_id, id)',
      'references public.action_shift_checklist_steps(operator_id, id)',
      'references public.action_shift_checklist_runs(operator_id, id)',
    ];

    for (const reference of requiredReferences) {
      expect(migration).toContain(reference);
    }

    expect(migration).not.toMatch(/references public\.operator_staff_seats\(id\)/);
    expect(migration).not.toMatch(/references public\.action_shift_[a-z_]+\(id\)/);
  });

  it('enables RLS without granting destructive browser access', () => {
    expect(migration.match(/enable row level security/g)).toHaveLength(9);
    expect(migration).toContain('for select to authenticated');
    expect(migration).toContain('for insert to authenticated with check');
    expect(migration).toContain('for update to authenticated using');
    expect(migration).toContain('from anon, authenticated;');
    expect(migration).toContain('revoke all on sequence');
    expect(migration).not.toContain('for all to authenticated');
    expect(migration).not.toMatch(/grant select, insert, update, delete on table/);
  });

  it('uses portable partial indexes for nullable role scope', () => {
    expect(migration).toContain('action_shift_roles_global_scope_unique');
    expect(migration).toContain('where location_id is null;');
    expect(migration).toContain('action_shift_roles_location_scope_unique');
    expect(migration).toContain('where location_id is not null;');
    expect(migration).not.toContain('unique nulls not distinct');
  });

  it('persists provider business date and explicit schedule match state', () => {
    expect(migration).toContain('business_date date not null');
    expect(migration).toContain("check (match_status in ('matched', 'unmatched', 'needs_review'))");
    expect(migration).toContain('match_reason text');
  });
});
