/**
 * Tenant data lake — operator_id required, source-tagged, append-only.
 * Map-backed for tests. Draft SQL is not applied. Nothing is deleted.
 */

import { LAKE_KINDS, SOURCE_TAGS, type LakeKind, type SourceTag } from './types';

export type LakeRecord = {
  id: string;
  operatorId: number;
  locationId: string | null;
  kind: LakeKind;
  sourceTag: SourceTag;
  source: string;
  payload: unknown;
  createdAt: string;
  supersededBy: string | null;
  version: number;
};

export type AppendLakeInput = {
  operatorId: number;
  locationId?: string | null;
  kind: string;
  sourceTag: string;
  source: string;
  payload: unknown;
};

export type AppendLakeResult =
  | { ok: true; record: LakeRecord }
  | { ok: false; error: 'operator_id_required' | 'source_required' | 'source_tag_required' | 'kind_required' };

export type SupersedeLakeResult =
  | { ok: true; previous: LakeRecord; next: LakeRecord }
  | {
      ok: false;
      error: 'not_found' | 'tenant_mismatch' | 'operator_id_required' | 'source_required' | 'source_tag_required' | 'kind_required';
    };

const lake = new Map<string, LakeRecord>();
let seq = 0;

function isSourceTag(value: string): value is SourceTag {
  return (SOURCE_TAGS as readonly string[]).includes(value);
}

function isLakeKind(value: string): value is LakeKind {
  return (LAKE_KINDS as readonly string[]).includes(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function resetDataLakeForTests(): void {
  lake.clear();
  seq = 0;
}

export function appendLakeRecord(input: AppendLakeInput): AppendLakeResult {
  const operatorId = Number(input.operatorId);
  if (!Number.isInteger(operatorId) || operatorId <= 0) {
    return { ok: false, error: 'operator_id_required' };
  }
  const source = input.source?.trim();
  if (!source) return { ok: false, error: 'source_required' };
  if (!isSourceTag(input.sourceTag)) return { ok: false, error: 'source_tag_required' };
  if (!isLakeKind(input.kind)) return { ok: false, error: 'kind_required' };

  const record: LakeRecord = {
    id: `lake_${++seq}`,
    operatorId,
    locationId: input.locationId ?? null,
    kind: input.kind,
    sourceTag: input.sourceTag,
    source,
    payload: input.payload,
    createdAt: nowIso(),
    supersededBy: null,
    version: 1,
  };
  lake.set(record.id, record);
  return { ok: true, record: { ...record } };
}

export function listLakeRecords(operatorId: number, opts?: { kind?: LakeKind }): LakeRecord[] {
  const id = Number(operatorId);
  if (!Number.isInteger(id) || id <= 0) return [];
  return [...lake.values()]
    .filter((row) => row.operatorId === id && (!opts?.kind || row.kind === opts.kind))
    .map((row) => ({ ...row }));
}

export function getLakeRecord(id: string, operatorId: number): LakeRecord | null {
  const row = lake.get(id);
  if (!row || row.operatorId !== operatorId) return null;
  return { ...row };
}

export function supersedeLakeRecord(
  priorId: string,
  operatorId: number,
  replacement: Omit<AppendLakeInput, 'operatorId'>,
): SupersedeLakeResult {
  const prior = lake.get(priorId);
  if (!prior) return { ok: false, error: 'not_found' };
  if (prior.operatorId !== operatorId) return { ok: false, error: 'tenant_mismatch' };

  const next = appendLakeRecord({ ...replacement, operatorId });
  if (!next.ok) return next;

  prior.supersededBy = next.record.id;
  lake.set(prior.id, prior);
  next.record.version = prior.version + 1;
  lake.set(next.record.id, next.record);
  return { ok: true, previous: { ...prior }, next: { ...next.record } };
}

export function deleteLakeRecord(): { ok: false; error: 'delete_forbidden' } {
  return { ok: false, error: 'delete_forbidden' };
}

export function assertSameTenant(operatorId: number, recordOperatorId: number): boolean {
  return operatorId === recordOperatorId && operatorId > 0;
}
