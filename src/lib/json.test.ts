import { describe, it, expect } from 'vitest';
import { parseModelJson } from './json';

describe('parseModelJson', () => {
  it('parses a plain JSON object', () => {
    expect(parseModelJson('{"vendorName":"ACME","totalAmount":42}')).toEqual({
      vendorName: 'ACME',
      totalAmount: 42,
    });
  });

  it('parses JSON wrapped in a ```json fence', () => {
    const text = '```json\n{"netSales": 1000}\n```';
    expect(parseModelJson(text)).toEqual({ netSales: 1000 });
  });

  it('parses JSON wrapped in a bare ``` fence', () => {
    const text = '```\n{"netSales": 1000}\n```';
    expect(parseModelJson(text)).toEqual({ netSales: 1000 });
  });

  it('extracts a JSON object surrounded by prose', () => {
    const text = 'Here is the data you asked for:\n{"foodSales": 250}\nLet me know if you need more.';
    expect(parseModelJson(text)).toEqual({ foodSales: 250 });
  });

  it('handles leading/trailing whitespace', () => {
    expect(parseModelJson('   {"ok": true}   ')).toEqual({ ok: true });
  });

  it('throws a clear error when there is no JSON', () => {
    expect(() => parseModelJson('I could not read this invoice.')).toThrow(
      /not valid JSON/i,
    );
  });
});
