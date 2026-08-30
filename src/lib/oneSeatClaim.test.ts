import { describe, expect, it } from 'vitest';
import {
  ONE_SEAT_CLAIM_ENABLED_ENV,
  approvalInbox,
  completeGoogleClaim,
  consumeEmailChallenge,
  createGooglePkceState,
  decideClaim,
  emptyOneSeatStore,
  evaluateOneSeatClaimEnablement,
  hashIdentifier,
  normalizeEmail,
  peekLatestEmailChallengeTokenHash,
  sessionFromClaim,
  startEmailClaim,
  syntheticDemoRoster,
  unavailableProviderMessage,
  verifyPkceS256,
} from './oneSeatClaim';

function store() {
  return emptyOneSeatStore(syntheticDemoRoster());
}

describe('one-seat claim', () => {
  it('fails closed without DATABASE_URL or enable flag', () => {
    expect(evaluateOneSeatClaimEnablement({}).ready).toBe(false);
    expect(evaluateOneSeatClaimEnablement({ DATABASE_URL: 'postgres://x' }).ready).toBe(false);
    expect(evaluateOneSeatClaimEnablement({
      DATABASE_URL: 'postgres://x',
      [ONE_SEAT_CLAIM_ENABLED_ENV]: 'true',
    }).ready).toBe(true);
  });

  it('rejects live-looking emails in git/test and keeps phone/X unavailable', () => {
    expect(normalizeEmail('tom@communitytap.example')).toBeNull();
    expect(normalizeEmail('foh@example.test')).toBe('foh@example.test');
    expect(unavailableProviderMessage('phone')).toMatch(/not available|wait/i);
    expect(unavailableProviderMessage('x')).toMatch(/not available|wait/i);
  });

  it('creates a pending request with no tenant access and never returns a raw token', () => {
    const db = store();
    const started = startEmailClaim({ email: 'foh@example.test', ip: '203.0.113.10', store: db, now: '2026-08-29T22:00:00.000Z' });
    expect(started.ok).toBe(true);
    expect(started.mailSent).toBe(false);
    expect(started.rawToken).toBeUndefined();
    expect(started.session?.hasTenantAccess).toBe(false);
    expect(started.session?.grantsFullOperatorAccess).toBe(false);
    expect(approvalInbox(db)).toHaveLength(1);
    expect(db.events.every((event) => event.mailSent === false)).toBe(true);
  });

  it('rate-limits repeated claim starts', () => {
    const db = store();
    for (let i = 0; i < 5; i += 1) {
      expect(startEmailClaim({ email: 'unknown@example.test', ip: '198.51.100.8', store: db }).ok).toBe(true);
    }
    const blocked = startEmailClaim({ email: 'unknown@example.test', ip: '198.51.100.8', store: db });
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toMatch(/Too many/i);
  });

  it('approves only after a live roster match and keeps the other tenant out', () => {
    const db = store();
    startEmailClaim({ email: 'foh@example.test', ip: '203.0.113.10', store: db });
    const claim = approvalInbox(db)[0];
    const denied = decideClaim({ store: db, claimId: claim.id, approver: 'intern', decision: 'approve' });
    expect(denied.ok).toBe(false);

    const approved = decideClaim({ store: db, claimId: claim.id, approver: 'tom', decision: 'approve' });
    expect(approved.ok).toBe(true);
    expect(approved.session?.kind).toBe('staff-seat');
    if (approved.session?.kind === 'staff-seat') {
      expect(approved.session.hasTenantAccess).toBe(true);
      expect(approved.session.grantsFullOperatorAccess).toBe(false);
      expect(approved.session.seatKey).toBe('foh_manager');
      expect(approved.session.department).toBe('front');
      expect(approved.session.operatorId).toBe(9001);
    }
  });

  it('rejects unknown emails and revoke/reset remove workspace access', () => {
    const db = store();
    startEmailClaim({ email: 'unknown@example.test', ip: '203.0.113.10', store: db });
    const claim = approvalInbox(db)[0];
    const noRoster = decideClaim({ store: db, claimId: claim.id, approver: 'myke', decision: 'approve' });
    expect(noRoster.ok).toBe(false);
    expect(noRoster.error).toMatch(/roster/i);

    const rejected = decideClaim({ store: db, claimId: claim.id, approver: 'myke', decision: 'reject' });
    expect(rejected.ok).toBe(true);
    expect(rejected.claim?.status).toBe('rejected');
    expect(rejected.claim).toBeTruthy();
    expect(sessionFromClaim(db, rejected.claim!)?.hasTenantAccess).toBe(false);

    startEmailClaim({ email: 'kitchen@example.test', ip: '203.0.113.11', store: db });
    const kitchen = approvalInbox(db)[0];
    decideClaim({ store: db, claimId: kitchen.id, approver: 'myke', decision: 'approve' });
    const revoked = decideClaim({ store: db, claimId: kitchen.id, approver: 'tom', decision: 'revoke' });
    expect(revoked.claim?.status).toBe('revoked');
    expect(revoked.claim).toBeTruthy();
    expect(sessionFromClaim(db, revoked.claim!)?.hasTenantAccess).toBe(false);

    const reset = decideClaim({ store: db, claimId: kitchen.id, approver: 'myke', decision: 'reset' });
    expect(reset.claim?.status).toBe('pending');
    expect(reset.claim).toBeTruthy();
    expect(sessionFromClaim(db, reset.claim!)?.kind).toBe('identity-pending');
  });

  it('verifies hashed email challenges and Google PKCE without granting a seat', () => {
    const db = store();
    startEmailClaim({ email: 'foh@example.test', ip: '203.0.113.10', store: db });
    const tokenHash = peekLatestEmailChallengeTokenHash(db);
    expect(tokenHash).toBeTruthy();
    const known = store();
    startEmailClaim({
      email: 'foh@example.test',
      ip: '203.0.113.10',
      store: known,
      testToken: 'test-email-challenge-token-32b',
    });
    const miss = consumeEmailChallenge({ store: known, email: 'foh@example.test', token: 'not-the-token-value-at-all' });
    expect(miss.ok).toBe(false);
    const hit = consumeEmailChallenge({ store: known, email: 'foh@example.test', token: 'test-email-challenge-token-32b' });
    expect(hit.ok).toBe(true);
    expect(hit.session?.hasTenantAccess).toBe(false);

    const pkce = createGooglePkceState(db);
    expect(verifyPkceS256(pkce.verifier, pkce.challenge)).toBe(true);
    expect(verifyPkceS256('wrong-verifier', pkce.challenge)).toBe(false);
    const google = completeGoogleClaim({
      store: db,
      state: pkce.state,
      email: 'kitchen@example.test',
      googleSub: 'google-sub-demo-1',
    });
    expect(google.ok).toBe(true);
    expect(google.session?.hasTenantAccess).toBe(false);
    expect(google.mailSent).toBe(false);
    expect(hashIdentifier('kitchen@example.test')).toHaveLength(64);
  });
});
