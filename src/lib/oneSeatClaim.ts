import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isStationSeatKey, type StationSeatKey } from './staffSeatAuth';

/**
 * One human = one Never86 identity/seat.
 * Verified email/Google creates a pending CTAP request only.
 * Myke or Tom match the live roster and assign a role, or reject.
 * Verified identity never grants tenant data, checklists, or schedule.
 * This module does not send mail, apply SQL, or mint live credentials.
 */

export const ONE_SEAT_CLAIM_ENABLED_ENV = 'ONE_SEAT_CLAIM_ENABLED';
export const ONE_SEAT_ALLOW_LIVE_EMAIL_ENV = 'ONE_SEAT_ALLOW_LIVE_EMAIL';
export const ONE_SEAT_CLAIM_STATUS = 'drafted' as const;

export const CLAIM_PROVIDERS = ['email', 'google'] as const;
export type ClaimProvider = (typeof CLAIM_PROVIDERS)[number];
export const UNAVAILABLE_CLAIM_PROVIDERS = ['phone', 'x'] as const;

export const APPROVER_ROLES = ['myke', 'tom'] as const;
export type ApproverRole = (typeof APPROVER_ROLES)[number];

export const CLAIM_STATES = ['pending', 'approved', 'rejected', 'revoked'] as const;
export type ClaimState = (typeof CLAIM_STATES)[number];

export type OneSeatIdentity = {
  id: string;
  emailHash: string;
  googleSubHash: string | null;
  createdAt: string;
};

export type OneSeatClaim = {
  id: string;
  identityId: string;
  operatorId: number;
  status: ClaimState;
  provider: ClaimProvider;
  requestedAt: string;
  decidedAt: string | null;
  decidedBy: ApproverRole | null;
  assignedSeatKey: StationSeatKey | null;
  assignedDepartment: string | null;
  assignedSeatId: string | null;
  locationId: number | null;
};

export type SyntheticRosterRow = {
  operatorId: number;
  locationId: number;
  seatId: string;
  seatKey: StationSeatKey;
  department: string;
  emailHash: string;
  status: 'active' | 'inactive';
};

export type OneSeatAuditEvent = {
  id: string;
  action: 'verify' | 'claim' | 'approve' | 'reject' | 'revoke' | 'reset' | 'link' | 'rate_limit';
  identityId: string | null;
  claimId: string | null;
  actor: 'system' | ApproverRole | 'identity';
  outcome: 'accepted' | 'denied';
  reason: string;
  mailSent: false;
  at: string;
};

export type PendingIdentitySession = {
  kind: 'identity-pending';
  identityId: string;
  claimId: string;
  grantsFullOperatorAccess: false;
  hasTenantAccess: false;
};

export type ApprovedSeatSession = {
  kind: 'staff-seat';
  identityId: string;
  claimId: string;
  operatorId: number;
  locationId: number;
  seatId: string;
  seatKey: StationSeatKey;
  department: string;
  grantsFullOperatorAccess: false;
  hasTenantAccess: true;
};

export type OneSeatSession = PendingIdentitySession | ApprovedSeatSession;

export type GooglePkceState = {
  state: string;
  challenge: string;
  verifier: string;
  nonce: string;
  exp: string;
};

export type EmailChallenge = {
  identityId: string;
  tokenHash: string;
  exp: string;
  consumedAt: string | null;
};

export type OneSeatStore = {
  identities: OneSeatIdentity[];
  claims: OneSeatClaim[];
  roster: SyntheticRosterRow[];
  events: OneSeatAuditEvent[];
  rateWindows: { key: string; atMs: number }[];
  oauthStates: GooglePkceState[];
  emailChallenges: EmailChallenge[];
};

export const SYNTHETIC_OPERATOR_ID = 9001;
export const SYNTHETIC_LOCATION_ID = 1;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const CHALLENGE_TTL_MS = 15 * 60 * 1000;

export function hashIdentifier(raw: string): string {
  return createHash('sha256').update(raw.trim().toLowerCase(), 'utf8').digest('hex');
}

export type EnvMap = Record<string, string | undefined>;

export function liveEmailAllowed(env: EnvMap = process.env): boolean {
  return env[ONE_SEAT_ALLOW_LIVE_EMAIL_ENV] === 'true';
}

