import crypto from 'crypto';

export const DEFAULT_OAUTH_CLIENT_ID = 'grok-never86-cursor';
export const OAUTH_SCOPES = ['cursor:read', 'cursor:dispatch'] as const;

type OAuthArtifactKind = 'code' | 'access' | 'refresh';

export type OAuthArtifact = {
  kind: OAuthArtifactKind;
  clientId: string;
  scope: string;
  exp: number;
  nonce: string;
  redirectUri?: string;
  codeChallenge?: string;
};

const PREFIXES: Record<OAuthArtifactKind, string> = {
  code: 'n86oc',
  access: 'n86oa',
  refresh: 'n86or',
};

function signature(prefix: string, payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${prefix}.${payload}`).digest('base64url');
}

function secretEqual(left: string, right: string): boolean {
  const a = crypto.createHash('sha256').update(left).digest();
  const b = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(a, b);
}

export function oauthClientId(): string {
  return process.env.NEVER86_OAUTH_CLIENT_ID?.trim() || DEFAULT_OAUTH_CLIENT_ID;
}

export function isAllowedGrokRedirect(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return host === 'grok.com' || host.endsWith('.grok.com') || host === 'x.ai' || host.endsWith('.x.ai');
  } catch {
    return false;
  }
}

export function normalizedOAuthScope(raw: string | null | undefined): string {
  const requested = new Set((raw ?? '').split(/\s+/).filter(Boolean));
  const allowed = OAUTH_SCOPES.filter((scope) => requested.size === 0 || requested.has(scope));
  return (allowed.length > 0 ? allowed : ['cursor:read']).join(' ');
}

export function issueOAuthArtifact(
  kind: OAuthArtifactKind,
  claims: Omit<OAuthArtifact, 'kind' | 'exp' | 'nonce'>,
  secret: string,
  ttlSeconds: number,
  nowMs = Date.now(),
): string {
  const prefix = PREFIXES[kind];
  const payload = Buffer.from(JSON.stringify({
    ...claims,
    kind,
    exp: Math.floor(nowMs / 1000) + ttlSeconds,
    nonce: crypto.randomBytes(16).toString('base64url'),
  } satisfies OAuthArtifact)).toString('base64url');
  return `${prefix}.${payload}.${signature(prefix, payload, secret)}`;
}

export function verifyOAuthArtifact(
  token: string,
  expectedKind: OAuthArtifactKind,
  secret: string,
  nowMs = Date.now(),
): OAuthArtifact | null {
  const [prefix, payload, providedSignature, extra] = token.split('.');
  if (extra !== undefined || prefix !== PREFIXES[expectedKind] || !payload || !providedSignature) return null;
  if (!secretEqual(providedSignature, signature(prefix, payload, secret))) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<OAuthArtifact>;
    if (claims.kind !== expectedKind || claims.clientId !== oauthClientId()) return null;
    if (typeof claims.exp !== 'number' || claims.exp < Math.floor(nowMs / 1000)) return null;
    if (typeof claims.scope !== 'string' || typeof claims.nonce !== 'string') return null;
    return claims as OAuthArtifact;
  } catch {
    return null;
  }
}

export function verifyPkce(verifier: string, expectedChallenge: string): boolean {
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return secretEqual(challenge, expectedChallenge);
}

export function validOAuthAccessToken(token: string): boolean {
  const secret = process.env.NEVER86_OAUTH_CLIENT_SECRET?.trim();
  if (!secret) return false;
  return verifyOAuthArtifact(token, 'access', secret) !== null;
}

export function validOAuthClientSecret(provided: string): boolean {
  const expected = process.env.NEVER86_OAUTH_CLIENT_SECRET?.trim();
  return Boolean(expected && provided && secretEqual(provided, expected));
}

