import { describe, expect, it } from 'vitest';
import { readBoundedBody, RequestTooLarge } from './boundedRequest';

describe('bounded request streaming', () => {
  it('returns the exact body within the limit', async () => {
    const body = await readBoundedBody(new Request('https://example.test', { method: 'POST', body: 'hello' }), 5);
    expect(new TextDecoder().decode(body)).toBe('hello');
  });
  it('rejects a declared oversized request before reading', async () => {
    const request = new Request('https://example.test', { method: 'POST', body: 'x', headers: { 'content-length': '100' } });
    await expect(readBoundedBody(request, 5)).rejects.toBeInstanceOf(RequestTooLarge);
    expect(request.bodyUsed).toBe(false);
  });
  it('counts bytes rather than characters without content-length', async () => {
    await expect(readBoundedBody(new Request('https://example.test', { method: 'POST', body: '€€' }), 5)).rejects.toBeInstanceOf(RequestTooLarge);
  });
  it('cancels a chunked stream once the limit is crossed', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new Uint8Array(4)); },
      cancel() { cancelled = true; },
    });
    const request = new Request('https://example.test', { method: 'POST', body, duplex: 'half' } as RequestInit);
    await expect(readBoundedBody(request, 5)).rejects.toBeInstanceOf(RequestTooLarge);
    expect(cancelled).toBe(true);
  });
});
