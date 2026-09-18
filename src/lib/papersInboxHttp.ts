/**
 * HTTP plane for papers inbox. Fail-closed. No auto-mail. No invented files.
 */

import { neon } from '@neondatabase/serverless';
import {
  PAPERS_GOOGLE_SCOPES,
  PAPERS_LOOKBACK_DAYS,
  buildGmailWatchQuery,
  classifyPapersFolder,
  emptyBohFolders,
  emptyPapersConnection,
  evaluatePapersInboxEnablement,
  looksLikeInvoicePaper,
  looksLikeOperatorPaper,
  papersGoogleRedirect,
  papersSeatHonesty,
  type PapersBohFolder,
  type PapersConnectionState,
  type PapersHonesty,
  type PapersPullHit,
} from '@/lib/papersInbox';
import {
  ensureBohPapersFolders,
  listDriveOperatorPapers,
  listGmailOperatorPapers,
  refreshGoogleAccessToken,
} from '@/lib/papersGoogle';
import {
  papersInvoiceCompare,
  parseSeatInvoiceBytes,
  type PapersInvoiceRecord,
} from '@/lib/papersInvoicePath';

export type PapersStoredConnection = {
  accessToken: string;
  refreshToken: string | null;
  email: string | null;
  scopes: string[];
  folders: PapersBohFolder[];
};

export type PapersTokenStore = {
  connections: Map<string, PapersStoredConnection>;
  invoices: Map<string, PapersInvoiceRecord[]>;
};

const memory: PapersTokenStore = { connections: new Map(), invoices: new Map() };

export function resetPapersTokenStore(): void {
  memory.connections.clear();
  memory.invoices.clear();
}

export function papersConnectionFor(operatorId: string): PapersConnectionState {
  const row = memory.connections.get(operatorId);
  if (!row) return emptyPapersConnection();
  const scopes = row.scopes.join(' ');
  return {
    gmail: scopes.includes('gmail'),
    drive: scopes.includes('drive'),
    outlook: false,
    email: row.email,
  };
}

export function papersFoldersFor(operatorId: string): PapersBohFolder[] {
  return memory.connections.get(operatorId)?.folders ?? emptyBohFolders();
}

export function papersInvoicesFor(operatorId: string): PapersInvoiceRecord[] {
  return memory.invoices.get(operatorId) ?? [];
}

export function rememberPapersToken(input: {
  operatorId: string;
  accessToken: string;
  refreshToken?: string | null;
  email?: string | null;
  scopes?: string[];
  folders?: PapersBohFolder[];
}): PapersConnectionState {
  const prev = memory.connections.get(input.operatorId);
  memory.connections.set(input.operatorId, {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken ?? prev?.refreshToken ?? null,
    email: input.email ?? prev?.email ?? null,
    scopes: input.scopes ?? prev?.scopes ?? [...PAPERS_GOOGLE_SCOPES],
    folders: input.folders ?? prev?.folders ?? emptyBohFolders(),
  });
  void persistPapersConnection(input.operatorId).catch(() => undefined);
  return papersConnectionFor(input.operatorId);
}

export function startPapersGoogleOAuth(input: {
  env?: Record<string, string | undefined>;
  state: string;
}): { ok: true; authorizationUrl: string } | { ok: false; error: string } {
  const env = input.env ?? process.env;
  const gate = evaluatePapersInboxEnablement(env);
  if (!gate.ready) return { ok: false, error: gate.error ?? 'Gmail stays off.' };
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID!);
  url.searchParams.set('redirect_uri', papersGoogleRedirect(env));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', PAPERS_GOOGLE_SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', input.state);
  return { ok: true, authorizationUrl: url.toString() };
}

export type GmailListFn = (input: { accessToken: string; query: string }) => Promise<
  Array<{ filename: string; subject?: string; bytes?: Uint8Array; folderName?: string }>
>;

export type DriveListFn = (input: { accessToken: string; afterMs: number }) => Promise<
  Array<{ filename: string; bytes?: Uint8Array; folderName?: string }>
>;

async function ensurePapersSchema(databaseUrl: string): Promise<void> {
  const sql = neon(databaseUrl);
  await sql`
    create table if not exists papers_google_connections (
      operator_id text primary key,
      email text,
      access_token text not null,
      refresh_token text,
      scopes text not null default '',
      folders_json jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    )
  `;
}

async function persistPapersConnection(operatorId: string): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  const row = memory.connections.get(operatorId);
  if (!url || !row) return;
  await ensurePapersSchema(url);
  const sql = neon(url);
  await sql`
    insert into papers_google_connections (
      operator_id, email, access_token, refresh_token, scopes, folders_json, updated_at
    ) values (
      ${operatorId}, ${row.email}, ${row.accessToken}, ${row.refreshToken},
      ${row.scopes.join(' ')}, ${JSON.stringify(row.folders)}::jsonb, now()
    )
    on conflict (operator_id) do update set
      email = excluded.email,
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      scopes = excluded.scopes,
      folders_json = excluded.folders_json,
      updated_at = now()
  `;
}

export async function hydratePapersConnection(operatorId: string): Promise<PapersConnectionState> {
  if (memory.connections.has(operatorId)) return papersConnectionFor(operatorId);
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return emptyPapersConnection();
  try {
    await ensurePapersSchema(url);
    const sql = neon(url);
    const rows = await sql`
      select email, access_token, refresh_token, scopes, folders_json
      from papers_google_connections
      where operator_id = ${operatorId}
      limit 1
    `;
    const row = rows[0] as
      | {
          email: string | null;
          access_token: string;
          refresh_token: string | null;
          scopes: string;
          folders_json: PapersBohFolder[] | string;
        }
      | undefined;
    if (!row) return emptyPapersConnection();
    const folders = Array.isArray(row.folders_json)
      ? row.folders_json
      : (JSON.parse(String(row.folders_json || '[]')) as PapersBohFolder[]);
    memory.connections.set(operatorId, {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      email: row.email,
      scopes: row.scopes ? row.scopes.split(/\s+/) : [...PAPERS_GOOGLE_SCOPES],
      folders,
    });
  } catch {
    return emptyPapersConnection();
  }
  return papersConnectionFor(operatorId);
}

