import type { DecimalString } from './types';

const INTEGER_RE = /^-?\d+$/;

export function parseMoney(raw: string | null | undefined): { ok: true; value: DecimalString } | { ok: false; error: string } {
  if (raw == null || raw.trim() === '') {
    return { ok: false, error: 'missing_money' };
  }

  let s = raw.trim().replace(/[$,\s]/g, '');
  let negative = false;

  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).replace(/[$,\s]/g, '');
  }

  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }

  if (!/^\d+(\.\d+)?$/.test(s)) {
    return { ok: false, error: 'invalid_money' };
  }

  const parts = s.split('.');
  const frac = parts[1] ?? '';
  if (frac.length > 2) {
    return { ok: false, error: 'extra_money_precision' };
  }

  const digits = parts[0].replace(/^0+(?=\d)/, '') || '0';
  const cents = (frac + '00').slice(0, 2);
  return { ok: true, value: `${negative ? '-' : ''}${digits}.${cents}` };
}

export function parseInteger(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const cleaned = raw.trim();
  if (!INTEGER_RE.test(cleaned)) return { ok: false, error: 'invalid_integer' };
  return { ok: true, value: cleaned };
}

export function formatConfidence(raw: string | number): { ok: true; value: DecimalString } | { ok: false; error: string } {
  const text = typeof raw === 'number' ? String(raw) : raw.trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false, error: 'invalid_confidence' };
  const parts = text.split('.');
  if ((parts[1] ?? '').length > 4) return { ok: false, error: 'extra_confidence_precision' };
  const frac = (parts[1] ?? '').padEnd(4, '0');
  const value = Number(`${parts[0]}.${frac}`);
  if (!Number.isFinite(value) || value < 0 || value > 1) return { ok: false, error: 'confidence_out_of_range' };
  return { ok: true, value: `${parts[0]}.${frac}` };
}
