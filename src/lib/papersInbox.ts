/**
 * Papers inbox — Gmail watch first, one photo/sheet second, silent chat map third.
 * Google-first. Outlook is designed, not live. Fail-closed until Google client exists.
 * Operator-to-operator: we go get the papers. No SOP form. Never invent $.
 */

export const PAPERS_INTAKE_ORDER = ['gmail', 'photo', 'chat'] as const;
export type PapersIntakeStep = (typeof PAPERS_INTAKE_ORDER)[number];

export const PAPERS_GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
] as const;

export const PAPERS_GOOGLE_REDIRECT_DEFAULT = 'https://www.never86.ai/api/papers/google/callback';

export const PAPERS_LOOKBACK_DAYS = 8;

export type PapersProvider = 'gmail' | 'drive' | 'outlook';

export type PapersInboxEnablement = {
  ready: boolean;
  googleFirst: true;
  outlookLive: false;
  error: string | null;
};

export type PapersConnectionState = {
  gmail: boolean;
  drive: boolean;
  outlook: false;
  email: string | null;
};

export type PapersPullHit = {
  provider: 'gmail' | 'drive';
  filename: string;
  reason: string;
};

export function evaluatePapersInboxEnablement(
  env: Record<string, string | undefined> = process.env,
): PapersInboxEnablement {
  const ready = Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
  return {
    ready,
    googleFirst: true,
    outlookLive: false,
    error: ready
      ? null
      : 'Gmail and Drive stay off until Google client id + secret exist. No homework form. No invented papers.',
  };
}

export function papersGoogleRedirect(env: Record<string, string | undefined> = process.env): string {
  return env.PAPERS_GOOGLE_REDIRECT?.trim() || PAPERS_GOOGLE_REDIRECT_DEFAULT;
}

export function lastWeekQueryWindow(now = new Date()): { newerThanDays: number; afterMs: number } {
  return {
    newerThanDays: PAPERS_LOOKBACK_DAYS,
    afterMs: now.getTime() - PAPERS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function buildGmailWatchQuery(now = new Date()): string {
  const { newerThanDays } = lastWeekQueryWindow(now);
  return [
    `newer_than:${newerThanDays}d`,
    '(filename:pdf OR filename:csv OR filename:xlsx OR filename:xls',
    'OR subject:invoice OR subject:EOD OR subject:Z OR subject:sales',
    'OR subject:labor OR subject:schedule OR subject:truck)',
  ].join(' ');
}

export function looksLikeOperatorPaper(filename: string, subject = ''): boolean {
  const blob = `${filename} ${subject}`.toLowerCase();
  if (!blob.trim()) return false;
  return /\b(invoice|truck|eod|z[-_\s]?report|sales ?summary|labor|schedule|hourly|void|promo|cogs|p&l|aging|payables|xlsx|csv|pdf)\b/.test(
    blob,
  );
}

export function emptyPapersConnection(): PapersConnectionState {
  return { gmail: false, drive: false, outlook: false, email: null };
}

export function papersIntakeCopy(): {
  headline: string;
  promise: string;
  gmail: string;
  drive: string;
  outlook: string;
  photo: string;
} {
  return {
    headline: "We'll go get last week's papers.",
    promise: 'Gmail first. One photo if you have it. Chat maps what is still Missing. No SOP. No form.',
    gmail: 'Connect Gmail — Never86 pulls last-week invoices, EODs, and sheets.',
    drive: 'Connect Drive — we read the folder you already dump papers in.',
    outlook: 'Outlook is next. Google inbox first so we can win the first ten minutes.',
    photo: 'Or drop photos / files here — one tap, many papers.',
  };
}

export function outlookV2Plan(): {
  status: 'designed';
  live: false;
  whyGoogleFirst: string;
  later: string;
} {
  return {
    status: 'designed',
    live: false,
    whyGoogleFirst: 'This seat already has a Google client path. Gmail + Drive reuse that client. Outlook needs a second Azure app and a second secret — that is v2, not first-10-minutes.',
    later: 'Microsoft Graph mail.read + files.read. Same pull contract: last 8 days, operator-paper filenames only, human approve before anything leaves the seat.',
  };
}
