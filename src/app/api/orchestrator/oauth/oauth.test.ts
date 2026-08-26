import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as authorize } from './authorize/route';
import { POST as token } from './token/route';
import { POST as mcp } from '../mcp/route';

describe('Grok OAuth connector flow', () => {
  beforeEach(() => {
    process.env.NEVER86_OAUTH_CLIENT_ID = 'test-grok-client';
    process.env.NEVER86_OAUTH_CLIENT_SECRET = 'test-client-secret-long-enough';
    process.env.CURSOR_API_KEY = 'test-cursor-token-not-real';
  });

  afterEach(() => {
    delete process.env.NEVER86_OAUTH_CLIENT_ID;
    delete process.env.NEVER86_OAUTH_CLIENT_SECRET;
    delete process.env.CURSOR_API_KEY;
  });

  it('exchanges a signed PKCE code and uses the OAuth token on the private MCP', async () => {
    const verifier = 'never86-pkce-verifier-long-enough';
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const callback = 'https://grok.com/connectors/oauth/callback';
    const authUrl = new URL('http://localhost/api/orchestrator/oauth/authorize');
    authUrl.search = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-grok-client',
      redirect_uri: callback,
      state: 'state-123',
      scope: 'cursor:read cursor:dispatch',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();

    const authResponse = await authorize(new NextRequest(authUrl));
    expect(authResponse.status).toBe(302);
    const redirect = new URL(authResponse.headers.get('location') ?? '');
    expect(redirect.origin).toBe('https://grok.com');
    expect(redirect.searchParams.get('state')).toBe('state-123');

    const tokenResponse = await token(new NextRequest('http://localhost/api/orchestrator/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'test-grok-client',
        client_secret: 'test-client-secret-long-enough',
        code: redirect.searchParams.get('code') ?? '',
        redirect_uri: callback,
        code_verifier: verifier,
      }),
    }));
    const tokens = await tokenResponse.json();
    expect(tokenResponse.status).toBe(200);
    expect(tokens.access_token).toMatch(/^n86oa\./);
    expect(tokens.refresh_token).toMatch(/^n86or\./);

    const mcpResponse = await mcp(new NextRequest('http://localhost/api/orchestrator/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access_token}` },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }));
    const payload = await mcpResponse.json();
    expect(mcpResponse.status).toBe(200);
    expect(payload.result.tools).toHaveLength(4);
  });

  it('rejects non-Grok redirect targets before issuing a code', async () => {
    const url = new URL('http://localhost/api/orchestrator/oauth/authorize?response_type=code&client_id=test-grok-client&redirect_uri=https%3A%2F%2Fevil.example%2Fcallback');
    const response = await authorize(new NextRequest(url));
    expect(response.status).toBe(400);
  });
});

