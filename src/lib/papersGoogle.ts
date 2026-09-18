/**
 * Google Gmail + Drive helpers for operator papers.
 * Injectable fetch. No invented files. Tokens never returned to the client.
 */

import {
  PAPERS_BOH_FOLDERS,
  PAPERS_ROOT_FOLDER,
  emptyBohFolders,
  lastWeekQueryWindow,
  looksLikeOperatorPaper,
  matchBohFolderName,
  type PapersBohFolder,
} from '@/lib/papersInbox';

export type GoogleFetch = typeof fetch;

const GMAIL_LIST = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const USERINFO = 'https://www.googleapis.com/oauth2/v2/userinfo';
const TOKEN = 'https://oauth2.googleapis.com/token';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export type PapersGoogleHit = {
  filename: string;
  subject?: string;
  bytes?: Uint8Array;
  folderName?: string;
};

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

async function googleJson<T>(
  url: string,
  accessToken: string,
  fetchImpl: GoogleFetch,
  init?: RequestInit,
): Promise<T | null> {
  const res = await fetchImpl(url, {
    ...init,
    headers: {
      ...authHeaders(accessToken),
      ...(init?.headers || {}),
    },
  }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}

export function canWriteDriveFolders(scopes: readonly string[]): boolean {
  const blob = scopes.join(' ');
  return blob.includes('drive.file') || /auth\/drive(?:\s|$)/.test(blob);
}

export async function googleUserEmail(
  accessToken: string,
  fetchImpl: GoogleFetch = fetch,
): Promise<string | null> {
  const body = await googleJson<{ email?: string }>(USERINFO, accessToken, fetchImpl);
  return body?.email?.trim() || null;
}

export async function refreshGoogleAccessToken(input: {
  refreshToken: string;
  env?: Record<string, string | undefined>;
  fetchImpl?: GoogleFetch;
}): Promise<{ accessToken: string } | null> {
  const env = input.env ?? process.env;
  const fetchImpl = input.fetchImpl ?? fetch;
  if (!env.GOOGLE_CLIENT_ID?.trim() || !env.GOOGLE_CLIENT_SECRET?.trim()) return null;
  const res = await fetchImpl(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: input.refreshToken,
      grant_type: 'refresh_token',
    }),
  }).catch(() => null);
  if (!res?.ok) return null;
  const body = (await res.json().catch(() => null)) as { access_token?: string } | null;
  return body?.access_token ? { accessToken: body.access_token } : null;
}

type GmailPart = {
  filename?: string;
  mimeType?: string;
  body?: { attachmentId?: string; data?: string; size?: number };
  parts?: GmailPart[];
  headers?: Array<{ name?: string; value?: string }>;
};

function walkParts(part: GmailPart | undefined, acc: GmailPart[]): GmailPart[] {
  if (!part) return acc;
  acc.push(part);
  for (const child of part.parts || []) walkParts(child, acc);
  return acc;
}

function fromBase64Url(data: string): Uint8Array {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(Buffer.from(padded, 'base64'));
}

export async function listGmailOperatorPapers(input: {
  accessToken: string;
  query: string;
  fetchImpl?: GoogleFetch;
  maxMessages?: number;
}): Promise<PapersGoogleHit[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const list = await googleJson<{ messages?: Array<{ id: string }> }>(
    `${GMAIL_LIST}?q=${encodeURIComponent(input.query)}&maxResults=${input.maxMessages ?? 12}`,
    input.accessToken,
    fetchImpl,
  );
  const hits: PapersGoogleHit[] = [];
  for (const row of list?.messages || []) {
    const msg = await googleJson<{
      payload?: GmailPart;
      snippet?: string;
    }>(`${GMAIL_LIST}/${row.id}?format=full`, input.accessToken, fetchImpl);
    if (!msg?.payload) continue;
    const subject = msg.payload.headers?.find((h) => h.name?.toLowerCase() === 'subject')?.value || '';
    for (const part of walkParts(msg.payload, [])) {
      const filename = part.filename?.trim();
      if (!filename || !looksLikeOperatorPaper(filename, subject)) continue;
      let bytes: Uint8Array | undefined;
      if (part.body?.attachmentId) {
        const att = await googleJson<{ data?: string }>(
          `${GMAIL_LIST}/${row.id}/attachments/${part.body.attachmentId}`,
          input.accessToken,
          fetchImpl,
        );
        if (att?.data) bytes = fromBase64Url(att.data);
      } else if (part.body?.data) {
        bytes = fromBase64Url(part.body.data);
      }
      hits.push({ filename, subject, bytes });
    }
  }
  return hits;
}