async function liveAccessToken(operatorId: string): Promise<string | null> {
  const row = memory.connections.get(operatorId);
  if (!row) return null;
  if (row.refreshToken) {
    const refreshed = await refreshGoogleAccessToken({ refreshToken: row.refreshToken });
    if (refreshed?.accessToken) {
      rememberPapersToken({ operatorId, accessToken: refreshed.accessToken });
      return refreshed.accessToken;
    }
  }
  return row.accessToken;
}

export async function connectPapersFolders(operatorId: string): Promise<{
  folders: PapersBohFolder[];
  note: string;
}> {
  const row = memory.connections.get(operatorId);
  if (!row) return { folders: emptyBohFolders(), note: 'Missing — Connect Gmail + Drive first.' };
  const token = await liveAccessToken(operatorId);
  if (!token) return { folders: row.folders, note: 'Missing — Google token expired. Connect again.' };
  const ensured = await ensureBohPapersFolders({ accessToken: token, scopes: row.scopes });
  rememberPapersToken({ operatorId, accessToken: token, folders: ensured.folders });
  return { folders: ensured.folders, note: ensured.note };
}

export async function pullLastWeekPapers(input: {
  operatorId: string;
  now?: Date;
  listGmail?: GmailListFn;
  listDrive?: DriveListFn;
  fetchGoogle?: boolean;
}): Promise<{
  ok: true;
  pulled: PapersPullHit[];
  skipped: number;
  honesty: PapersHonesty;
  nextAction: string;
  invoices: PapersInvoiceRecord[];
  compare: ReturnType<typeof papersInvoiceCompare> | null;
  folders: PapersBohFolder[];
}> {
  await hydratePapersConnection(input.operatorId);
  const row = memory.connections.get(input.operatorId);
  if (!row) {
    return {
      ok: true,
      pulled: [],
      skipped: 0,
      honesty: 'Missing',
      nextAction: 'Connect Gmail so Never86 can go get last-week papers. One photo if the inbox is empty.',
      invoices: [],
      compare: null,
      folders: emptyBohFolders(),
    };
  }

  const query = buildGmailWatchQuery(input.now);
  const afterMs = (input.now ?? new Date()).getTime() - PAPERS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const useLive = input.fetchGoogle !== false && !input.listGmail && !input.listDrive;
  const token = useLive ? await liveAccessToken(input.operatorId) : row.accessToken;
  const gmailRows = input.listGmail
    ? await input.listGmail({ accessToken: row.accessToken, query })
    : useLive && token
      ? await listGmailOperatorPapers({ accessToken: token, query })
      : [];
  const driveRows = input.listDrive
    ? await input.listDrive({ accessToken: row.accessToken, afterMs })
    : useLive && token
      ? await listDriveOperatorPapers({ accessToken: token, afterMs })
      : [];

  const pulled: PapersPullHit[] = [];
  const invoices: PapersInvoiceRecord[] = [];
  let skipped = 0;
  const items = [
    ...gmailRows.map((item) => ({ ...item, provider: 'gmail' as const })),
    ...driveRows.map((item) => ({ ...item, provider: 'drive' as const, subject: undefined })),
  ];

  for (const item of items) {
    if (!looksLikeOperatorPaper(item.filename, item.subject)) {
      skipped += 1;
      continue;
    }
    const folder = classifyPapersFolder(item.filename, item.subject, item.folderName);
    let honesty: PapersHonesty = 'Estimated';
    if (item.bytes && looksLikeInvoicePaper(item.filename, item.subject)) {
      const parsed = parseSeatInvoiceBytes(item.bytes, item.filename);
      invoices.push(parsed);
      honesty = parsed.honesty;
    }
    pulled.push({
      provider: item.provider,
      filename: item.filename,
      reason: item.subject || (item.provider === 'gmail' ? 'Gmail last-week paper' : 'Drive folder last-week paper'),
      folder,
      honesty,
    });
  }

  memory.invoices.set(input.operatorId, invoices);
  const compare = invoices.length ? papersInvoiceCompare(invoices) : null;
  const honesty = papersSeatHonesty({
    ready: true,
    connected: true,
    invoiceCount: invoices.filter((row) => row.honesty !== 'Missing').length || pulled.length,
    verifiedCompare: compare?.honesty === 'Verified',
  });

  if (pulled.length === 0) {
    return {
      ok: true,
      pulled,
      skipped,
      honesty: 'Missing',
      nextAction: 'Inbox connected. No last-week invoice, EOD, or sales sheet matched. Snap one paper or pick a Drive folder.',
      invoices,
      compare,
      folders: row.folders,
    };
  }

  const invoiceLine = invoices.length
    ? ` Parsed ${invoices.reduce((n, row) => n + row.lines.filter((line) => line.unitPrice != null).length, 0)} SKU line${invoices.length === 1 ? '' : 's'} for /try compare.`
    : '';

  return {
    ok: true,
    pulled,
    skipped,
    honesty,
    nextAction: `Landed ${pulled.length} paper${pulled.length === 1 ? '' : 's'} from Gmail / Drive.${invoiceLine} Confirm they are the right store and week.`,
    invoices,
    compare,
    folders: row.folders,
  };
}

export function papersDurableStore(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.DATABASE_URL?.trim());
}
