import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OWNER_SEAT_LOGIN_HREF,
  OWNER_SEAT_PATH,
  OWNER_SEAT_SIGNOUT,
  isOwnerSeatPath,
  ownerSeatHeaderLabel,
  ownerSeatPublicPathsStayOpen,
  ownerSeatUnauthenticatedRedirect,
  restaurantNameForOwnerSeat,
  safeOwnerReturnTo,
} from './ownerSeatGate';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('owner seat auth gate', () => {
  it('sends unsigned /operator to /login?returnTo=/operator', () => {
    expect(OWNER_SEAT_PATH).toBe('/operator');
    expect(OWNER_SEAT_LOGIN_HREF).toBe('/login?returnTo=/operator');
    expect(ownerSeatUnauthenticatedRedirect('/operator')).toBe('/login?returnTo=/operator');
    expect(ownerSeatUnauthenticatedRedirect('/operator/')).toBe('/login?returnTo=/operator');
    expect(isOwnerSeatPath('/operator')).toBe(true);
  });

  it('leaves public routes and the sample answer pages alone', () => {
    for (const path of ['/', '/story', '/portal', '/onboard', '/activate', '/login', '/operator/answers/sample', '/play', '/try']) {
      expect(ownerSeatUnauthenticatedRedirect(path)).toBeNull();
      expect(isOwnerSeatPath(path)).toBe(false);
    }
    expect(ownerSeatPublicPathsStayOpen('/story')).toBe(true);
    expect(ownerSeatPublicPathsStayOpen('/portal')).toBe(true);
    expect(ownerSeatPublicPathsStayOpen('/onboard')).toBe(true);
    expect(ownerSeatPublicPathsStayOpen('/activate')).toBe(true);
    expect(ownerSeatPublicPathsStayOpen('/login')).toBe(true);
    expect(ownerSeatPublicPathsStayOpen('/')).toBe(true);
  });

  it('only accepts /operator as a post-login return', () => {
    expect(safeOwnerReturnTo('/operator')).toBe('/operator');
    expect(safeOwnerReturnTo('/operator/')).toBe('/operator');
    expect(safeOwnerReturnTo('https://evil.example/operator')).toBeNull();
    expect(safeOwnerReturnTo('//evil.example')).toBeNull();
    expect(safeOwnerReturnTo('/login')).toBeNull();
    expect(safeOwnerReturnTo('/operator/answers/sample')).toBeNull();
    expect(safeOwnerReturnTo(null)).toBeNull();
  });

  it('gates /operator in the proxy and on the page', () => {
    const proxy = read('src/proxy.ts');
    const page = read('src/app/operator/page.tsx');
    expect(proxy).toContain("'/operator'");
    expect(proxy).toContain('ownerSeatUnauthenticatedRedirect');
    expect(proxy).toContain('OWNER_SEAT_LOGIN_HREF');
    expect(proxy).not.toMatch(/matcher:\s*\[[^\]]*['"]\/story['"]/);
    expect(page).toContain('OWNER_SEAT_LOGIN_HREF');
    expect(page).toContain('redirect(OWNER_SEAT_LOGIN_HREF)');
    expect(page).toContain('if (!session)');
    expect(page).toContain("export const dynamic = 'force-dynamic'");
  });
});

describe('owner seat sign out', () => {
  it('calls the existing logout endpoint and then opens /login', () => {
    expect(OWNER_SEAT_SIGNOUT).toEqual({
      endpoint: '/api/operator/logout',
      method: 'POST',
      next: '/login',
    });
    const button = read('src/components/OwnerSeatSignOut.tsx');
    const phone = read('src/components/FreeOperatorPhone.tsx');
    expect(button).toContain('OWNER_SEAT_SIGNOUT');
    expect(button).toContain("type=\"button\"");
    expect(button).toContain('Sign out');
    expect(button).toContain('window.location.assign(OWNER_SEAT_SIGNOUT.next)');
    expect(button).toContain('fetch(OWNER_SEAT_SIGNOUT.endpoint');
    expect(button).not.toMatch(/<div[^>]*onClick/);
    expect(phone).toContain('OwnerSeatSignOut');
    expect(phone).toContain('aria-label="Account"');
    expect(phone).toMatch(/\{signedIn \? <OwnerSeatSignOut \/> : null\}/);
  });
});

describe('Community Tap stays on that owner only', () => {
  it('does not paint Community Tap for a signed-out visitor or another store', () => {
    expect(restaurantNameForOwnerSeat({ signedIn: false, ctapOwner: false, restaurantName: null })).toBeNull();
    expect(restaurantNameForOwnerSeat({ signedIn: false, ctapOwner: false, restaurantName: 'Community Tap' })).toBeNull();
    expect(ownerSeatHeaderLabel({ signedIn: false, ctapOwner: false, restaurantName: null })).toBe('Owner seat');
    expect(ownerSeatHeaderLabel({ signedIn: false, ctapOwner: true, restaurantName: 'Community Tap' })).toBe('Owner seat');
    expect(restaurantNameForOwnerSeat({
      signedIn: true,
      ctapOwner: false,
      restaurantName: 'Community Tap',
    })).toBeNull();
    expect(ownerSeatHeaderLabel({
      signedIn: true,
      ctapOwner: false,
      restaurantName: 'Community Tap',
    })).toBe('Owner seat');
    expect(ownerSeatHeaderLabel({
      signedIn: true,
      ctapOwner: false,
      restaurantName: null,
    })).toBe('Owner seat');
    expect(ownerSeatHeaderLabel({
      signedIn: true,
      ctapOwner: true,
      restaurantName: 'Community Tap',
    })).toBe('Community Tap');
    expect(ownerSeatHeaderLabel({
      signedIn: true,
      ctapOwner: false,
      restaurantName: 'Ada’s Pizza',
    })).toBe('Ada’s Pizza');
    expect(ownerSeatHeaderLabel({
      signedIn: true,
      ctapOwner: false,
      restaurantName: 'Max Grill',
    })).toBe('New American Grill');
  });

  it('does not fall back to Community Tap in the seat header or the desk payload', () => {
    const phone = read('src/components/FreeOperatorPhone.tsx');
    const desk = read('src/app/api/desk/route.ts');
    const page = read('src/app/operator/page.tsx');
    expect(phone).not.toContain('day1StoreTitle');
    expect(phone).not.toContain('deskSeatLabel(null)');
    expect(phone).toContain('ownerSeatHeaderLabel');
    expect(phone).toContain('restaurantNameForOwnerSeat');
    expect(desk).toContain('restaurantNameForOwnerSeat');
    expect(desk).toContain('isCtapSeat1Email');
    expect(page).toContain('ctapOwner={ctapEmail}');
    expect(page).toMatch(/ctapEmail \? deskSeatLabel\('Community Tap'\) : null/);
  });
});
