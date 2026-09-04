import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DATABASE_URL_ENV,
  STAFF_SEAT_LOGIN_ENABLED_ENV_NAME,
  databaseUrlPresent,
  persistHealth,
  persistHealthBody,
} from './persistHealth';
import { neonConfigured } from './operatorActivation';
import { POST as staffLoginPost } from '../app/api/staff/login/route';

const ORIGINAL_URL = process.env.DATABASE_URL;
const ORIGINAL_STAFF_FLAG = process.env.STAFF_SEAT_LOGIN_ENABLED;
const FAKE_URL = 'postgresql://factory.invalid:secret-must-never-leak@ep-xxx.invalid/never86';
const ROOT = join(process.cwd());

function restoreEnv() {
  if (ORIGINAL_URL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL_URL;
  if (ORIGINAL_STAFF_FLAG === undefined) delete process.env.STAFF_SEAT_LOGIN_ENABLED;
  else process.env.STAFF_SEAT_LOGIN_ENABLED = ORIGINAL_STAFF_FLAG;
}

afterEach(restoreEnv);

describe('persist health (boolean presence only)', () => {
  it('reports missing and present without echoing the URL', () => {
    expect(databaseUrlPresent({})).toBe(false);
    expect(databaseUrlPresent({ DATABASE_URL: '' })).toBe(false);
    expect(databaseUrlPresent({ DATABASE_URL: '   ' })).toBe(false);
    expect(persistHealth({}).databaseUrlPresent).toBe(false);

    const present = persistHealth({ DATABASE_URL: FAKE_URL });
    expect(present).toEqual({ databaseUrlPresent: true });
    expect(Object.keys(present)).toEqual(['databaseUrlPresent']);

    const json = JSON.stringify(persistHealthBody({ DATABASE_URL: FAKE_URL }));
    expect(json).toBe('{"databaseUrlPresent":true}');
    expect(json).not.toContain(FAKE_URL);
    expect(json).not.toMatch(/postgres(ql)?:\/\//i);
    expect(json).not.toContain('secret-must-never-leak');
  });

  it('reads process.env presence the same way neonConfigured does', () => {
    delete process.env.DATABASE_URL;
    expect(databaseUrlPresent()).toBe(false);
    expect(neonConfigured()).toBe(false);

    process.env.DATABASE_URL = FAKE_URL;
    expect(databaseUrlPresent()).toBe(true);
    expect(neonConfigured()).toBe(true);
    expect(JSON.stringify(persistHealth())).not.toContain(FAKE_URL);
  });

  it('keeps the Neon HTTP client and does not reintroduce Supabase persist', () => {
    const dbIndex = readFileSync(join(ROOT, 'src/db/index.ts'), 'utf8');
    const dbTx = readFileSync(join(ROOT, 'src/db/tx.ts'), 'utf8');
    const health = readFileSync(join(ROOT, 'src/lib/persistHealth.ts'), 'utf8');
    const route = readFileSync(join(ROOT, 'src/app/api/persist-health/route.ts'), 'utf8');
    const checklist = readFileSync(join(ROOT, 'docs/product/NEON_PERSIST_PHONE_CHECKLIST.md'), 'utf8');
    const envExample = readFileSync(join(ROOT, '.env.example'), 'utf8');
    const pkg = readFileSync(join(ROOT, 'package.json'), 'utf8');

    expect(pkg).toMatch(/"@neondatabase\/serverless"/);
    expect(dbIndex).toMatch(/@neondatabase\/serverless/);
    expect(dbIndex).toMatch(/drizzle-orm\/neon-http/);
    expect(dbTx).toMatch(/@neondatabase\/serverless/);
    expect(dbIndex).not.toMatch(/supabase/i);
    expect(dbTx).not.toMatch(/supabase/i);
    expect(health).not.toMatch(/supabase/i);
    expect(route).not.toMatch(/supabase/i);
    expect(route).toMatch(/persistHealthBody/);
    expect(route).not.toMatch(/process\.env\.DATABASE_URL/);

    expect(envExample).toMatch(new RegExp(`${STAFF_SEAT_LOGIN_ENABLED_ENV_NAME}=false`));
    expect(envExample).not.toMatch(new RegExp(`${STAFF_SEAT_LOGIN_ENABLED_ENV_NAME}=true`));

    expect(checklist).toContain(DATABASE_URL_ENV);
    expect(checklist).toContain(STAFF_SEAT_LOGIN_ENABLED_ENV_NAME);
    expect(checklist).toMatch(/pooled/i);
    expect(checklist).toMatch(/never86/);
    expect(checklist).toMatch(/Vercel/);
    expect(checklist).toMatch(/Production/);
    expect(checklist).not.toMatch(/postgresql:\/\//);
    expect(checklist).not.toMatch(/postgres:\/\//);
  });

  it('keeps public /audit and /trial off the Neon persist path', () => {
    const audit = readFileSync(join(ROOT, 'src/app/audit/page.tsx'), 'utf8');
    const trial = readFileSync(join(ROOT, 'src/app/trial/page.tsx'), 'utf8');
    const operator = readFileSync(join(ROOT, 'src/app/operator/page.tsx'), 'utf8');
    const auditIntake = readFileSync(join(ROOT, 'src/app/api/audit-intake/route.ts'), 'utf8');
    const waitlist = readFileSync(join(ROOT, 'src/app/api/waitlist/route.ts'), 'utf8');

    expect(audit).not.toMatch(/from ['"]@\/db['"]/);
    expect(audit).not.toMatch(/DATABASE_URL/);
    expect(trial).not.toMatch(/from ['"]@\/db['"]/);
    expect(trial).not.toMatch(/DATABASE_URL/);
    expect(operator).not.toMatch(/from ['"]@\/db['"]/);
    expect(operator).not.toMatch(/DATABASE_URL/);
    expect(auditIntake).not.toMatch(/from ['"]@\/db['"]/);
    expect(auditIntake).not.toMatch(/DATABASE_URL/);
    expect(waitlist).toMatch(/databaseUrlPresent/);
  });

  it('leaves staff login fail-closed and does not enable STAFF_SEAT_LOGIN_ENABLED', async () => {
    delete process.env.DATABASE_URL;
    delete process.env[STAFF_SEAT_LOGIN_ENABLED_ENV_NAME];
    const res = await staffLoginPost();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.issuance).toBe('blocked');
    expect(body.mailSent).toBe(false);
  });
});
