/**
 * HTTP plane for papers inbox. Fail-closed. No auto-mail. No invented files.
 */

import {
  PAPERS_GOOGLE_SCOPES,
  buildGmailWatchQuery,
  emptyPapersConnection,
  evaluatePapersInboxEnablement,
  looksLikeOperatorPaper,
  papersGoogleRedirect,
  type PapersConnectionState,
  type PapersPullHit,
} from '@/lib/papersInbox';

export type PapersTokenStore = {
  connections: Map<string, { accessToken: string; email: string | null; scopes: string[] }>;
};

const memory: PapersTokenStore = { connections: new Map() };

export function resetPapersTokenStore(): void {
  memory.connections.clear();
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

export function rememberPapersToken(input: {
  operatorId: string;
  accessToken: string;
  email?: string | null;
  scopes?: string[];
}): PapersConnectionState {
  memory.connections.set(input.operatorId, {
    accessToken: input.accessToken,
    email: input.email ?? null,
    scopes: input.scopes ?? [...PAPERS_GOOGLE_SCOPES],
  });
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
  Array<{ filename: string; subject?: string; bytes?: Uint8Array }>
>;

export type DriveListFn = (input: { accessToken: string; afterMs: number }) => Promise<
  Array<{ filename: string; bytes?: Uint8Array }>
>;

export async function pullLastWeekPapers(input: {
  operatorId: string;
  now?: Date;
  listGmail?: GmailListFn;
  listDrive?: DriveListFn;
}): Promise<{
  ok: true;
  pulled: PapersPullHit[];
  skipped: number;
  honesty: 'Missing' | 'Partial' | 'Ready';
  nextAction: string;
}> {
  const row = memory.connections.get(input.operatorId);
  if (!row) {
    return {
      ok: true,
      pulled: [],
      skipped: 0,
      honesty: 'Missing',
      nextAction: 'Connect Gmail so Never86 can go get last-week papers. One photo if the inbox is empty.',
    };
  }

  const query = buildGmailWatchQuery(input.now);
  const gmailRows = input.listGmail
    ? await input.listGmail({ accessToken: row.accessToken, query })
    : [];
  const driveRows = input.listDrive
    ? await input.listDrive({
        accessToken: row.accessToken,
        afterMs: (input.now ?? new Date()).getTime() - 8 * 24 * 60 * 60 * 1000,
      })
    : [];

  const pulled: PapersPullHit[] = [];
  let skipped = 0;
  for (const item of gmailRows) {
    if (!looksLikeOperatorPaper(item.filename, item.subject)) {
      skipped += 1;
      continue;
    }
    pulled.push({ provider: 'gmail', filename: item.filename, reason: item.subject || 'Gmail last-week paper' });
  }
  for (const item of driveRows) {
    if (!looksLikeOperatorPaper(item.filename)) {
      skipped += 1;
      continue;
    }
    pulled.push({ provider: 'drive', filename: item.filename, reason: 'Drive folder last-week paper' });
  }

  if (pulled.length === 0) {
    return {
      ok: true,
      pulled,
      skipped,
      honesty: 'Missing',
      nextAction: 'Inbox connected. No last-week invoice, EOD, or sales sheet matched. Snap one paper or pick a Drive folder.',
    };
  }

  return {
    ok: true,
    pulled,
    skipped,
    honesty: 'Partial',
    nextAction: `Landed ${pulled.length} paper${pulled.length === 1 ? '' : 's'} from Gmail / Drive. Confirm they are the right store and week.`,
  };
}
