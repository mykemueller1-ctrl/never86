import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OWNER_DESK_EMAIL_BODY,
  OWNER_DESK_EMAIL_CTA,
  OWNER_DESK_EMAIL_HEADLINE,
  OWNER_DESK_EMAIL_SUBJECT,
  OWNER_DESK_PATH,
  OWNER_DESK_POST_AUTH_REDIRECT,
  VOID_HUNTER_BLUE,
  activationEmailHtml,
  activationEmailLooksCheap,
  activationEmailPayload,
  buildOwnerDeskActivationLink,
} from './ownerDeskAuth';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('owner desk post-auth redirect', () => {
  it('sends a signed-in owner to /operator chat, not /play or the card picker', () => {
    expect(OWNER_DESK_PATH).toBe('/operator');
    expect(OWNER_DESK_POST_AUTH_REDIRECT).toBe('/operator');
    expect(OWNER_DESK_POST_AUTH_REDIRECT).not.toBe('/play');
    expect(OWNER_DESK_POST_AUTH_REDIRECT).not.toBe('/dashboard');
    expect(OWNER_DESK_POST_AUTH_REDIRECT).not.toBe('/trial');
  });

  it('locks magic-link activate, password login, and /dashboard first paint to /operator', () => {
    const activate = read('src/app/api/onboard/activate/route.ts');
    const login = read('src/app/api/operator/login/route.ts');
    const client = read('src/app/activate/ActivateClient.tsx');
    const dashboard = read('src/app/dashboard/page.tsx');
    const desk = read('src/components/OperatorDashboard.tsx');

    expect(activate).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(activate).not.toMatch(/redirect:\s*'\/dashboard'/);
    expect(activate).not.toMatch(/redirect:\s*'\/play'/);

    expect(login).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(login).not.toMatch(/redirect:\s*'\/dashboard'/);

    expect(client).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(client).not.toMatch(/\/dashboard/);
    expect(client).not.toMatch(/\/play/);

    expect(dashboard).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(dashboard).toMatch(/redirect\(OWNER_DESK_POST_AUTH_REDIRECT\)/);
    expect(dashboard).not.toContain('OperatorDashboard');
    expect(dashboard).not.toContain('FreeSeatDesk');

    expect(desk).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(desk).not.toContain('<FreeSeatDesk');
  });

  it('keeps the authenticated first screen as the SimpleOwnerDemo composer', () => {
    const operator = read('src/app/operator/page.tsx');
    const phone = read('src/components/FreeOperatorPhone.tsx');
    expect(operator).toContain('SimpleOwnerDemo');
    expect(phone).toContain("What&apos;s going on in your restaurant?");
    expect(phone).toContain('Prime Cost Coach');
    expect(phone).toContain('PUBLIC_PREVIEW_COPY');
    expect(phone).not.toMatch(/UPLOAD PAYROLL CSV/);
    expect(phone).not.toMatch(/RUN SAMPLE/);
    expect(phone).not.toMatch(/Payroll\. Prices\. Process/);
  });
});

describe('magic-link owner-desk email', () => {
  const expiresAt = new Date('2026-09-06T12:00:00.000Z');
  const link = buildOwnerDeskActivationLink('https://www.never86.ai/', 'token+value');
  const html = activationEmailHtml(link, expiresAt);
  const payload = activationEmailPayload('owner@example.com', link, expiresAt);

  it('uses Void Hunter #0066ff only — no gold, amber, or cream-on-black', () => {
    expect(VOID_HUNTER_BLUE).toBe('#0066ff');
    expect(html).toContain('#0066ff');
    expect(html).toContain('background:#ffffff');
    expect(activationEmailLooksCheap(html)).toBe(false);
    expect(html.toLowerCase()).not.toMatch(/#d4a017|#eab308|#f59e0b|#ff9500|#e66b27|gold|amber|#111[;"]/);
    expect(html).not.toMatch(/background:#111/);
    expect(html).not.toMatch(/Payroll|Prices|Process/);
  });

  it('names Open your owner desk and points the CTA at the activate door', () => {
    expect(payload.subject).toBe(OWNER_DESK_EMAIL_SUBJECT);
    expect(payload.subject).toBe('Open your owner desk.');
    expect(html).toContain(OWNER_DESK_EMAIL_HEADLINE);
    expect(html).toContain(OWNER_DESK_EMAIL_CTA);
    expect(html).toContain(OWNER_DESK_EMAIL_BODY);
    expect(html).toContain('Open owner desk');
    expect(html).toContain('href="https://www.never86.ai/activate?token=token%2Bvalue"');
    expect(html).toContain(expiresAt.toUTCString());
    expect(link).toContain('/activate?token=');
    expect(OWNER_DESK_POST_AUTH_REDIRECT).toBe('/operator');
  });

  it('escapes the activation link in HTML and keeps seat 1 free copy', () => {
    const injected = activationEmailHtml('https://www.never86.ai/activate?token="><img src=x>', expiresAt);
    expect(injected).toContain('token=&quot;&gt;&lt;img src=x&gt;');
    expect(injected).not.toContain('<img src=x>');
    expect(html).toMatch(/Seat 1 stays free/i);
    expect(html).not.toMatch(/seat 2|seat 3|checkout|payment|stripe/i);
  });

  it('uses the shared template from the request route', () => {
    const request = read('src/app/api/onboard/request/route.ts');
    expect(request).toContain('activationEmailPayload');
    expect(request).toContain('buildOwnerDeskActivationLink');
    expect(request).not.toMatch(/#d4a017/);
    expect(request).not.toMatch(/Payroll\. Prices\. Process/);
    expect(request).not.toMatch(/Your secure Never 86'd sign-in link/);
    expect(request).not.toMatch(/Open Never 86'd/);
  });
});
