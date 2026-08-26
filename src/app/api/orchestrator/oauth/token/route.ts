import { NextRequest, NextResponse } from 'next/server';
import {
  issueOAuthArtifact,
  normalizedOAuthScope,
  oauthClientId,
  validOAuthClientSecret,
  verifyOAuthArtifact,
  verifyPkce,
} from '../../../../../lib/orchestratorOAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function tokenResponse(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } });
}

function basicCredentials(header: string | null): { clientId: string; secret: string } | null {
  const match = /^Basic\s+(.+)$/i.exec(header?.trim() ?? '');
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const split = decoded.indexOf(':');
    if (split < 0) return null;
    return { clientId: decodeURIComponent(decoded.slice(0, split)), secret: decodeURIComponent(decoded.slice(split + 1)) };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const signingSecret = process.env.NEVER86_OAUTH_CLIENT_SECRET?.trim();
  if (!signingSecret) return tokenResponse({ error: 'server_error' }, 503);

  const form = new URLSearchParams(await req.text());
  const basic = basicCredentials(req.headers.get('authorization'));
  const clientId = basic?.clientId || form.get('client_id') || '';
  const clientSecret = basic?.secret || form.get('client_secret') || '';
  if (clientId !== oauthClientId() || !validOAuthClientSecret(clientSecret)) {
    return tokenResponse({ error: 'invalid_client' }, 401);
  }

  const grantType = form.get('grant_type');
  if (grantType === 'authorization_code') {
    const code = form.get('code') ?? '';
    const claims = verifyOAuthArtifact(code, 'code', signingSecret);
    if (!claims || claims.redirectUri !== form.get('redirect_uri')) return tokenResponse({ error: 'invalid_grant' }, 400);
    if (claims.codeChallenge) {
      const verifier = form.get('code_verifier') ?? '';
      if (!verifier || !verifyPkce(verifier, claims.codeChallenge)) return tokenResponse({ error: 'invalid_grant' }, 400);
    }

    return tokenResponse({
      access_token: issueOAuthArtifact('access', { clientId, scope: claims.scope }, signingSecret, 3600),
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: issueOAuthArtifact('refresh', { clientId, scope: claims.scope }, signingSecret, 2_592_000),
      scope: claims.scope,
    });
  }

  if (grantType === 'refresh_token') {
    const claims = verifyOAuthArtifact(form.get('refresh_token') ?? '', 'refresh', signingSecret);
    if (!claims) return tokenResponse({ error: 'invalid_grant' }, 400);
    const scope = normalizedOAuthScope(form.get('scope') || claims.scope);
    return tokenResponse({
      access_token: issueOAuthArtifact('access', { clientId, scope }, signingSecret, 3600),
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: issueOAuthArtifact('refresh', { clientId, scope }, signingSecret, 2_592_000),
      scope,
    });
  }

  return tokenResponse({ error: 'unsupported_grant_type' }, 400);
}

