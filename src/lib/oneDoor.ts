/**
 * One door: www.never86.ai is the only public free-seat host.
 * Alias hosts (app.never86.app, etc.) redirect here once DNS points at Vercel.
 */

export const ONE_DOOR_CANONICAL_HOST = 'www.never86.ai' as const;
export const ONE_DOOR_CANONICAL_ORIGIN = `https://${ONE_DOOR_CANONICAL_HOST}` as const;

/** Hosts that must 308 to the canonical origin (path + query preserved). */
export const ONE_DOOR_ALIAS_HOSTS = [
  'app.never86.app',
  'www.never86.app',
  'never86.app',
] as const;

export type OneDoorAliasHost = (typeof ONE_DOOR_ALIAS_HOSTS)[number];

export function normalizeHost(hostHeader: string | null | undefined): string {
  if (!hostHeader) return '';
  return hostHeader.split(':')[0]?.trim().toLowerCase() ?? '';
}

export function isOneDoorAliasHost(hostHeader: string | null | undefined): boolean {
  const host = normalizeHost(hostHeader);
  return (ONE_DOOR_ALIAS_HOSTS as readonly string[]).includes(host);
}

export function isOneDoorCanonicalHost(hostHeader: string | null | undefined): boolean {
  return normalizeHost(hostHeader) === ONE_DOOR_CANONICAL_HOST;
}

/** Build the canonical URL for an incoming request path + search. */
export function canonicalOneDoorUrl(pathname: string, search = ''): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${ONE_DOOR_CANONICAL_ORIGIN}${path}${search}`;
}
