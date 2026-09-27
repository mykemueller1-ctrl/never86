/**
 * Background papers scan. Idempotent on source id + content hash.
 * Bounded to 90 days and an 8MB file cap. Read-only Google calls.
 */

import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { draftFromCandidateText, type PapersExtractDraft } from '@/lib/papersScanExtract';
import { parsePapersSkuLines, skuRowToLineItem, type PapersSkuRow } from '@/lib/papersSkuParse';
import { replacePapersSkuDocument } from '@/lib/papersSkuStore';
import { listDriveScanCandidates, listGmailScanCandidates } from '@/lib/papersScanSources';
import { paperTextFromBytes } from '@/lib/papersScanText';
import {
  PAPERS_SCAN_LOOKBACK_DAYS,
  PAPERS_SCAN_MAX_BYTES,
  amountField,
  emptyDelivery,
  missingField,
  parsePapersMoney,
  textField,
  type PapersLabeledField,
  type PapersScanCandidate,
  type PapersScanJobState,
  type PapersScanRow,
} from '@/lib/papersScanTypes';
import { papersAccessToken } from '@/lib/papersInboxHttp';

export type PapersScanLister = (accessToken: string) => Promise<PapersScanCandidate[]>;

type Store = {
  jobs: Map<string, PapersScanJobState>;
  rows: Map<string, PapersScanRow[]>;
};

const memory: Store = { jobs: new Map(), rows: new Map() };
const inflight = new Map<string, Promise<PapersScanJobState>>();
let schemaReady: Promise<void> | null = null;

export function resetPapersScanStore(): void {
  memory.jobs.clear();
  memory.rows.clear();
  inflight.clear();
  schemaReady = null;
}