export async function listDriveOperatorPapers(input: {
  accessToken: string;
  afterMs?: number;
  fetchImpl?: GoogleFetch;
}): Promise<PapersGoogleHit[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const after = new Date(input.afterMs ?? lastWeekQueryWindow().afterMs).toISOString();
  const q = [
    'trashed = false',
    `modifiedTime > '${after}'`,
    "(mimeType = 'application/pdf' or mimeType = 'text/csv' or mimeType = 'text/plain'",
    "or name contains 'invoice' or name contains 'EOD' or name contains 'labor')",
  ].join(' ');
  const list = await googleJson<{ files?: Array<{ id: string; name: string; mimeType?: string }> }>(
    `${DRIVE_FILES}?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime)&pageSize=40`,
    input.accessToken,
    fetchImpl,
  );
  const hits: PapersGoogleHit[] = [];
  for (const file of list?.files || []) {
    if (!looksLikeOperatorPaper(file.name)) continue;
    const media = await fetchImpl(`${DRIVE_FILES}/${file.id}?alt=media`, {
      headers: authHeaders(input.accessToken),
    }).catch(() => null);
    let bytes: Uint8Array | undefined;
    if (media?.ok) {
      const buf = new Uint8Array(await media.arrayBuffer());
      if (buf.byteLength > 0 && buf.byteLength <= 8 * 1024 * 1024) bytes = buf;
    }
    hits.push({ filename: file.name, bytes });
  }
  return hits;
}

async function findFolder(
  accessToken: string,
  fetchImpl: GoogleFetch,
  name: string,
  parentId?: string,
): Promise<{ id: string; name: string } | null> {
  const parts = [
    `mimeType = '${FOLDER_MIME}'`,
    'trashed = false',
    `name = '${name.replace(/'/g, "\\'")}'`,
  ];
  if (parentId) parts.push(`'${parentId}' in parents`);
  const list = await googleJson<{ files?: Array<{ id: string; name: string }> }>(
    `${DRIVE_FILES}?q=${encodeURIComponent(parts.join(' and '))}&fields=files(id,name)&pageSize=5`,
    accessToken,
    fetchImpl,
  );
  return list?.files?.[0] ?? null;
}

async function createFolder(
  accessToken: string,
  fetchImpl: GoogleFetch,
  name: string,
  parentId?: string,
): Promise<{ id: string; name: string } | null> {
  const body: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: FOLDER_MIME,
  };
  if (parentId) body.parents = [parentId];
  return googleJson<{ id: string; name: string }>(DRIVE_FILES, accessToken, fetchImpl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function listExistingBohFolders(
  accessToken: string,
  fetchImpl: GoogleFetch = fetch,
): Promise<PapersBohFolder[]> {
  const folders = emptyBohFolders();
  const list = await googleJson<{ files?: Array<{ id: string; name: string }> }>(
    `${DRIVE_FILES}?q=${encodeURIComponent(`mimeType = '${FOLDER_MIME}' and trashed = false`)}&fields=files(id,name)&pageSize=100`,
    accessToken,
    fetchImpl,
  );
  for (const file of list?.files || []) {
    const match = matchBohFolderName(file.name);
    if (!match) continue;
    const row = folders.find((folder) => folder.id === match.id);
    if (row && !row.driveId) {
      row.driveId = file.id;
      row.status = 'found';
      row.honesty = 'Estimated';
    }
  }
  return folders;
}

export async function ensureBohPapersFolders(input: {
  accessToken: string;
  scopes?: readonly string[];
  fetchImpl?: GoogleFetch;
}): Promise<{ rootId: string | null; folders: PapersBohFolder[]; created: boolean; note: string }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const write = canWriteDriveFolders(input.scopes ?? []);
  const detected = await listExistingBohFolders(input.accessToken, fetchImpl);
  let root = await findFolder(input.accessToken, fetchImpl, PAPERS_ROOT_FOLDER);
  let created = false;

  if (!root && write) {
    root = await createFolder(input.accessToken, fetchImpl, PAPERS_ROOT_FOLDER);
    created = Boolean(root);
  }

  const folders = detected.map((row) => ({ ...row }));
  for (const spec of PAPERS_BOH_FOLDERS) {
    const row = folders.find((folder) => folder.id === spec.id)!;
    if (row.driveId) continue;
    let found = root ? await findFolder(input.accessToken, fetchImpl, spec.name, root.id) : null;
    if (!found) found = await findFolder(input.accessToken, fetchImpl, spec.name);
    if (found) {
      row.driveId = found.id;
      row.status = 'found';
      row.honesty = 'Estimated';
      continue;
    }
    if (write && root) {
      const made = await createFolder(input.accessToken, fetchImpl, spec.name, root.id);
      if (made) {
        row.driveId = made.id;
        row.status = 'created';
        row.honesty = 'Estimated';
        created = true;
      }
    }
  }

  const missing = folders.filter((folder) => folder.status === 'missing').map((folder) => folder.name);
  const note = missing.length
    ? write
      ? `Missing folders: ${missing.join(', ')}. Drive create did not finish. No invented papers.`
      : `Found existing operator folders where names matched. Create stays off without drive.file. Missing: ${missing.join(', ')}.`
    : created
      ? `Created ${PAPERS_ROOT_FOLDER} with Invoices / Z-EOD / Labor / Liquor-Beer.`
      : `Found Invoices / Z-EOD / Labor / Liquor-Beer on Drive.`;

  return { rootId: root?.id ?? null, folders, created, note };
}
