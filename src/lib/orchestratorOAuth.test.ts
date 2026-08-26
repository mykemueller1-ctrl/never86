import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isAllowedGrokRedirect,
  issueOAuthArtifact,
  normalizedOAuthScope,
  validOAuthAccessToken,
  verifyOAuthArtifact,
  verifyPkce,
} from './orchestratorOAuth';

describe('Never86 orchestrator OAuth', () => {
  beforeEach(() => {
    process.env.NEVER86_OAUTH_CLIENT_ID = 'test-grok-client';
    process.env.NEVER86_OAUTH_CLIENT_SECRET = 'test-client-secret-long-enough';
  });

  afterEach(() => {
    delete process.env.NEVER86_OAUTH_CLIENT_ID;
    delete process.env.NEVER86_OAUTH_CLIENT_SECRET;
  });

  it('only accepts xAI and Grok HTTPS callback hosts', () => {
    expect(isAllowedGrokRedirect('https://grok.com/oauth/callback')).toBe(true);
    expect(isAllowedGrokRedirect('https://accounts.x.ai/connectors/callback')).toBe(true);
    expect(isAllowedGrokRedirect('https://grok.com.evil.example/callback')).toBe(false);
    expect(isAllowedGrokRedirect('http://grok.com/callback')).toBe(false);
  });

  it('signs, verifies, expires, and rejects tampered access tokens', () => {
    const token = issueOAuthArtifact('access', { clientId: 'test-grok-client', scope: 'cursor:read' }, 'test-client-secret-long-enough', 60, 1_000_000);
    expect(verifyOAuthArtifact(token, 'access', 'test-client-secret-long-enough', 1_010_000)?.scope).toBe('cursor:read');
    expect(verifyOAuthArtifact(`${token}x`, 'access', 'test-client-secret-long-enough', 1_010_000)).toBeNull();
    expect(verifyOAuthArtifact(token, 'access', 'test-client-secret-long-enough', 1_100_000)).toBeNull();
  });

  it('validates PKCE S256 challenges', () => {
    const verifier = 'pkce-verifier-for-never86';
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    expect(verifyPkce(verifier, challenge)).toBe(true);
    expect(verifyPkce('wrong-verifier', challenge)).toBe(false);
  });

  it('limits scopes and recognizes live OAuth access tokens', () => {
    expect(normalizedOAuthScope('cursor:read admin:all')).toBe('cursor:read');
    const token = issueOAuthArtifact('access', { clientId: 'test-grok-client', scope: 'cursor:read cursor:dispatch' }, 'test-client-secret-long-enough', 60);
    expect(validOAuthAccessToken(token)).toBe(true);
  });
});