export function normalizeEmail(
  raw: unknown,
  env: EnvMap = process.env,
): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) return null;
  if (email.endsWith('@example.test') || email.endsWith('@never86.test')) return email;
  // Live shop emails (CTAP seat 1) only when ONE_SEAT_ALLOW_LIVE_EMAIL=true.
  if (liveEmailAllowed(env)) return email;
  return null;
}

export function emptyOneSeatStore(roster: SyntheticRosterRow[] = []): OneSeatStore {
  return {
    identities: [],
    claims: [],
    roster,
    events: [],
    rateWindows: [],
    oauthStates: [],
    emailChallenges: [],
  };
}

export function syntheticDemoRoster(): SyntheticRosterRow[] {
  return [
    {
      operatorId: SYNTHETIC_OPERATOR_ID,
      locationId: SYNTHETIC_LOCATION_ID,
      seatId: 'seat-foh-demo',
      seatKey: 'foh_manager',
      department: 'front',
      emailHash: hashIdentifier('foh@example.test'),
      status: 'active',
    },
    {
      operatorId: SYNTHETIC_OPERATOR_ID,
      locationId: SYNTHETIC_LOCATION_ID,
      seatId: 'seat-kitchen-demo',
      seatKey: 'kitchen_manager',
      department: 'kitchen',
      emailHash: hashIdentifier('kitchen@example.test'),
      status: 'active',
    },
  ];
}

export function evaluateOneSeatClaimEnablement(
  env: Record<string, string | undefined> = process.env,
): {
  ready: boolean;
  status: 'database_url_missing' | 'not_enabled' | 'ready';
  error: string;
  mailSent: false;
} {
  if (!env.DATABASE_URL) {
    return {
      ready: false,
      status: 'database_url_missing',
      error: 'One-seat claim fails closed: DATABASE_URL is missing. No mail sent. No tenant access.',
      mailSent: false,
    };
  }
  if (env[ONE_SEAT_CLAIM_ENABLED_ENV] !== 'true') {
    return {
      ready: false,
      status: 'not_enabled',
      error: 'One-seat claim stays blocked until sql/0006_one_seat_claim.sql is applied and ONE_SEAT_CLAIM_ENABLED=true. No mail sent.',
      mailSent: false,
    };
  }
  return { ready: true, status: 'ready', error: '', mailSent: false };
}

function nowIso(now?: string): string {
  return now ?? new Date().toISOString();
}

function nowMs(now?: string): number {
  return now ? Date.parse(now) : Date.now();
}

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

function record(
  store: OneSeatStore,
  event: Omit<OneSeatAuditEvent, 'id' | 'mailSent'>,
): OneSeatAuditEvent {
  const row: OneSeatAuditEvent = { ...event, id: newId('evt'), mailSent: false };
  store.events.push(row);
  return row;
}

export function hitRateLimit(store: OneSeatStore, key: string, atMs: number): boolean {
  store.rateWindows = store.rateWindows.filter((row) => atMs - row.atMs < RATE_LIMIT_WINDOW_MS);
  const count = store.rateWindows.filter((row) => row.key === key).length;
  if (count >= RATE_LIMIT_MAX) {
    record(store, {
      action: 'rate_limit',
      identityId: null,
      claimId: null,
      actor: 'system',
      outcome: 'denied',
      reason: 'rate_limited',
      at: new Date(atMs).toISOString(),
    });
    return true;
  }
  store.rateWindows.push({ key, atMs });
  return false;
}

export function findIdentityByEmailHash(store: OneSeatStore, emailHash: string): OneSeatIdentity | undefined {
  return store.identities.find((row) => row.emailHash === emailHash);
}

export function linkGoogleSub(store: OneSeatStore, identity: OneSeatIdentity, googleSubHash: string, at: string): OneSeatIdentity {
  const existing = store.identities.find((row) => row.googleSubHash === googleSubHash && row.id !== identity.id);
  if (existing) {
    record(store, {
      action: 'link',
      identityId: identity.id,
      claimId: null,
      actor: 'system',
      outcome: 'accepted',
      reason: 'duplicate_google_linked_to_canonical_email',
      at,
    });
    return existing;
  }
  identity.googleSubHash = googleSubHash;
  record(store, {
    action: 'link',
    identityId: identity.id,
    claimId: null,
    actor: 'system',
    outcome: 'accepted',
    reason: 'google_sub_linked',
    at,
  });
  return identity;
}

