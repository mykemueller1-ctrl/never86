import type { NextResponse } from 'next/server';
import type { ActivateResult } from './operatorActivation';
import {
  OPERATOR_COOKIE,
  OPERATOR_COOKIE_CLEAR_OPTS,
  OPERATOR_COOKIE_OPTS,
} from './operatorSession';
import { OWNER_DESK_POST_AUTH_REDIRECT } from './ownerDeskAuth';

export const ACTIVATE_FAILURE_LOGOUT_PATH = '/api/operator/logout' as const;

export type ActivateCookiePlan =
  | { kind: 'set'; session: string }
  | { kind: 'clear' }
  | { kind: 'none' };

export type ActivateHttpPlan = {
  status: number;
  body: Record<string, unknown>;
  cookie: ActivateCookiePlan;
};

export function shouldClearOperatorCookieOnActivateFailure(status: number): boolean {
  return status === 400 || status === 409 || status === 410;
}

/** Client may open /operator only after a 200 success. Non-200 stays on error / login. */
export function decideActivateClientOutcome(input: {
  httpOk: boolean;
  success?: boolean;
  error?: string;
  redirect?: string;
}): { kind: 'open-operator'; href: string } | { kind: 'error'; message: string } {
  if (!input.httpOk || !input.success) {
    return { kind: 'error', message: input.error || 'Sign-in failed' };
  }
  return { kind: 'open-operator', href: input.redirect || OWNER_DESK_POST_AUTH_REDIRECT };
}

export function planActivateHttpResponse(
  result: ActivateResult,
  session: string | null,
): ActivateHttpPlan {
  if (!result.ok) {
    return {
      status: result.status,
      body: { success: false, error: result.error },
      cookie: shouldClearOperatorCookieOnActivateFailure(result.status)
        ? { kind: 'clear' }
        : { kind: 'none' },
    };
  }

  if (!session) {
    return {
      status: 503,
      body: {
        success: false,
        error: 'Activated, but session signing failed. Sign in at /login.',
      },
      cookie: { kind: 'none' },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      redirect: OWNER_DESK_POST_AUTH_REDIRECT,
      restaurantName: result.restaurantName,
    },
    cookie: { kind: 'set', session },
  };
}

export function attachActivateCookie(
  res: NextResponse,
  cookie: ActivateCookiePlan,
): void {
  if (cookie.kind === 'set') {
    res.cookies.set(OPERATOR_COOKIE, cookie.session, OPERATOR_COOKIE_OPTS);
    return;
  }
  if (cookie.kind === 'clear') {
    res.cookies.set(OPERATOR_COOKIE, '', OPERATOR_COOKIE_CLEAR_OPTS);
  }
}
