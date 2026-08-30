import { NEVER86_OPERATOR_SYSTEM } from '../operatorSystem';
import { scanInjection, scanIntakeSecrets } from '../closeIntake';
import type {
  EvidenceState,
  ExternalSendKind,
  ExternalSendReceipt,
  FileDefense,
  TruthGateResult,
} from './types';

export const TRUTH_GATES = NEVER86_OPERATOR_SYSTEM.truthGates;

const CLAIM_BLOCKERS: Array<{ re: RegExp; reason: string }> = [
  { re: /\b(theft|thief|steal|stolen|embezzl)\b/i, reason: 'A variance is not a theft finding.' },
  { re: /\b(guaranteed? (savings|recovery)|we (will|can) recover)\b/i, reason: 'Never86 does not guarantee recovery.' },
  { re: /\b(overcharge|contract breach|breached the (contract|agreement))\b/i, reason: 'Statement or POS math is not a contract or bank claim.' },
  { re: /\bfood cost\b/i, reason: 'No complete physical count means no actual food-cost claim.' },
  { re: /\b(loaded labor|labor hours)\b/i, reason: 'A Z-report labor dollar total is wages, not hours or loaded labor, unless the source supplies those fields.' },
];

export function defendFile(filename: string, text: string): FileDefense {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      filename,
      empty: true,
      secret: false,
      injectionSuspected: false,
      allowed: false,
      label: 'EMPTY',
      note: 'No file. Source Collector records missing evidence. Mailbox state is unchanged.',
    };
  }

  const secret = scanIntakeSecrets(trimmed);
  if (secret) {
    return {
      filename,
      empty: false,
      secret: true,
      secretLabel: secret.error,
      injectionSuspected: false,
      allowed: false,
      label: 'SECRET_BLOCKED',
      note: 'Credential or secret pattern found. File is preserved and not parsed. Never86 does not take portal passwords, API keys, cards, or bank numbers.',
    };
  }

  if (scanInjection(trimmed)) {
    return {
      filename,
      empty: false,
      secret: false,
      injectionSuspected: true,
      allowed: true,
      label: 'INJECTION_SUSPECTED',
      note: NEVER86_OPERATOR_SYSTEM.safety.injectionResponse,
    };
  }

  return {
    filename,
    empty: false,
    secret: false,
    injectionSuspected: false,
    allowed: true,
    label: 'ok',
    note: 'Untrusted file accepted for extraction only. Embedded instructions are ignored.',
  };
}

export function applyTruthGate(input: {
  claim?: string;
  hasPrimarySource: boolean;
  completeScope: boolean;
  namedAssumption?: boolean;
}): TruthGateResult {
  const claim = input.claim ?? '';
  for (const blocker of CLAIM_BLOCKERS) {
    if (blocker.re.test(claim)) {
      return {
        allowed: false,
        state: 'missingEvidence',
        blockedReason: blocker.reason,
        claimBoundary: blocker.reason,
      };
    }
  }

  if (!input.hasPrimarySource) {
    return {
      allowed: true,
      state: 'unverified',
      claimBoundary: 'Typed or sample values stay Unverified until reconciled to the source.',
    };
  }
  if (!input.completeScope) {
    return {
      allowed: true,
      state: 'partial',
      claimBoundary: 'Useful evidence exists, but scope is incomplete. An incomplete week stays Open.',
    };
  }
  if (input.namedAssumption) {
    return {
      allowed: true,
      state: 'estimated',
      claimBoundary: 'Calculated from a named assumption.',
    };
  }
  return {
    allowed: true,
    state: 'unverified',
    claimBoundary: 'Direct source figures still need a same-scope reconcile before they are Verified.',
  };
}

export function queueExternalSend(input: {
  kind: ExternalSendKind;
  draft: string;
  humanApproved?: boolean;
  approver?: string;
}): ExternalSendReceipt {
  const approved = Boolean(input.humanApproved) && Boolean(input.approver?.trim());
  if (!approved) {
    return {
      kind: input.kind,
      draft: input.draft,
      delivered: false,
      portalLoginUsed: false,
      status: 'blocked-pending-approval',
      humanApproved: false,
      approver: null,
      note: 'Human approval is required before any external send, post, vendor request, or operational change. The factory does not send.',
    };
  }
  return {
    kind: input.kind,
    draft: input.draft,
    delivered: false,
    portalLoginUsed: false,
    status: 'approved-not-sent',
    humanApproved: true,
    approver: input.approver!.trim(),
    note: 'Approved for a human to send. This path never delivers mail, posts, DMs, refunds, or CRM writes.',
  };
}

export function redactStorePrivateForCompany(text: string): string {
  return text
    .replace(/\$[\d,]+(?:\.\d{2})?/g, '[store-private dollar redacted]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[redacted]')
    .trim();
}