function upsertIdentity(store: OneSeatStore, emailHash: string, at: string, googleSubHash?: string): OneSeatIdentity {
  let identity = findIdentityByEmailHash(store, emailHash);
  if (!identity) {
    identity = { id: newId('idn'), emailHash, googleSubHash: googleSubHash ?? null, createdAt: at };
    store.identities.push(identity);
  } else if (googleSubHash) {
    identity = linkGoogleSub(store, identity, googleSubHash, at);
  }
  return identity;
}

function openPendingClaim(store: OneSeatStore, identity: OneSeatIdentity, provider: ClaimProvider, at: string): OneSeatClaim {
  const open = store.claims.find((row) => row.identityId === identity.id && row.status === 'pending');
  if (open) return open;
  const claim: OneSeatClaim = {
    id: newId('clm'),
    identityId: identity.id,
    operatorId: SYNTHETIC_OPERATOR_ID,
    status: 'pending',
    provider,
    requestedAt: at,
    decidedAt: null,
    decidedBy: null,
    assignedSeatKey: null,
    assignedDepartment: null,
    assignedSeatId: null,
    locationId: null,
  };
  store.claims.push(claim);
  record(store, {
    action: 'claim',
    identityId: identity.id,
    claimId: claim.id,
    actor: 'identity',
    outcome: 'accepted',
    reason: 'pending_ctap_request_no_tenant_access',
    at,
  });
  return claim;
}

export function pendingSession(claim: OneSeatClaim, identityId: string): PendingIdentitySession {
  return {
    kind: 'identity-pending',
    identityId,
    claimId: claim.id,
    grantsFullOperatorAccess: false,
    hasTenantAccess: false,
  };
}

export function sessionFromClaim(store: OneSeatStore, claim: OneSeatClaim): OneSeatSession | null {
  if (claim.status === 'pending') return pendingSession(claim, claim.identityId);
  if (claim.status !== 'approved' || !claim.assignedSeatKey || !claim.assignedSeatId || claim.locationId == null || !claim.assignedDepartment) {
    return pendingSession(claim, claim.identityId);
  }
  return {
    kind: 'staff-seat',
    identityId: claim.identityId,
    claimId: claim.id,
    operatorId: claim.operatorId,
    locationId: claim.locationId,
    seatId: claim.assignedSeatId,
    seatKey: claim.assignedSeatKey,
    department: claim.assignedDepartment,
    grantsFullOperatorAccess: false,
    hasTenantAccess: true,
  };
}

export function startEmailClaim(input: {
  email: unknown;
  ip: string;
  store: OneSeatStore;
  now?: string;
  allowLiveEmail?: boolean;
  env?: EnvMap;
  /** Test-only. HTTP routes must omit this. */
  testToken?: string;
}): {
  ok: boolean;
  error?: string;
  mailSent: false;
  session?: PendingIdentitySession;
  challengeIssued: boolean;
  rawToken?: never;
} {
  const at = nowIso(input.now);
  const atMs = nowMs(input.now);
  const env: EnvMap = { ...(input.env ?? process.env) };
  if (input.allowLiveEmail) env[ONE_SEAT_ALLOW_LIVE_EMAIL_ENV] = 'true';
  const email = normalizeEmail(input.email, env);
  if (!email) {
    return { ok: false, error: 'Use a valid work email. Phone and X are not available yet.', mailSent: false, challengeIssued: false };
  }
  if (hitRateLimit(input.store, `email:${hashIdentifier(email)}:${input.ip}`, atMs)) {
    return { ok: false, error: 'Too many claim attempts. Try later.', mailSent: false, challengeIssued: false };
  }
  const identity = upsertIdentity(input.store, hashIdentifier(email), at);
  const claim = openPendingClaim(input.store, identity, 'email', at);
  const token = input.testToken && input.testToken.length >= 16
    ? input.testToken
    : randomBytes(32).toString('hex');
  input.store.emailChallenges.push({
    identityId: identity.id,
    tokenHash: hashIdentifier(token),
    exp: new Date(atMs + CHALLENGE_TTL_MS).toISOString(),
    consumedAt: null,
  });
  record(input.store, {
    action: 'verify',
    identityId: identity.id,
    claimId: claim.id,
    actor: 'system',
    outcome: 'accepted',
    reason: 'email_challenge_hashed_not_returned',
    at,
  });
  return {
    ok: true,
    mailSent: false,
    challengeIssued: true,
    session: pendingSession(claim, identity.id),
  };
}

