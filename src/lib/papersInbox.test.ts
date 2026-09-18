import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PAPERS_BOH_FOLDERS,
  PAPERS_GOOGLE_SCOPES,
  PAPERS_INTAKE_ORDER,
  buildGmailWatchQuery,
  classifyPapersFolder,
  evaluatePapersInboxEnablement,
  looksLikeInvoicePaper,
  looksLikeOperatorPaper,
  outlookV2Plan,
  papersIntakeCopy,
  papersMissingSecretNames,
  papersSeatHonesty,
} from './papersInbox';
import {
  papersConnectionFor,
  pullLastWeekPapers,
  rememberPapersToken,
  resetPapersTokenStore,
  startPapersGoogleOAuth,
} from './papersInboxHttp';

describe('papers inbox — Google first', () => {
  it('locks Gmail → photo → chat and fail-closes without Google client', () => {
    expect(PAPERS_INTAKE_ORDER).toEqual(['gmail', 'photo', 'chat']);
    expect(evaluatePapersInboxEnablement({}).ready).toBe(false);
    expect(evaluatePapersInboxEnablement({ GOOGLE_CLIENT_ID: 'x.apps.googleusercontent.com' }).ready).toBe(false);
    expect(
      evaluatePapersInboxEnablement({
        GOOGLE_CLIENT_ID: 'x.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: 'GOCSPX-x',
      }).ready,
    ).toBe(true);
    expect(evaluatePapersInboxEnablement({}).honesty).toBe('Missing');
    expect(papersMissingSecretNames({})).toEqual(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
    expect(PAPERS_GOOGLE_SCOPES.join(' ')).toMatch(/gmail.readonly/);
    expect(PAPERS_GOOGLE_SCOPES.join(' ')).toMatch(/drive.readonly/);
    expect(PAPERS_GOOGLE_SCOPES.join(' ')).toMatch(/drive.file/);
    expect(PAPERS_BOH_FOLDERS.map((folder) => folder.name)).toEqual(['Invoices', 'Z-EOD', 'Labor', 'Liquor-Beer']);
  });

  it('builds a last-week Gmail watch query and keeps operator-paper filenames', () => {
    const query = buildGmailWatchQuery(new Date('2026-09-08T12:00:00.000Z'));
    expect(query).toMatch(/newer_than:8d/);
    expect(query).toMatch(/filename:pdf/);
    expect(looksLikeOperatorPaper('SalesSummary_2026-08-31.csv')).toBe(true);
    expect(looksLikeOperatorPaper('vacation-selfie.jpg')).toBe(false);
    expect(looksLikeOperatorPaper('scan.pdf', 'Sysco invoice')).toBe(true);
  });

  it('starts Google OAuth fail-closed and pulls only matching papers', async () => {
    resetPapersTokenStore();
    const blocked = startPapersGoogleOAuth({ env: {}, state: 'st' });
    expect(blocked.ok).toBe(false);
    const started = startPapersGoogleOAuth({
      env: {
        GOOGLE_CLIENT_ID: 'x.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: 'GOCSPX-x',
      },
      state: 'st',
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.authorizationUrl).toMatch(/gmail.readonly/);
    expect(started.authorizationUrl).toMatch(/drive.readonly/);
    expect(started.authorizationUrl).toMatch(/drive.file/);
    expect(started.authorizationUrl).toMatch(/access_type=offline/);

    const empty = await pullLastWeekPapers({ operatorId: 'seat:1' });
    expect(empty.honesty).toBe('Missing');
    expect(empty.nextAction).toMatch(/Connect Gmail/i);
    expect(empty.nextAction).not.toMatch(/desk/i);

    rememberPapersToken({ operatorId: 'seat:1', accessToken: 'tok', email: 'owner@example.com' });
    expect(papersConnectionFor('seat:1').gmail).toBe(true);
    const pulled = await pullLastWeekPapers({
      operatorId: 'seat:1',
      listGmail: async () => [
        { filename: 'SalesSummary_2026-08-31.csv', subject: 'week sales' },
        { filename: 'cat.png', subject: 'cute' },
      ],
      listDrive: async () => [{ filename: 'invoice-truck.pdf' }],
    });
    expect(pulled.pulled.map((row) => row.filename)).toEqual([
      'SalesSummary_2026-08-31.csv',
      'invoice-truck.pdf',
    ]);
    expect(pulled.skipped).toBe(1);
    expect(pulled.nextAction).toMatch(/Landed 2 papers/);
    expect(pulled.honesty).toBe('Estimated');
    expect(pulled.pulled.find((row) => row.filename === 'invoice-truck.pdf')?.folder).toBe('invoices');
    expect(pulled.pulled.find((row) => row.filename.startsWith('SalesSummary'))?.folder).toBe('z-eod');
    expect(looksLikeInvoicePaper('Sysco-invoice.pdf')).toBe(true);
    expect(classifyPapersFolder('LaborBreakDown.csv')).toBe('labor');
    expect(papersSeatHonesty({ ready: false, connected: false })).toBe('Missing');
  });

  it('keeps Outlook designed, not live, and never says desk to the operator', () => {
    const copy = papersIntakeCopy();
    const outlook = outlookV2Plan();
    expect(outlook.live).toBe(false);
    expect(outlook.status).toBe('designed');
    expect(`${copy.headline} ${copy.promise} ${copy.outlook}`).not.toMatch(/\bdesk\b/i);
    const phone = readFileSync(resolve('src/components/PapersInboxConnect.tsx'), 'utf8');
    expect(phone).toMatch(/Connect Gmail/);
    expect(phone).toMatch(/Connect Drive/);
    expect(phone).toMatch(/copy\.outlook/);
    expect(phone).toMatch(/Missing/);
    expect(phone).toMatch(/disabled=\{busy \|\| !ready\}/);
    expect(copy.outlook).toMatch(/Outlook is next/);
    const onboard = readFileSync(resolve('src/app/onboard/OnboardClient.tsx'), 'utf8');
    expect(onboard).toMatch(/PapersInboxConnect/);
    expect(onboard).not.toMatch(/chatgpt\.site/);
    const compare = readFileSync(resolve('src/components/InvoiceCompareClient.tsx'), 'utf8');
    expect(compare).toMatch(/Load from connected papers/);
  });
});
