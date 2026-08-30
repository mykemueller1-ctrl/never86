import { NextResponse } from 'next/server';
import {
  ONE_SEAT_CLAIM_ENABLED_ENV,
  completeGoogleClaim,
  createGooglePkceState,
  decideClaim,
  emptyOneSeatStore,
  evaluateOneSeatClaimEnablement,
  startEmailClaim,
  syntheticDemoRoster,
  unavailableProviderMessage,
  type OneSeatStore,
  type ApproverRole,
} from './oneSeatClaim';

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' } as const;

let memoryStore: OneSeatStore | null = null;

export function getOneSeatMemoryStore(): OneSeatStore {
  if (!memoryStore) memoryStore = emptyOneSeatStore(syntheticDemoRoster());
  return memoryStore;
}

export function resetOneSeatMemoryStore(store?: OneSeatStore): OneSeatStore {
  memoryStore = store ?? emptyOneSeatStore(syntheticDemoRoster());
  return memoryStore;
}

export function oneSeatBlocked(error: string, status = 503) {
  return NextResponse.json(
    {
      success: false,
      issuance: 'blocked',
      error,
      mailSent: false,
      grantsFullOperatorAccess: false,
      hasTenantAccess: false,
      ownerPlane: '/login',
    },
    { status, headers: NOINDEX },
  );
}

export function oneSeatOk(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { success: true, mailSent: false, grantsFullOperatorAccess: false, ...body },
    { status, headers: NOINDEX },
  );
}

export function gateOneSeatClaim(env: Record<string, string | undefined> = process.env) {
  return evaluateOneSeatClaimEnablement(env);
}

export function liveMailProviderReady(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() || env.STAFF_CLAIM_MAIL_PROVIDER === 'ready');
}

export function liveGoogleReady(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim() && env.ONE_SEAT_STATE_SECRET?.trim());
}

export function handleEmailStart(input: {
  email: unknown;
  ip: string;
  provider?: unknown;
  store?: OneSeatStore;
  env?: Record<string, string | undefined>;
}) {
  const env = input.env ?? process.env;
  if (input.provider && input.provider !== 'email') {
    return { ok: false as const, error: unavailableProviderMessage(String(input.provider)), mailSent: false as const };
  }
  const gate = gateOneSeatClaim(env);
  if (!gate.ready) return { ok: false as const, error: gate.error, mailSent: false as const };
  if (!liveMailProviderReady(env)) {
    return {
      ok: false as const,
      error: 'Email claim fails closed until a mail provider is configured. No raw token is returned. No mail sent.',
      mailSent: false as const,
    };
  }
  return startEmailClaim({
    email: input.email,
    ip: input.ip,
    store: input.store ?? getOneSeatMemoryStore(),
  });
}

export function handleGoogleStart(input: {
  store?: OneSeatStore;
  env?: Record<string, string | undefined>;
}) {
  const env = input.env ?? process.env;
  const gate = gateOneSeatClaim(env);
  if (!gate.ready) return { ok: false as const, error: gate.error, mailSent: false as const };
  if (!liveGoogleReady(env)) {
    return {
      ok: false as const,
      error: 'Google claim fails closed until GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and ONE_SEAT_STATE_SECRET exist. No mail sent.',
      mailSent: false as const,
    };
  }
  const pkce = createGooglePkceState(input.store ?? getOneSeatMemoryStore());
  const redirect = env.ONE_SEAT_GOOGLE_REDIRECT ?? 'https://www.never86.ai/api/staff/claim/google/callback';
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID!);
  url.searchParams.set('redirect_uri', redirect);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email');
  url.searchParams.set('state', pkce.state);
  url.searchParams.set('nonce', pkce.nonce);
  url.searchParams.set('code_challenge', pkce.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return { ok: true as const, mailSent: false as const, authorizationUrl: url.toString(), state: pkce.state };
}

export function handleGoogleCallback(input: {
  state: string;
  email: unknown;
  googleSub: string;
  store?: OneSeatStore;
  env?: Record<string, string | undefined>;
}) {
  const gate = gateOneSeatClaim(input.env ?? process.env);
  if (!gate.ready) return { ok: false as const, error: gate.error, mailSent: false as const };
  return completeGoogleClaim({
    store: input.store ?? getOneSeatMemoryStore(),
    state: input.state,
    email: input.email,
    googleSub: input.googleSub,
  });
}

export function handleDecision(input: {
  claimId: string;
  approver: unknown;
  decision: 'approve' | 'reject' | 'revoke' | 'reset';
  store?: OneSeatStore;
  env?: Record<string, string | undefined>;
}) {
  const gate = gateOneSeatClaim(input.env ?? process.env);
  if (!gate.ready) return { ok: false as const, error: gate.error, mailSent: false as const };
  return decideClaim({
    store: input.store ?? getOneSeatMemoryStore(),
    claimId: input.claimId,
    approver: input.approver as ApproverRole,
    decision: input.decision,
  });
}

export { ONE_SEAT_CLAIM_ENABLED_ENV, NOINDEX };