/** Test-only helper. HTTP routes must never return the raw token. */
export function peekLatestEmailChallengeTokenHash(store: OneSeatStore): string | null {
  const last = store.emailChallenges[store.emailChallenges.length - 1];
  return last?.tokenHash ?? null;
}

export function consumeEmailChallenge(input: {
  store: OneSeatStore;
  email: unknown;
  token: string;
  now?: string;
}): { ok: boolean; error?: string; mailSent: false; session?: PendingIdentitySession } {
  const at = nowIso(input.now);
  const email = normalizeEmail(input.email);
  if (!email || input.token.length < 16) {
    return { ok: false, error: 'Email verification failed.', mailSent: false };
  }
  const identity = findIdentityByEmailHash(input.store, hashIdentifier(email));
  if (!identity) return { ok: false, error: 'Email verification failed.', mailSent: false };
  const tokenHash = hashIdentifier(input.token);
  const challenge = input.store.emailChallenges.find((row) => (
    row.identityId === identity.id
    && row.tokenHash === tokenHash
    && row.consumedAt === null
    && Date.parse(row.exp) > nowMs(input.now)
  ));
  if (!challenge) return { ok: false, error: 'Email verification failed.', mailSent: false };
  challenge.consumedAt = at;
  const claim = openPendingClaim(input.store, identity, 'email', at);
  record(input.store, {
    action: 'verify',
    identityId: identity.id,
    claimId: claim.id,
    actor: 'identity',
    outcome: 'accepted',
    reason: 'email_verified_pending_only',
    at,
  });
  return { ok: true, mailSent: false, session: pendingSession(claim, identity.id) };
}

export function createGooglePkceState(store: OneSeatStore, now?: string): GooglePkceState {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const row: GooglePkceState = {
    state: randomBytes(16).toString('hex'),
    challenge,
    verifier,
    nonce: randomBytes(16).toString('hex'),
    exp: new Date(nowMs(now) + CHALLENGE_TTL_MS).toISOString(),
  };
  store.oauthStates.push(row);
  return row;
}

