import { describe, it, expect } from 'vitest';
import { parseCsv, findColumn, num, bool, median, parseDate, norm, NOT_A_COUNT } from './core';

describe('parseCsv', () => {
  it('parses headers + rows and trims headers', () => {
    const { headers, rows } = parseCsv(' a , b , c \n1,2,3\n4,5,6');
    expect(headers).toEqual(['a', 'b', 'c']);
    expect(rows).toEqual([['1', '2', '3'], ['4', '5', '6']]);
  });
  it('handles quoted fields containing commas', () => {
    const { rows } = parseCsv('a,b\n"1,234","hello, world"');
    expect(rows[0]).toEqual(['1,234', 'hello, world']);
  });
  it('handles escaped double-quotes', () => {
    const { rows } = parseCsv('a\n"she said ""hi"""');
    expect(rows[0][0]).toBe('she said "hi"');
  });
  it('strips a UTF-8 BOM and handles CRLF', () => {
    const { headers, rows } = parseCsv('﻿a,b\r\n1,2\r\n');
    expect(headers).toEqual(['a', 'b']);
    expect(rows).toEqual([['1', '2']]);
  });
  it('returns empty for blank input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
    expect(parseCsv('   \n  ')).toEqual({ headers: ['', ''].slice(0, 0), rows: [] });
  });
});

describe('findColumn', () => {
  const h = ['Location', 'Employee Name', 'Net Sales', 'Items Voided', 'Refunds'];
  it('matches exact (normalized) before substring', () => {
    expect(findColumn(h, ['Net Sales'])).toBe(2);
    expect(findColumn(h, ['location'])).toBe(0);
  });
  it('falls back to substring match', () => {
    expect(findColumn(h, ['Employee'])).toBe(1);
  });
  it('respects alias priority order', () => {
    expect(findColumn(h, ['Refunds', 'Net Sales'])).toBe(4);
  });
  it('skips negative-token columns (count vs $)', () => {
    // "Items Voided" (idx 3) is a count; with NOT_A_COUNT we should land on Refunds
    expect(findColumn(h, ['Void', 'Refunds'], NOT_A_COUNT)).toBe(4);
  });
  it('returns -1 when nothing matches', () => {
    expect(findColumn(h, ['Tip', 'Gratuity'])).toBe(-1);
  });
});

describe('num', () => {
  it('strips $, commas, whitespace', () => {
    expect(num('$1,234.50')).toBe(1234.5);
    expect(num(' 42 ')).toBe(42);
  });
  it('returns 0 for null/undefined/garbage', () => {
    expect(num(undefined)).toBe(0);
    expect(num('')).toBe(0);
    expect(num('n/a')).toBe(0);
  });
});

describe('bool', () => {
  it('reads common truthy flags', () => {
    for (const t of ['1', 'y', 'YES', 'true', 'Void', 'comp', 'Refunded']) expect(bool(t)).toBe(true);
  });
  it('is false otherwise', () => {
    for (const f of ['', '0', 'no', undefined, 'maybe']) expect(bool(f)).toBe(false);
  });
});

describe('median', () => {
  it('handles odd and even lengths', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('returns 0 for empty', () => {
    expect(median([])).toBe(0);
  });
});

describe('parseDate', () => {
  it('parses a date to epoch ms', () => {
    expect(parseDate('2026-05-01')).toBe(Date.parse('2026-05-01'));
  });
  it('returns null for junk', () => {
    expect(parseDate('not-a-date')).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });
});

describe('norm', () => {
  it('lowercases and strips non-alphanumerics', () => {
    expect(norm('Net Sales ($)')).toBe('netsales');
  });
});
