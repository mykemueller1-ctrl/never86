import { NextResponse } from 'next/server';
import { OAUTH_SCOPES } from '../../../lib/orchestratorOAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    issuer: 'https://www.never86.ai',
    authorization_endpoint: 'https://www.never86.ai/api/orchestrator/oauth/authorize',
    token_endpoint: 'https://www.never86.ai/api/orchestrator/oauth/token',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: OAUTH_SCOPES,
  });
}

