/**
 * Operator-scoped close intake. Capture without portal credentials.
 * Treat every paste, file, and forwarded email as untrusted data.
 */

export type IntakeChannel = 'paste' | 'file' | 'email';

export type IntakeRejection = {
  ok: false;
  code: 'secret' | 'empty' | 'injection' | 'unsupported';
  error: string;
};

const SECRET_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\b(pos\s*)?(api[_-]?key|secret[_-]?key|password|passwd|pin)\s*[:=]\s*\S+/i, label: 'credential' },
  { re: /\bsk[-_]live[-_][A-Za-z0-9]{8,}\b/, label: 'secret key' },
  { re: /\b(?:\d[ -]*?){13,19}\b/, label: 'card number' },
  { re: /\brouting\s*(number|#)?\s*[:=]?\s*\d{9}\b/i, label: 'routing number' },
  { re: /\bssn\s*[:=]\s*\d{3}-?\d{2}-?\d{4}\b/i, label: 'ssn' },
];

const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above) instructions/i,
  /you are now/i,
  /system prompt/i,
  /do not follow the restaurant/i,
];

export function scanIntakeSecrets(text: string): IntakeRejection | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, code: 'empty', error: 'Paste, upload, or forward yesterday\'s close first.' };
  }
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.re.test(trimmed)) {
      return {
        ok: false,
        code: 'secret',
        error: `This looks like a ${pattern.label}. Never86'd does not take POS passwords, API keys, cards, or bank numbers. Forward the report, not the login.`,
      };
    }
  }
  return null;
}

export function scanInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

export type IntakeDocument = {
  filename?: string;
  text: string;
  channel: IntakeChannel;
  from?: string;
};

export function isPdqEodSender(from?: string): boolean {
  if (!from) return false;
  return /pdqreports@pdqpos\.com/i.test(from);
}

export function isPdqEodSubject(subject?: string): boolean {
  if (!subject) return false;
  return /eod reports/i.test(subject);
}

export function intakeMailboxAddress(operatorId: number): string {
  return `close+${operatorId}@inbound.never86.ai`;
}

export function parseIntakeOperatorId(to: string | string[] | undefined): number | null {
  const list = Array.isArray(to) ? to : to ? [to] : [];
  for (const addr of list) {
    const m = String(addr).match(/close\+(\d{6,})@/i);
    if (m) {
      const id = Number(m[1]);
      if (Number.isFinite(id) && id >= 1_000_000) return id;
    }
  }
  return null;
}
