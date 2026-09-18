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
  'https://www.googleapis.com/auth/drive.file',
] as const;

export const PAPERS_GOOGLE_REDIRECT_DEFAULT = 'https://www.never86.ai/api/papers/google/callback';

/** Exact Vercel names. Never invent values. Connect stays Missing until both secrets exist. */
export const PAPERS_REQUIRED_SECRET_NAMES = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const;
export const PAPERS_OPTIONAL_ENV_NAMES = ['PAPERS_GOOGLE_REDIRECT', 'NEXT_PUBLIC_SITE_URL', 'DATABASE_URL'] as const;

export const PAPERS_LOOKBACK_DAYS = 8;

export const PAPERS_HONESTY = ['Verified', 'Estimated', 'Missing'] as const;
export type PapersHonesty = (typeof PAPERS_HONESTY)[number];

export const PAPERS_ROOT_FOLDER = 'Never86 Papers';

export const PAPERS_BOH_FOLDERS = [
  {
    id: 'invoices',
    name: 'Invoices',
    aliases: ['invoice', 'invoice / truck', 'truck', 'vendor'],
    plate: 'invoice-truck',
  },
  {
    id: 'z-eod',
    name: 'Z-EOD',
    aliases: ['z', 'eod', 'z-report', 'z report', 'sales summary'],
    plate: null,
  },
  {
    id: 'labor',
    name: 'Labor',
    aliases: ['labor', 'schedule', 'labor cards', 'timeclock'],
    plate: 'schedule',
  },
  {
    id: 'liquor-beer',
    name: 'Liquor-Beer',
    aliases: ['liquor', 'beer', 'wine', 'beverage', 'pop'],
    plate: 'invoice-truck',
  },
] as const;

export type PapersBohFolderId = (typeof PAPERS_BOH_FOLDERS)[number]['id'];

export type PapersBohFolder = {
  id: PapersBohFolderId;
  name: string;
  driveId: string | null;
  status: 'created' | 'found' | 'missing';
  honesty: PapersHonesty;
};

export type PapersProvider = 'gmail' | 'drive' | 'outlook';

export type PapersInboxEnablement = {
  ready: boolean;
  googleFirst: true;
  outlookLive: false;
  error: string | null;
  missingSecrets: string[];
  honesty: PapersHonesty;
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
  folder: PapersBohFolderId;
  honesty: PapersHonesty;
};

export function papersMissingSecretNames(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const missing: string[] = [];
  if (!env.GOOGLE_CLIENT_ID?.trim()) missing.push('GOOGLE_CLIENT_ID');
  if (!env.GOOGLE_CLIENT_SECRET?.trim()) missing.push('GOOGLE_CLIENT_SECRET');
  return missing;
}

export function evaluatePapersInboxEnablement(
  env: Record<string, string | undefined> = process.env,
): PapersInboxEnablement {
  const missingSecrets = papersMissingSecretNames(env);
  const ready = missingSecrets.length === 0;
  return {
    ready,
    googleFirst: true,
    outlookLive: false,
    missingSecrets,
    honesty: ready ? 'Estimated' : 'Missing',
    error: ready
      ? null
      : 'Missing — Gmail and Drive stay off until Google client id + secret exist. No homework form. No invented papers.',
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

export function looksLikeInvoicePaper(filename: string, subject = ''): boolean {
  const blob = `${filename} ${subject}`.toLowerCase();
  if (!blob.trim()) return false;
  return /\b(invoice|truck|sysco|pfg|us\s*foods|vendor|sku)\b/.test(blob);
}

export function classifyPapersFolder(filename: string, subject = '', folderName = ''): PapersBohFolderId {
  const blob = `${folderName} ${filename} ${subject}`.toLowerCase();
  if (/z[-_\s]?report|\beod\b|sales[_-\s]?summary|\bhourly\b/.test(blob)) return 'z-eod';
  if (/labor|schedule|timeclock|punch/.test(blob)) return 'labor';
  if (/\b(liquor|beer|wine|beverage|pop)\b/.test(blob) && !/\binvoice\b/.test(blob)) return 'liquor-beer';
  if (/\b(liquor|beer|wine)\b/.test(blob)) return 'liquor-beer';
  return 'invoices';
}

export function matchBohFolderName(name: string): (typeof PAPERS_BOH_FOLDERS)[number] | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return (
    PAPERS_BOH_FOLDERS.find((folder) => folder.name.toLowerCase() === n)
    || PAPERS_BOH_FOLDERS.find((folder) => folder.aliases.some((alias) => n === alias || n.includes(alias)))
    || null
  );
}

export function emptyBohFolders(): PapersBohFolder[] {
  return PAPERS_BOH_FOLDERS.map((folder) => ({
    id: folder.id,
    name: folder.name,
    driveId: null,
    status: 'missing',
    honesty: 'Missing',
  }));
}

export function papersSeatHonesty(input: {
  ready: boolean;
  connected: boolean;
  invoiceCount?: number;
  verifiedCompare?: boolean;
}): PapersHonesty {
  if (!input.ready || !input.connected) return 'Missing';
  if (input.verifiedCompare) return 'Verified';
  if ((input.invoiceCount ?? 0) > 0) return 'Estimated';
  return 'Missing';
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
    promise: 'Gmail first. Invoices and SKU lines land on this seat. One photo if you have it. Chat maps what is still Missing. No SOP. No form.',
    gmail: 'Connect Gmail — Never86 pulls last-week invoice PDFs, EODs, and sheets.',
    drive: 'Connect Drive — we find or make Invoices / Z-EOD / Labor / Liquor-Beer, then read what you already dump there.',
    outlook: 'Outlook is next. Google inbox first so we can win the first ten minutes.',
    photo: 'Or drop photos / files here — one tap, many papers.',
  };
}

export function papersEnvChecklist(
  env: Record<string, string | undefined> = process.env,
): Array<{ name: string; required: boolean; present: boolean }> {
  return [
    ...PAPERS_REQUIRED_SECRET_NAMES.map((name) => ({
      name,
      required: true,
      present: Boolean(env[name]?.trim()),
    })),
    ...PAPERS_OPTIONAL_ENV_NAMES.map((name) => ({
      name,
      required: false,
      present: Boolean(env[name]?.trim()),
    })),
  ];
}

export function papersFailClosedBody(
  env: Record<string, string | undefined> = process.env,
): {
  success: false;
  honesty: 'Missing';
  code: 'papers_google_closed';
  error: string;
  missingSecrets: string[];
  requiredEnv: string[];
  redirectUri: string;
  envChecklist: Array<{ name: string; required: boolean; present: boolean }>;
} {
  const gate = evaluatePapersInboxEnablement(env);
  return {
    success: false,
    honesty: 'Missing',
    code: 'papers_google_closed',
    error: gate.error ?? 'Missing — Gmail and Drive stay off.',
    missingSecrets: gate.missingSecrets,
    requiredEnv: [...PAPERS_REQUIRED_SECRET_NAMES],
    redirectUri: papersGoogleRedirect(env),
    envChecklist: papersEnvChecklist(env),
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
