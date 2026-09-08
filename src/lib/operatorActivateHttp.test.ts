import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';
import {
  ACTIVATE_FAILURE_LOGOUT_PATH,
  attachActivateCookie,
  decideActivateClientOutcome,
  planActivateHttpResponse,
  shouldClearOperatorCookieOnActivateFailure,
} from './operatorActivateHttp';
import { OPERATOR_COOKIE } from './operatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from './ownerDeskAuth';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

function setCookieHeader(res: NextResponse): string {
  return res.headers.get('set-cookie') ?? '';
}

describe('activate HTTP cookie plane', () => {
  it('clears leftover n86_operator on activate 400 / 409 / 410', () => {
    expect(shouldClearOperatorCookieOnActivateFailure(400)).toBe(true);
    expect(shouldClearOperatorCookieOnActivateFailure(409)).toBe(true);
    expect(shouldClearOperatorCookieOnActivateFailure(410)).toBe(true);
    expect(shouldClearOperatorCookieOnActivateFailure(500)).toBe(false);
    expect(shouldClearOperatorCookieOnActivateFailure(503)).toBe(false);

    const alreadyUsed = planActivateHttpResponse(
      { ok: false, error: 'This activation link was already used. Sign in.', status: 409 },
      null,
    );
    expect(alreadyUsed.status).toBe(409);
    expect(alreadyUsed.cookie).toEqual({ kind: 'clear' });
    expect(alreadyUsed.body.redirect).toBeUndefined();
    expect(alreadyUsed.body.success).toBe(false);

    const res = NextResponse.json(alreadyUsed.body, { status: alreadyUsed.status });
    attachActivateCookie(res, alreadyUsed.cookie);
    const cookie = setCookieHeader(res);
    expect(cookie).toContain(`${OPERATOR_COOKIE}=`);
    expect(cookie).toMatch(/Max-Age=0/i);
    expect(cookie).not.toMatch(new RegExp(`${OPERATOR_COOKIE}=[^;]+;`));
  });

  it('sets n86_operator on a successful first activate for the token store', () => {
    const plan = planActivateHttpResponse(
      {
        ok: true,
        operatorId: 1_000_001,
        locationId: 11,
        email: 'grill@example.com',
        restaurantName: 'New American Grill',
      },
      'signed-session-token',
    );
    expect(plan.status).toBe(200);
    expect(plan.body.success).toBe(true);
    expect(plan.body.restaurantName).toBe('New American Grill');
    expect(plan.body.redirect).toBe(OWNER_DESK_POST_AUTH_REDIRECT);
    expect(plan.cookie).toEqual({ kind: 'set', session: 'signed-session-token' });

    const res = NextResponse.json(plan.body, { status: plan.status });
    attachActivateCookie(res, plan.cookie);
    const cookie = setCookieHeader(res);
    expect(cookie).toContain(`${OPERATOR_COOKIE}=signed-session-token`);
    expect(cookie).not.toMatch(/Max-Age=0/i);
  });

  it('does not send a failed activate into the old /operator session', () => {
    const poisonedRedirect = decideActivateClientOutcome({
      httpOk: false,
      success: false,
      error: 'This activation link is invalid.',
      redirect: '/operator',
    });
    expect(poisonedRedirect).toEqual({
      kind: 'error',
      message: 'This activation link is invalid.',
    });

    const alreadyUsed = decideActivateClientOutcome({
      httpOk: false,
      success: false,
      error: 'This activation link was already used. Sign in.',
    });
    expect(alreadyUsed.kind).toBe('error');

    const success = decideActivateClientOutcome({
      httpOk: true,
      success: true,
      redirect: OWNER_DESK_POST_AUTH_REDIRECT,
    });
    expect(success).toEqual({ kind: 'open-operator', href: '/operator' });

    const client = read('src/app/activate/ActivateClient.tsx');
    const http = read('src/lib/operatorActivateHttp.ts');
    expect(client).toContain('decideActivateClientOutcome');
    expect(client).toContain('ACTIVATE_FAILURE_LOGOUT_PATH');
    expect(http).toContain(`'${ACTIVATE_FAILURE_LOGOUT_PATH}'`);
    expect(client).toMatch(/if \(outcome\.kind === 'error'\)/);
    expect(client).toMatch(/setRedirect\(outcome\.href\)/);
    expect(client).toMatch(/window\.location\.replace\(redirect\)/);
    expect(client).not.toMatch(/window\.location\.replace\(data\.redirect/);
    expect(client).not.toMatch(/window\.location\.assign/);
    expect(ACTIVATE_FAILURE_LOGOUT_PATH).toBe('/api/operator/logout');

    const route = read('src/app/api/onboard/activate/route.ts');
    expect(route).toContain('planActivateHttpResponse');
    expect(route).toContain('attachActivateCookie');
    expect(route).toContain("cookie: { kind: 'clear' }");
  });
});
