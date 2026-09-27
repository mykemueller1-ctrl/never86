/**
 * Read-only Gmail + Drive listing for the papers scan.
 * Lists and downloads. Never sends, deletes, labels, or shares.
 */

import { buildPapersScanGmailQuery } from '@/lib/papersScanClassify';
import {
  PAPERS_SCAN_LOOKBACK_DAYS,
  PAPERS_SCAN_MAX_BYTES,
  PAPERS_SCAN_MAX_DRIVE_FILES,
  PAPERS_SCAN_MAX_GMAIL_MESSAGES,
  type PapersScanCandidate,
} from '@/lib/papersScanTypes';

export type PapersScanFetch = typeof fetch;

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';

type GmailPart = {
  filename?: string;
  mimeType?: string;
  body?: { attachmentId?: string; data?: string; size?: number };
  parts?: GmailPart[];
  headers?: Array<{ name?: string; value?: string }>;
};

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

async function googleJson<T>(
  url: string,
  accessToken: string,
  fetchImpl: PapersScanFetch,
): Promise<T | null> {
  const res = await fetchImpl(url, { headers: authHeaders(accessToken) }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}

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

function subjectOf(payload: GmailPart | undefined): string {
  return payload?.headers?.find((header) => header.name?.toLowerCase() === 'subject')?.value || '';
}

export async function listGmailScanCandidates(input: {
  accessToken: string;
  fetchImpl?: PapersScanFetch;
}): Promise<PapersScanCandidate[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const query = buildPapersScanGmailQuery();
  const list = await googleJson<{ messages?: Array<{ id: string }> }>(
    `${GMAIL}?q=${encodeURIComponent(query)}&maxResults=${PAPERS_SCAN_MAX_GMAIL_MESSAGES}`,
    input.accessToken,
    fetchImpl,
  );
  const hits: PapersScanCandidate[] = [];
  for (const row of list?.messages || []) {
    if (hits.length >= PAPERS_SCAN_MAX_GMAIL_MESSAGES) break;
    const msg = await googleJson<{ payload?: GmailPart }>(
      `${GMAIL}/${row.id}?format=full`,
      input.accessToken,
      fetchImpl,
    );
    if (!msg?.payload) continue;
    const subject = subjectOf(msg.payload);
    const parts = walkParts(msg.payload, []);
    let attachments = 0;
    let bodyText = '';
    for (const part of parts) {
      const filename = part.filename?.trim();
      if (!filename) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText += Buffer.from(fromBase64Url(part.body.data)).toString('utf8');
        }
        continue;
      }
      attachments += 1;
      const size = part.body?.size ?? 0;
      const externalId = `${row.id}:${part.body?.attachmentId || filename}`;
      if (size > PAPERS_SCAN_MAX_BYTES) {
        hits.push({ source: 'gmail', externalId, filename, subject, byteLength: size, skip: 'oversize' });
        continue;
      }
      let bytes: Uint8Array | undefined;
      if (part.body?.attachmentId) {
        const att = await googleJson<{ data?: string; size?: number }>(
          `${GMAIL}/${row.id}/attachments/${part.body.attachmentId}`,
          input.accessToken,
          fetchImpl,
        );
        if ((att?.size ?? 0) > PAPERS_SCAN_MAX_BYTES) {
          hits.push({
            source: 'gmail',
            externalId,
            filename,
            subject,
            byteLength: att?.size,
            skip: 'oversize',
          });
          continue;
        }
        if (att?.data) bytes = fromBase64Url(att.data);
      } else if (part.body?.data) {
        bytes = fromBase64Url(part.body.data);
      }
      if (bytes && bytes.byteLength > PAPERS_SCAN_MAX_BYTES) {
        hits.push({ source: 'gmail', externalId, filename, subject, byteLength: bytes.byteLength, skip: 'oversize' });
        continue;
      }
      hits.push({ source: 'gmail', externalId, filename, subject, bytes, byteLength: bytes?.byteLength ?? size });
    }
    if (!attachments && bodyText.trim()) {
      const bytes = Uint8Array.from(Buffer.from(bodyText, 'utf8'));
      if (bytes.byteLength > PAPERS_SCAN_MAX_BYTES) {
        hits.push({
          source: 'gmail',
          externalId: `${row.id}:body`,
          filename: `${subject || 'message'}.txt`,
          subject,
          byteLength: bytes.byteLength,
          skip: 'oversize',
        });
      } else {
        hits.push({
          source: 'gmail',
          externalId: `${row.id}:body`,
          filename: `${subject || 'message'}.txt`,
          subject,
          bytes,
          byteLength: bytes.byteLength,
        });
      }
    }
  }
  return hits;
}

export async function listDriveScanCandidates(input: {
  accessToken: string;
  fetchImpl?: PapersScanFetch;
  now?: Date;
}): Promise<PapersScanCandidate[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const after = new Date((input.now ?? new Date()).getTime() - PAPERS_SCAN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const q = [
    'trashed = false',
    `modifiedTime > '${after}'`,
    "(mimeType = 'application/pdf' or mimeType = 'text/csv' or mimeType = 'text/plain'",
    "or name contains 'invoice' or name contains 'EOD' or name contains 'timesheet'",
    "or name contains 'DoorDash' or name contains 'recipe' or name contains 'menu'",
    "or name contains 'beer' or name contains 'liquor')",
  ].join(' ');
  const list = await googleJson<{ files?: Array<{ id: string; name: string; size?: string }> }>(
    `${DRIVE}?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=${PAPERS_SCAN_MAX_DRIVE_FILES}`,
    input.accessToken,
    fetchImpl,
  );
  const hits: PapersScanCandidate[] = [];
  for (const file of list?.files || []) {
    if (hits.length >= PAPERS_SCAN_MAX_DRIVE_FILES) break;
    const byteLength = Number(file.size ?? 0);
    if (byteLength > PAPERS_SCAN_MAX_BYTES) {
      hits.push({
        source: 'drive',
        externalId: file.id,
        filename: file.name,
        byteLength,
        skip: 'oversize',
      });
      continue;
    }
    const media = await fetchImpl(`${DRIVE}/${file.id}?alt=media`, {
      headers: authHeaders(input.accessToken),
    }).catch(() => null);
    if (!media?.ok) {
      hits.push({ source: 'drive', externalId: file.id, filename: file.name, byteLength });
      continue;
    }
    const buf = new Uint8Array(await media.arrayBuffer());
    if (buf.byteLength > PAPERS_SCAN_MAX_BYTES) {
      hits.push({
        source: 'drive',
        externalId: file.id,
        filename: file.name,
        byteLength: buf.byteLength,
        skip: 'oversize',
      });
      continue;
    }
    hits.push({
      source: 'drive',
      externalId: file.id,
      filename: file.name,
      bytes: buf.byteLength ? buf : undefined,
      byteLength: buf.byteLength,
    });
  }
  return hits;
}