export function verifyPkceS256(verifier: string, challenge: string): boolean {
  const actual = createHash('sha256').update(verifier).digest('base64url');
  const a = Buffer.from(actual);
  const b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function completeGoogleClaim(input: {
  store: OneSeatStore;
  state: string;
  email: unknown;
  googleSub: string;
  now?: string;
}): { ok: boolean; error?: string; mailSent: false; session?: PendingIdentitySession } {
  const at = nowIso(input.now);
  const email = normalizeEmail(input.email);
  const oauth = input.store.oauthStates.find((row) => row.state === input.state && Date.parse(row.exp) > nowMs(input.now));
  if (!oauth || !email || !input.googleSub) {
    return { ok: false, error: 'Google verification failed.', mailSent: false };
  }
  if (!verifyPkceS256(oauth.verifier, oauth.challenge)) {
    return { ok: false, error: 'Google verification failed.', mailSent: false };
  }
  input.store.oauthStates = input.store.oauthStates.filter((row) => row.state !== input.state);
  const identity = upsertIdentity(input.store, hashIdentifier(email), at, hashIdentifier(input.googleSub));
  const claim = openPendingClaim(input.store, identity, 'google', at);
  record(input.store, {
    action: 'verify',
    identityId: identity.id,
    claimId: claim.id,
    actor: 'identity',
    outcome: 'accepted',
    reason: 'google_verified_pending_only',
    at,
  });
  return { ok: true, mailSent: false, session: pendingSession(claim, identity.id) };
}

export function matchRoster(store: OneSeatStore, emailHash: string): SyntheticRosterRow | null {
  const row = store.roster.find((item) => item.emailHash === emailHash && item.status === 'active');
  return row ?? null;
}

export function decideClaim(input: {
  store: OneSeatStore;
  claimId: string;
  approver: unknown;
  decision: 'approve' | 'reject' | 'revoke' | 'reset';
  now?: string;
}): { ok: boolean; error?: string; mailSent: false; claim?: OneSeatClaim; session?: OneSeatSession | null } {
  const at = nowIso(input.now);
  if (!APPROVER_ROLES.includes(input.approver as ApproverRole)) {
    return { ok: false, error: 'Only Myke or Tom can decide a CTAP request.', mailSent: false };
  }
  const approver = input.approver as ApproverRole;
  const claim = input.store.claims.find((row) => row.id === input.claimId);
  if (!claim) return { ok: false, error: 'Request not found.', mailSent: false };

  if (input.decision === 'reject') {
    claim.status = 'rejected';
    claim.decidedAt = at;
    claim.decidedBy = approver;
    record(input.store, {
      action: 'reject',
      identityId: claim.identityId,
      claimId: claim.id,
      actor: approver,
      outcome: 'accepted',
      reason: 'rejected_no_tenant_access',
      at,
    });
    return { ok: true, mailSent: false, claim, session: pendingSession(claim, claim.identityId) };
  }

  if (input.decision === 'revoke') {
    claim.status = 'revoked';
    claim.decidedAt = at;
    claim.decidedBy = approver;
    claim.assignedSeatKey = null;
    claim.assignedDepartment = null;
    claim.assignedSeatId = null;
    record(input.store, {
      action: 'revoke',
      identityId: claim.identityId,
      claimId: claim.id,
      actor: approver,
      outcome: 'accepted',
      reason: 'revoked_workspace_closed',
      at,
    });
    return { ok: true, mailSent: false, claim, session: pendingSession(claim, claim.identityId) };
  }

  if (input.decision === 'reset') {
    claim.status = 'pending';
    claim.decidedAt = null;
    claim.decidedBy = null;
    claim.assignedSeatKey = null;
    claim.assignedDepartment = null;
    claim.assignedSeatId = null;
    claim.locationId = null;
    record(input.store, {
      action: 'reset',
      identityId: claim.identityId,
      claimId: claim.id,
      actor: approver,
      outcome: 'accepted',
      reason: 'reset_to_pending_reverify_required',
      at,
    });
    return { ok: true, mailSent: false, claim, session: pendingSession(claim, claim.identityId) };
  }

  const identity = input.store.identities.find((row) => row.id === claim.identityId);
  if (!identity) return { ok: false, error: 'Identity missing.', mailSent: false };
  const roster = matchRoster(input.store, identity.emailHash);
  if (!roster || roster.operatorId !== claim.operatorId) {
    record(input.store, {
      action: 'approve',
      identityId: claim.identityId,
      claimId: claim.id,
      actor: approver,
      outcome: 'denied',
      reason: 'no_live_roster_match',
      at,
    });
    return { ok: false, error: 'No live roster match. Reject or wait for roster update.', mailSent: false, claim };
  }
  if (!isStationSeatKey(roster.seatKey)) {
    return { ok: false, error: 'Roster seat is not a known station.', mailSent: false };
  }
  claim.status = 'approved';
  claim.decidedAt = at;
  claim.decidedBy = approver;
  claim.assignedSeatKey = roster.seatKey;
  claim.assignedDepartment = roster.department;
  claim.assignedSeatId = roster.seatId;
  claim.locationId = roster.locationId;
  record(input.store, {
    action: 'approve',
    identityId: claim.identityId,
    claimId: claim.id,
    actor: approver,
    outcome: 'accepted',
    reason: 'roster_matched_role_scoped_only',
    at,
  });
  return { ok: true, mailSent: false, claim, session: sessionFromClaim(input.store, claim) };
}

export function approvalInbox(store: OneSeatStore): OneSeatClaim[] {
  return store.claims.filter((row) => row.status === 'pending');
}

export function signState(value: string, secret: string): string {
  return `${value}.${createHmac('sha256', secret).update(value).digest('hex')}`;
}

export function verifySignedState(raw: string, secret: string): string | null {
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return null;
  const value = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = createHmac('sha256', secret).update(value).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

export function unavailableProviderMessage(provider: string): string {
  if (UNAVAILABLE_CLAIM_PROVIDERS.includes(provider as (typeof UNAVAILABLE_CLAIM_PROVIDERS)[number])) {
    return 'Phone and X sign-in wait until a real provider configuration exists. Use email or Google.';
  }
  return 'Unknown sign-in provider.';
}
