import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { metadata as claimMetadata } from '../app/staff/claim/page';
import { metadata as pendingMetadata } from '../app/staff/pending/page';
import { metadata as approvalsMetadata } from '../app/staff/approvals/page';
import { POST as claimStart } from '../app/api/staff/claim/start/route';
import { GET as approvalsGet } from '../app/api/staff/approvals/route';
import { POST as approvalPost } from '../app/api/staff/approvals/[id]/route';
import {
  ONE_SEAT_CLAIM_ENABLED_ENV,
  emptyOneSeatStore,
  startEmailClaim,
  syntheticDemoRoster,
} from './oneSeatClaim';
import {
  handleDecision,
  handleEmailStart,
  handleGoogleStart,
  resetOneSeatMemoryStore,
} from './oneSeatClaimHttp';

const ENABLED = {
  DATABASE_URL: 'postgres://example',
  [ONE_SEAT_CLAIM_ENABLED_ENV]: 'true',
};

describe('one-seat HTTP plane', () => {
  it('keeps claim surfaces noindex and out of the sitemap', async () => {
    expect(claimMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(pendingMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(approvalsMetadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('fails closed on HTTP without enablement and never returns a raw token', async () => {
    const res = await claimStart(new Request('http://localhost/api/staff/claim/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'foh@example.test' }),
    }));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(body.success).toBe(false);
    expect(body.mailSent).toBe(false);
    expect(body.hasTenantAccess).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(/test-email-challenge|rawToken|token":/);
  });

  it('refuses email start when mail is not configured even if the flag is on', () => {
    const result = handleEmailStart({
      email: 'foh@example.test',
      ip: '203.0.113.10',
      env: ENABLED,
      store: emptyOneSeatStore(syntheticDemoRoster()),
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/mail provider/i);
    expect(result.mailSent).toBe(false);
  });

  it('refuses Google start without client secrets', () => {
    const result = handleGoogleStart({ env: ENABLED, store: emptyOneSeatStore() });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/GOOGLE_CLIENT/i);
  });

  it('approves a synthetic roster match through the decision helper', () => {
    const store = emptyOneSeatStore(syntheticDemoRoster());
    startEmailClaim({ email: 'foh@example.test', ip: '203.0.113.10', store });
    const claimId = store.claims[0].id;
    const approved = handleDecision({
      claimId,
      approver: 'myke',
      decision: 'approve',
      store,
      env: ENABLED,
    });
    expect(approved.ok).toBe(true);
    expect(approved.session?.hasTenantAccess).toBe(true);
    expect(approved.mailSent).toBe(false);
  });

  it('keeps the live approval routes fail-closed in this workspace', async () => {
    resetOneSeatMemoryStore();
    const list = await approvalsGet();
    expect(list.status).toBe(503);
    const decide = await approvalPost(
      new NextRequest('http://localhost/api/staff/approvals/x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver: 'myke', decision: 'approve' }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    );
    expect(decide.status).toBeGreaterThanOrEqual(400);
    const body = await decide.json();
    expect(body.mailSent).toBe(false);
    expect(body.hasTenantAccess).toBe(false);
  });
});
