import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('operator seat thicken', () => {
  it('puts PDF and HEIC upload beside paste on the invoice check', () => {
    const compare = read('src/components/InvoiceCompareClient.tsx');
    expect(compare).toMatch(/type="file"/);
    expect(compare).toMatch(/INVOICE_UPLOAD_ACCEPT/);
    expect(compare).toMatch(/\/api\/one-seat\/invoice-file/);
    expect(compare).toMatch(/Load from connected papers/);
    expect(compare).not.toMatch(/\bdesk\b/i);
    const page = read('src/app/check/invoices/page.tsx');
    expect(page).toMatch(/InvoiceCompareClient/);
  });

  it('walks sample papers, drift, labor, menu, and Google on /try', () => {
    const page = read('src/app/try/page.tsx');
    expect(page).toMatch(/InvoiceWinCard/);
    expect(page).toMatch(/InvoiceCompareClient/);
    expect(page).toMatch(/PapersReadiness/);
    expect(page).toMatch(/STEP 3/);
    expect(page).toMatch(/ONE_SEAT_PATHS\.chat/);
    expect(page).toMatch(/OneSeatPanels/);
    expect(page).not.toMatch(/\bdesk\b/i);
    expect(page).not.toMatch(/chatgpt\.site/);
    const seat = read('src/app/seat/page.tsx');
    expect(seat).toMatch(/OneSeatPanels/);
    expect(seat).toMatch(/PapersChatIntake/);
    expect(seat).not.toMatch(/\bdesk\b/i);
    expect(seat).not.toMatch(/chatgpt\.site/);
  });

  it('shows Missing instead of a fake activation or login success', () => {
    const onboard = read('src/app/onboard/OnboardClient.tsx');
    const login = read('src/app/login/LoginClient.tsx');
    expect(onboard).toMatch(/honesty === 'Missing'/);
    expect(onboard).toMatch(/The seat was not opened/);
    expect(onboard).toMatch(/PapersReadiness/);
    expect(login).toMatch(/operator_login_unavailable/);
    expect(login).toMatch(/Sign-in did not succeed/);
    expect(login).toMatch(/GOOGLE_CLIENT_ID/);
    expect(login).not.toMatch(/chatgpt\.site/);
  });
});
