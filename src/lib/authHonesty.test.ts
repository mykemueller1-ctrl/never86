import { describe, expect, it } from 'vitest';
import { operatorLoginUnavailableBody, withMissingHonesty } from './authHonesty';

describe('auth honesty', () => {
  it('labels a closed password door Missing and does not invent a session', () => {
    const body = operatorLoginUnavailableBody(true);
    expect(body).toMatchObject({
      success: false,
      honesty: 'Missing',
      code: 'operator_login_unavailable',
      error: "Operator login isn't switched on yet.",
      missingSecrets: ['OPERATOR_SESSION_SECRET'],
    });
    expect(JSON.stringify(body)).not.toMatch(/GOCSPX|sk_live|re_/);
  });

  it('adds Missing only for closed activation doors', () => {
    const closed = withMissingHonesty(
      { success: false, error: 'Activation email is unavailable. Try again later.', code: 'activation_email_unavailable' },
      503,
    );
    expect(closed.honesty).toBe('Missing');
    const badEmail = withMissingHonesty(
      { success: false, error: 'Use a real work email', code: 'invalid_recipient' },
      400,
    );
    expect(badEmail).not.toHaveProperty('honesty');
  });
});
