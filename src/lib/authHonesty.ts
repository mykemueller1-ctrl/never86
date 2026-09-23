/**
 * Fail-closed labels for activation email and password login.
 * Missing means the door did not open. Never a fake success.
 */

export const OPERATOR_LOGIN_UNAVAILABLE = "Operator login isn't switched on yet.";

export function operatorLoginUnavailableBody(missingSecret: boolean) {
  return {
    success: false as const,
    honesty: 'Missing' as const,
    code: 'operator_login_unavailable' as const,
    error: OPERATOR_LOGIN_UNAVAILABLE,
    missingSecrets: missingSecret ? (['OPERATOR_SESSION_SECRET'] as const) : ([] as const),
  };
}

export function withMissingHonesty<T extends { success: false; code?: string }>(
  body: T,
  status: number,
): T & { honesty?: 'Missing' } {
  if (
    status === 503
    || body.code === 'activation_email_unavailable'
    || body.code === 'neon_unavailable'
    || body.code === 'operator_login_unavailable'
  ) {
    return { ...body, honesty: 'Missing' };
  }
  return body;
}
