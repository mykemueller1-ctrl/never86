import { NextRequest, NextResponse } from 'next/server';
import {
  isAllowedGrokRedirect,
  issueOAuthArtifact,
  normalizedOAuthScope,
  oauthClientId,
} from '../../../../../lib/orchestratorOAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: 'invalid_request', error_description: message }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const secret = process.env.NEVER86_OAUTH_CLIENT_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'server_error' }, { status: 503 });

  const clientId = req.nextUrl.searchParams.get('client_id') ?? '';
  const redirectUri = req.nextUrl.searchParams.get('redirect_uri') ?? '';
  const responseType = req.nextUrl.searchParams.get('response_type');
  const state = req.nextUrl.searchParams.get('state');
  const challenge = req.nextUrl.searchParams.get('code_challenge') ?? undefined;
  const challengeMethod = req.nextUrl.searchParams.get('code_challenge_method');

  if (clientId !== oauthClientId()) return badRequest('Unknown OAuth client.');
  if (responseType !== 'code') return badRequest('Only authorization_code is supported.');
  if (!isAllowedGrokRedirect(redirectUri)) return badRequest('The redirect URI is not allowlisted for Grok.');
  if (challenge && challengeMethod !== 'S256') return badRequest('Only PKCE S256 is supported.');

  const code = issueOAuthArtifact('code', {
    clientId,
    scope: normalizedOAuthScope(req.nextUrl.searchParams.get('scope')),
    redirectUri,
    ...(challenge ? { codeChallenge: challenge } : {}),
  }, secret, 300);

  const redirect = new URL(redirectUri);
  redirect.searchParams.set('code', code);
  if (state) redirect.searchParams.set('state', state);
  return NextResponse.redirect(redirect, 302);
}

