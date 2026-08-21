import { describe, it, expect } from 'vitest';
import { readCsvFromRequest, MAX_CSV_BYTES } from './request';

const post = (body: BodyInit, headers?: HeadersInit) =>
  new Request('http://x/api/connect/x', { method: 'POST', body, headers });

describe('readCsvFromRequest', () => {
  it('reads json { csv, filename }', async () => {
    const r = await readCsvFromRequest(
      post(JSON.stringify({ csv: 'a,b\n1,2', filename: 'toast.csv' }), { 'content-type': 'application/json' }),
    );
    expect(r).toEqual({ ok: true, csv: 'a,b\n1,2', filename: 'toast.csv' });
  });

  it('reads a multipart file field', async () => {
    const fd = new FormData();
    fd.append('file', new File(['a,b\n1,2'], 'export.csv', { type: 'text/csv' }));
    const r = await readCsvFromRequest(post(fd));
    expect(r).toEqual({ ok: true, csv: 'a,b\n1,2', filename: 'export.csv' });
  });

  it('reads raw text bodies', async () => {
    const r = await readCsvFromRequest(post('a,b\n1,2', { 'content-type': 'text/plain' }));
    expect(r).toEqual({ ok: true, csv: 'a,b\n1,2', filename: '' });
  });

  it('rejects an empty body with 400', async () => {
    const r = await readCsvFromRequest(post('', { 'content-type': 'text/plain' }));
    expect(r).toEqual({ ok: false, status: 400, error: expect.any(String) });
  });

  it('rejects an oversize upload with 413', async () => {
    const big = 'x'.repeat(MAX_CSV_BYTES + 1);
    const fd = new FormData();
    fd.append('file', new File([big], 'big.csv', { type: 'text/csv' }));
    const r = await readCsvFromRequest(post(fd));
    expect(r).toEqual({ ok: false, status: 413, error: expect.any(String) });
  });

  it('rejects oversize raw text with 400', async () => {
    const r = await readCsvFromRequest(post('x'.repeat(MAX_CSV_BYTES + 1), { 'content-type': 'text/plain' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });
});
