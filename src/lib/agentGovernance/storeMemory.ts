/**
 * Store-scoped memory propose → approve → supersede.
 * Map-backed for swarm/tests. No Neon write without a known operatorId (v1 skips Neon).
 * A model guess is not memory. Never promote one store into a universal rule.
 */

import { NEVER86_OPERATOR_SYSTEM } from '../operatorSystem';

export const ALLOWED_MEMORY_TYPES = NEVER86_OPERATOR_SYSTEM.memory.allowed;

export type AllowedMemoryType = (typeof ALLOWED_MEMORY_TYPES)[number];
export type MemoryAtomStatus = 'pending' | 'approved' | 'superseded' | 'deleted';

export type MemoryAtom = {
  id: string;
  storeId: string;
  locationId: string | null;
  operatorId?: number;
  memoryType: AllowedMemoryType;
  rawRule: string;
  normalizedInterpretation: string;
  source: string;
  provenance: string;
  status: MemoryAtomStatus;
  confidence: number | null;
  approver: string | null;
  approvedAt: string | null;
  effectiveDate: string;
  version: number;
  supersededBy: string | null;
  createdAt: string;
};

export type ProposeMemoryAtomInput = {
  storeId: string;
  locationId?: string | null;
  operatorId?: number;
  memoryType: string;
  rawRule: string;
  normalizedInterpretation: string;
  source: string;
  provenance: string;
  effectiveDate?: string;
  confidence?: number | null;
};

export type ProposeMemoryAtomResult =
  | { ok: true; atom: MemoryAtom }
  | { ok: false; error: 'memory_type_not_allowed' | 'store_required' | 'raw_rule_required' };

export type ApproveMemoryAtomResult =
  | { ok: true; atom: MemoryAtom }
  | { ok: false; error: 'not_found' | 'approver_required' | 'not_pending' };

export type SupersedeMemoryAtomResult =
  | { ok: true; previous: MemoryAtom; next: MemoryAtom }
  | {
      ok: false;
      error:
        | 'not_found'
        | 'approver_required'
        | 'not_approved'
        | 'not_pending'
        | 'memory_type_not_allowed'
        | 'store_required'
        | 'raw_rule_required';
    };

const atoms = new Map<string, MemoryAtom>();
let seq = 0;

function isAllowedType(value: string): value is AllowedMemoryType {
  return (ALLOWED_MEMORY_TYPES as readonly string[]).includes(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function resetStoreMemoryForTests(): void {
  atoms.clear();
  seq = 0;
}

export function proposeMemoryAtom(input: ProposeMemoryAtomInput): ProposeMemoryAtomResult {
  const storeId = input.storeId?.trim();
  if (!storeId) return { ok: false, error: 'store_required' };
  const rawRule = input.rawRule?.trim();
  if (!rawRule) return { ok: false, error: 'raw_rule_required' };
  if (!isAllowedType(input.memoryType)) return { ok: false, error: 'memory_type_not_allowed' };

  const createdAt = nowIso();
  const atom: MemoryAtom = {
    id: `mem_${++seq}`,
    storeId,
    locationId: input.locationId ?? null,
    operatorId: input.operatorId,
    memoryType: input.memoryType,
    rawRule,
    normalizedInterpretation: input.normalizedInterpretation.trim(),
    source: input.source.trim(),
    provenance: input.provenance.trim(),
    status: 'pending',
    confidence: input.confidence ?? null,
    approver: null,
    approvedAt: null,
    effectiveDate: input.effectiveDate?.trim() || createdAt.slice(0, 10),
    version: 1,
    supersededBy: null,
    createdAt,
  };
  atoms.set(atom.id, atom);
  return { ok: true, atom: { ...atom } };
}

export function approveMemoryAtom(id: string, approver: string): ApproveMemoryAtomResult {
  const who = approver?.trim();
  if (!who) return { ok: false, error: 'approver_required' };
  const atom = atoms.get(id);
  if (!atom) return { ok: false, error: 'not_found' };
  if (atom.status !== 'pending') return { ok: false, error: 'not_pending' };

  atom.status = 'approved';
  atom.approver = who;
  atom.approvedAt = nowIso();
  atoms.set(atom.id, atom);
  return { ok: true, atom: { ...atom } };
}

export function supersedeMemoryAtom(
  priorId: string,
  replacement: ProposeMemoryAtomInput,
  approver: string,
): SupersedeMemoryAtomResult {
  const who = approver?.trim();
  if (!who) return { ok: false, error: 'approver_required' };
  const prior = atoms.get(priorId);
  if (!prior) return { ok: false, error: 'not_found' };
  if (prior.status !== 'approved') return { ok: false, error: 'not_approved' };

  const proposed = proposeMemoryAtom({
    ...replacement,
    storeId: replacement.storeId || prior.storeId,
  });
  if (!proposed.ok) return proposed;

  const approved = approveMemoryAtom(proposed.atom.id, who);
  if (!approved.ok) return approved;

  prior.status = 'superseded';
  prior.supersededBy = approved.atom.id;
  atoms.set(prior.id, prior);

  approved.atom.version = prior.version + 1;
  atoms.set(approved.atom.id, approved.atom);

  return { ok: true, previous: { ...prior }, next: { ...approved.atom } };
}

export function listMemoryAtoms(
  storeId: string,
  opts?: { status?: MemoryAtomStatus | 'active' },
): MemoryAtom[] {
  const scope = storeId.trim();
  const rows = [...atoms.values()].filter((atom) => atom.storeId === scope);
  if (!opts?.status) return rows.map((atom) => ({ ...atom }));
  if (opts.status === 'active') {
    return rows.filter((atom) => atom.status === 'approved').map((atom) => ({ ...atom }));
  }
  return rows.filter((atom) => atom.status === opts.status).map((atom) => ({ ...atom }));
}
