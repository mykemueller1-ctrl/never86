import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { emailDeliveryConfigured, emailSendSucceeded, getOwnerEmail } from './email';
import {
  deliverPublicLead,
  persistPublicLeadToNeon,
  publicLeadConfirmation,
  publicLeadHttpStatus,
  publicLeadOwnerHtml,
  publicLeadSubject,
} from './publicLeadIntake';

const AUDIT: Parameters<typeof deliverPublicLead>[0] = {
  kind: 'audit_request',
  email: 'owner@restaurant.test',
  name: 'Ada Owner',
  restaurantName: 'Ada’s Pizza',
  platform: 'DoorDash',
  sourcePage: '/audit?utm_campaign=100_statement_audit',
  utm: { campaign: '100_statement_audit', source: 'linkedin' },
};

describe('email delivery gates', () => {
  it('fails closed without RESEND_API_KEY', () => {
    const prev = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    expect(emailDeliveryConfigured()).toBe(false);
    process.env.RESEND_API_KEY = '  ';
    expect(emailDeliveryConfigured()).toBe(false);
    process.env.RESEND_API_KEY = 're_test';
    expect(emailDeliveryConfigured()).toBe(true);
    if (prev === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prev;
  });

  it('treats Resend { error } as a failed send', () => {
    expect(emailSendSucceeded({ data: { id: 'msg_1' }, error: null })).toBe(true);
    expect(emailSendSucceeded({ data: null, error: { message: 'bad key' } })).toBe(false);
    expect(emailSendSucceeded(undefined)).toBe(false);
  });

  it('routes owner mail to Gmail when OWNER_EMAIL is the retired n86 address', () => {
    const prev = process.env.OWNER_EMAIL;
    process.env.OWNER_EMAIL = 'myke@n86.app';
    expect(getOwnerEmail()).toBe('mykemueller1@gmail.com');
    if (prev === undefined) delete process.env.OWNER_EMAIL;
    else process.env.OWNER_EMAIL = prev;
  });
});

describe('public lead copy', () => {
  it('names the audit / 100_statement_audit request for the owner inbox', () => {
    expect(publicLeadSubject(AUDIT)).toBe('Free audit request · Ada’s Pizza');
    expect(publicLeadOwnerHtml(AUDIT)).toContain('DoorDash');
    expect(publicLeadOwnerHtml(AUDIT)).toContain('100_statement_audit');
    expect(publicLeadOwnerHtml({ ...AUDIT, name: '<img src=x onerror=alert(1)>' })).not.toContain('<img');
  });

  it('confirms the operator only after the owner path is described honestly', () => {
    expect(publicLeadConfirmation(AUDIT, true)).toMatch(/Check your inbox/);
    expect(publicLeadConfirmation(AUDIT, false)).toContain('hello@never86.ai');
    expect(publicLeadConfirmation({ kind: 'waitlist', email: 'a@b.test' }, true)).toBe("You're on the list.");
  });
});

describe('deliverPublicLead', () => {
  it('fails closed when email is not configured and does not persist', async () => {
    let persisted = false;
    const result = await deliverPublicLead(AUDIT, {
      emailConfigured: () => false,
      persist: async () => {
        persisted = true;
        return true;
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('email_unavailable');
    expect(publicLeadHttpStatus(result)).toBe(503);
    expect(persisted).toBe(false);
  });

  it('fails closed when owner notify returns a Resend error', async () => {
    const result = await deliverPublicLead(AUDIT, {
      emailConfigured: () => true,
      ownerEmail: () => 'mykemueller1@gmail.com',
      notifyOwner: async () => ({ data: null, error: { message: 'invalid_api_Key' } }),
      persist: async () => true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('owner_notify_failed');
    expect(publicLeadHttpStatus(result)).toBe(503);
  });

  it('succeeds without DATABASE_URL when owner mail lands', async () => {
    const result = await deliverPublicLead(AUDIT, {
      emailConfigured: () => true,
      ownerEmail: () => 'mykemueller1@gmail.com',
      notifyOwner: async () => ({ data: { id: 'owner_1' }, error: null }),
      emailOperator: async () => ({ data: { id: 'op_1' }, error: null }),
      persist: async () => false,
    });
    expect(result).toMatchObject({
      ok: true,
      ownerNotified: true,
      operatorEmailed: true,
      persisted: false,
    });
    if (result.ok) expect(result.confirmation).toMatch(/Check your inbox/);
  });

  it('still confirms the operator when only the owner Gmail send succeeds', async () => {
    const result = await deliverPublicLead(
      { kind: 'trial_claim', email: 'chef@spot.test', name: 'Chef' },
      {
        emailConfigured: () => true,
        notifyOwner: async () => ({ data: { id: 'owner_2' }, error: null }),
        emailOperator: async () => ({ data: null, error: { message: 'bounce' } }),
        persist: async () => false,
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.operatorEmailed).toBe(false);
      expect(result.confirmation).toMatch(/Myke has the request/);
    }
  });
});

describe('Neon persist fail-closed', () => {
  it('skips the write when DATABASE_URL is missing', async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(await persistPublicLeadToNeon(AUDIT)).toBe(false);
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  });
});

describe('public lead routes stay off Supabase', () => {
  const files = [
    'src/app/api/audit-intake/route.ts',
    'src/app/api/waitlist/route.ts',
    'src/app/api/trial/claim/route.ts',
    'src/lib/publicLeadIntake.ts',
  ];

  it.each(files)('%s does not import captureLead, opsDb, or @supabase', (rel) => {
    const src = readFileSync(join(process.cwd(), rel), 'utf8');
    expect(src).not.toMatch(/captureLead|opsDb|@supabase|from '@supabase/);
  });
});