export function papersContentHash(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function nowIso(): string {
  return new Date().toISOString();
}

function blankJob(operatorId: string): PapersScanJobState {
  const stamp = nowIso();
  return {
    id: crypto.randomUUID(),
    operatorId,
    status: 'queued',
    phase: 'queued',
    scanned: 0,
    kept: 0,
    skipped: 0,
    deduped: 0,
    lookbackDays: PAPERS_SCAN_LOOKBACK_DAYS,
    maxBytes: PAPERS_SCAN_MAX_BYTES,
    gmail: 'missing',
    drive: 'missing',
    error: null,
    startedAt: stamp,
    updatedAt: stamp,
  };
}

export function enqueuePapersScan(operatorId: string): PapersScanJobState {
  const current = memory.jobs.get(operatorId);
  if (current && (current.status === 'queued' || current.status === 'running')) return current;
  const job = blankJob(operatorId);
  memory.jobs.set(operatorId, job);
  if (!memory.rows.has(operatorId)) memory.rows.set(operatorId, []);
  void persistJob(operatorId).catch(() => undefined);
  return job;
}

export function allowPapersRescan(operatorId: string): void {
  const current = memory.jobs.get(operatorId);
  if (!current || current.status === 'queued' || current.status === 'running') return;
  memory.jobs.delete(operatorId);
}

export function papersScanSnapshot(operatorId: string): { job: PapersScanJobState | null; rows: PapersScanRow[] } {
  return {
    job: memory.jobs.get(operatorId) ?? null,
    rows: memory.rows.get(operatorId) ?? [],
  };
}

export async function hydratePapersScan(operatorId: string): Promise<void> {
  if (memory.jobs.has(operatorId) || memory.rows.has(operatorId)) return;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return;
  try {
    await ensureScanSchema(url);
    const sql = neon(url);
    const jobs = await sql`
      select job_json from papers_scan_jobs where operator_id = ${operatorId} limit 1
    `;
    const jobRow = jobs[0] as { job_json?: PapersScanJobState | string } | undefined;
    if (jobRow?.job_json) {
      const job = typeof jobRow.job_json === 'string'
        ? JSON.parse(jobRow.job_json) as PapersScanJobState
        : jobRow.job_json;
      if (job.status === 'running') job.status = 'queued';
      memory.jobs.set(operatorId, job);
    }
    const stored = await sql`
      select row_json from papers_scan_rows where operator_id = ${operatorId} order by updated_at asc limit 200
    `;
    const rows = stored.map((row) => {
      const value = (row as { row_json: PapersScanRow | string }).row_json;
      return typeof value === 'string' ? JSON.parse(value) as PapersScanRow : value;
    });
    if (rows.length) memory.rows.set(operatorId, rows);
  } catch {
    return;
  }
}

function touch(job: PapersScanJobState): void {
  job.updatedAt = nowIso();
}

async function ensureScanSchema(databaseUrl: string): Promise<void> {
  if (!schemaReady) {
    const sql = neon(databaseUrl);
    schemaReady = (async () => {
      await sql`
        create table if not exists papers_scan_jobs (
          operator_id text primary key,
          job_json jsonb not null,
          updated_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists papers_scan_rows (
          operator_id text not null,
          dedupe_key text not null,
          row_json jsonb not null,
          updated_at timestamptz not null default now(),
          primary key (operator_id, dedupe_key)
        )
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

async function persistJob(operatorId: string): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  const job = memory.jobs.get(operatorId);
  if (!url || !job) return;
  await ensureScanSchema(url);
  const sql = neon(url);
  await sql`
    insert into papers_scan_jobs (operator_id, job_json, updated_at)
    values (${operatorId}, ${JSON.stringify(job)}::jsonb, now())
    on conflict (operator_id) do update set
      job_json = excluded.job_json,
      updated_at = now()
  `;
}

async function persistRow(operatorId: string, row: PapersScanRow): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return;
  await ensureScanSchema(url);
  const sql = neon(url);
  await sql`
    insert into papers_scan_rows (operator_id, dedupe_key, row_json, updated_at)
    values (${operatorId}, ${row.dedupeKey}, ${JSON.stringify(row)}::jsonb, now())
    on conflict (operator_id, dedupe_key) do update set
      row_json = excluded.row_json,
      updated_at = now()
  `;
}

function applySkuLines(draft: PapersExtractDraft, lines: PapersSkuRow[]): void {
  draft.lineItems = lines.map(skuRowToLineItem);
  const weeks = [...new Set(lines.map((line) => line.isoWeek).filter((week): week is string => Boolean(week)))];
  draft.isoWeek = weeks.length ? weeks.join(', ') : null;
  const first = lines[0];
  if (draft.vendorName.honesty === 'Missing' && first.vendor.honesty !== 'Missing') draft.vendorName = first.vendor;
  if (draft.invoiceNumber.honesty === 'Missing' && first.documentNumber.honesty !== 'Missing') draft.invoiceNumber = first.documentNumber;
  if (draft.dates.honesty === 'Missing' && first.documentDate.honesty !== 'Missing') draft.dates = first.documentDate;
  const net = lines.find((line) => /net total|net payout/i.test(line.productName.value || ''));
  if (draft.total.honesty === 'Missing' && net && net.extendedPrice.honesty !== 'Missing') draft.total = net.extendedPrice;
  const sales = lines.find((line) => /^sales$/i.test(line.productName.value || ''));
  if (draft.delivery.gross.honesty === 'Missing' && sales && sales.extendedPrice.honesty !== 'Missing') {
    draft.delivery.gross = sales.extendedPrice;
  }
  if (draft.delivery.net.honesty === 'Missing' && net && net.extendedPrice.honesty !== 'Missing') {
    draft.delivery.net = net.extendedPrice;
  }
  draft.note = `Read ${lines.length} line${lines.length === 1 ? '' : 's'} from the paper.`;
}

function draftFromSkuLines(filename: string, subject: string, lines: PapersSkuRow[]): PapersExtractDraft {
  const category = lines.some((line) => line.category.value === 'labor')
    ? 'labor'
    : lines.some((line) => line.vendor.value === 'DoorDash')
      ? 'delivery-app'
      : lines.some((line) => /pop|liquor|beer|food/.test(line.category.value || '') && /z|eod/i.test(filename))
        ? 'eod-z'
        : lines.some((line) => line.category.value === 'beer' || line.category.value === 'liquor')
          ? 'liquor-beer'
          : 'vendor-invoice';
  const draft: PapersExtractDraft = {
    filename,
    subject,
    category,
    categoryHonesty: 'Estimated',
    vendorName: missingField(),
    invoiceNumber: missingField(),
    dates: missingField(),
    total: missingField(),
    lineItems: [],
    isoWeek: null,
    shifts: [],
    delivery: emptyDelivery(),
    note: '',
  };
  applySkuLines(draft, lines);
  return draft;
}

function editText(current: PapersLabeledField, raw: string): PapersLabeledField {
  const trimmed = raw.trim();
  if (!trimmed) return missingField();
  if (current.honesty !== 'Missing' && current.value === trimmed) return current;
  return textField(trimmed, 'Estimated', 'Operator edited. Not read from the paper.');
}

function editMoney(current: PapersLabeledField, raw: string): PapersLabeledField {
  const trimmed = raw.trim();
  if (!trimmed) return missingField();
  const amount = parsePapersMoney(trimmed);
  if (amount == null) return missingField();
  if (current.amount != null && current.amount === amount && current.honesty !== 'Missing') return current;
  return amountField(amount, 'Estimated', 'Operator edited. Not read from the paper.');
}

function editHours(current: PapersLabeledField, raw: string): PapersLabeledField {
  const trimmed = raw.trim();
  if (!trimmed) return missingField();
  const low = /~|≈|approx/i.test(trimmed);
  const cleaned = trimmed.replace(/[~≈]/g, '').replace(/approx\.?/gi, '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return missingField();
  const amount = Number(cleaned);
  if (current.amount != null && current.amount === amount && current.honesty !== 'Missing' && !low) return current;
  return {
    honesty: 'Estimated',
    value: cleaned,
    amount,
    note: 'Operator edited. Not read from the paper.',
  };
}

export type PapersScanEdit = {
  id: string;
  confirm?: boolean;
  fields?: {
    vendorName?: string;
    invoiceNumber?: string;
    dates?: string;
    total?: string;
    deliveryGross?: string;
    deliveryFees?: string;
    deliveryNet?: string;
    shifts?: Array<{ index: number; hours: string }>;
    lineItems?: Array<{ index: number; quantity?: string; unitPrice?: string; sku?: string }>;
  };
};

export async function applyPapersScanEdit(operatorId: string, edit: PapersScanEdit): Promise<PapersScanRow | null> {
  await hydratePapersScan(operatorId);
  const rows = memory.rows.get(operatorId) ?? [];
  const row = rows.find((item) => item.id === edit.id);
  if (!row || row.fixture) return null;
  const fields = edit.fields ?? {};
  if (fields.vendorName != null) row.vendorName = editText(row.vendorName, fields.vendorName);
  if (fields.invoiceNumber != null) row.invoiceNumber = editText(row.invoiceNumber, fields.invoiceNumber);
  if (fields.dates != null) row.dates = editText(row.dates, fields.dates);
  if (fields.total != null) row.total = editMoney(row.total, fields.total);
  if (fields.deliveryGross != null) row.delivery.gross = editMoney(row.delivery.gross, fields.deliveryGross);
  if (fields.deliveryFees != null) row.delivery.fees = editMoney(row.delivery.fees, fields.deliveryFees);
  if (fields.deliveryNet != null) row.delivery.net = editMoney(row.delivery.net, fields.deliveryNet);
  for (const shift of fields.shifts ?? []) {
    const target = row.shifts[shift.index];
    if (!target) continue;
    target.hours = editHours(target.hours, shift.hours);
  }
  for (const line of fields.lineItems ?? []) {
    const target = row.lineItems[line.index];
    if (!target) continue;
    if (line.sku != null) target.sku = editText(target.sku, line.sku);
    if (line.quantity != null) target.quantity = editHours(target.quantity, line.quantity);
    if (line.unitPrice != null) target.unitPrice = editMoney(target.unitPrice, line.unitPrice);
  }
  if (edit.confirm) row.confirmed = true;
  await persistRow(operatorId, row).catch(() => undefined);
  return row;
}

async function ingest(
  operatorId: string,
  job: PapersScanJobState,
  candidates: PapersScanCandidate[],
): Promise<void> {
  const rows = memory.rows.get(operatorId) ?? [];
  memory.rows.set(operatorId, rows);
  const seen = new Set(rows.map((row) => row.dedupeKey));
  for (const candidate of candidates) {
    job.scanned += 1;
    touch(job);
    const byteLength = candidate.byteLength ?? candidate.bytes?.byteLength ?? 0;
    if (candidate.skip === 'oversize' || byteLength > PAPERS_SCAN_MAX_BYTES) {
      job.skipped += 1;
      continue;
    }
    const bytes = candidate.bytes ?? new Uint8Array();
    const contentHash = papersContentHash(bytes);
    const dedupeKey = `${candidate.source}:${candidate.externalId}:${contentHash}`;
    if (seen.has(dedupeKey)) {
      job.deduped += 1;
      continue;
    }
    const text = paperTextFromBytes(candidate.filename, bytes);
    const sku = parsePapersSkuLines({ filename: candidate.filename, text, bytes });
    let draft = draftFromCandidateText({
      filename: candidate.filename,
      subject: candidate.subject,
      text,
    });
    if (!draft && sku.lines.length) draft = draftFromSkuLines(candidate.filename, candidate.subject ?? '', sku.lines);
    if (!draft) {
      job.skipped += 1;
      continue;
    }
    if (sku.lines.length) applySkuLines(draft, sku.lines);
    else if (sku.note.startsWith('Photo')) draft.note = sku.note;
    if (sku.lines.length) {
      // operatorId here is the selected store seat (`seat:<id>`), not the person email.
      replacePapersSkuDocument(operatorId, dedupeKey, sku.lines.map((row) => ({ ...row, documentKey: dedupeKey })));
    }
    const row: PapersScanRow = {
      ...draft,
      id: crypto.randomUUID(),
      dedupeKey,
      source: candidate.source,
      externalId: candidate.externalId,
      contentHash,
      confirmed: false,
      fixture: false,
      note: draft.note,
    };
    rows.push(row);
    seen.add(dedupeKey);
    job.kept += 1;
    await persistRow(operatorId, row).catch(() => undefined);
    await persistJob(operatorId).catch(() => undefined);
  }
}

async function runDrain(input: {
  operatorId: string;
  accessToken?: string | null;
  listGmail?: PapersScanLister;
  listDrive?: PapersScanLister;
  now?: Date;
}): Promise<PapersScanJobState> {
  await hydratePapersScan(input.operatorId);
  let job = memory.jobs.get(input.operatorId);
  if (job?.status === 'done') return job;
  if (!job) job = enqueuePapersScan(input.operatorId);
  job.status = 'running';
  job.phase = 'gmail';
  touch(job);

  const token = input.accessToken !== undefined
    ? input.accessToken
    : input.listGmail || input.listDrive
      ? 'injected'
      : await papersAccessToken(input.operatorId);

  if (!token && !input.listGmail && !input.listDrive) {
    job.status = 'failed';
    job.phase = 'done';
    job.error = 'Missing — Connect Google first. No papers invented.';
    job.gmail = 'missing';
    job.drive = 'missing';
    touch(job);
    await persistJob(input.operatorId).catch(() => undefined);
    return job;
  }

  const accessToken = token || 'injected';
  try {
    const gmail = input.listGmail
      ? await input.listGmail(accessToken)
      : token
        ? await listGmailScanCandidates({ accessToken: token })
        : [];
    job.gmail = 'read';
    await ingest(input.operatorId, job, gmail);
  } catch {
    job.gmail = 'missing';
    job.error = 'Gmail read Missing. Drive scan still runs. No invented papers.';
  }

  job.phase = 'drive';
  touch(job);
  try {
    const drive = input.listDrive
      ? await input.listDrive(accessToken)
      : token
        ? await listDriveScanCandidates({ accessToken: token, now: input.now })
        : [];
    job.drive = 'read';
    await ingest(input.operatorId, job, drive);
  } catch {
    job.drive = 'missing';
    job.error = job.error ?? 'Drive read Missing. No invented papers.';
  }

  job.status = 'done';
  job.phase = 'done';
  touch(job);
  await persistJob(input.operatorId).catch(() => undefined);
  return job;
}

export function drainPapersScan(input: {
  operatorId: string;
  accessToken?: string | null;
  listGmail?: PapersScanLister;
  listDrive?: PapersScanLister;
  now?: Date;
}): Promise<PapersScanJobState> {
  const existing = inflight.get(input.operatorId);
  if (existing) return existing;
  const promise = runDrain(input).finally(() => {
    inflight.delete(input.operatorId);
  });
  inflight.set(input.operatorId, promise);
  return promise;
}

export function schedulePapersScan(operatorId: string): PapersScanJobState {
  const job = enqueuePapersScan(operatorId);
  const run = () => {
    void drainPapersScan({ operatorId }).catch(() => undefined);
  };
  void import('next/server')
    .then((mod) => {
      const afterFn = (mod as { after?: (cb: () => unknown) => void }).after;
      if (typeof afterFn === 'function') afterFn(run);
      else run();
    })
    .catch(() => run());
  return job;
}
