import { EVIDENCE_STATES, type EvidenceState } from './types';

export function isEvidenceState(value: string): value is EvidenceState {
  return (EVIDENCE_STATES as readonly string[]).includes(value);
}

export function cannotUpgradeByLlm(from: EvidenceState): EvidenceState {
  return from;
}

export function evidenceStateForField(input: {
  rawValue: string | null;
  parseError: string | null;
  injectionSuspected: boolean;
  pageRejected: boolean;
}): EvidenceState {
  if (input.pageRejected) return 'Unverified';
  if (input.injectionSuspected) return 'Unverified';
  if (input.parseError || input.rawValue == null || input.rawValue.trim() === '') return 'Missing Evidence';
  return 'Unverified';
}

export function rollupEvidenceState(input: {
  duplicate: boolean;
  unsupported: boolean;
  injectionSuspected: boolean;
  usableEvidence: boolean;
  fieldErrors: number;
  extractorErrors: number;
  rejectedPages: number;
  missingRequired: number;
}): EvidenceState {
  if (input.unsupported) return 'Missing Evidence';
  if (input.duplicate) return 'Unverified';
  if (!input.usableEvidence) return 'Missing Evidence';
  if (input.fieldErrors > 0 || input.extractorErrors > 0 || input.rejectedPages > 0 || input.missingRequired > 0) {
    return 'Partial';
  }
  if (input.injectionSuspected) return 'Unverified';
  return 'Unverified';
}
