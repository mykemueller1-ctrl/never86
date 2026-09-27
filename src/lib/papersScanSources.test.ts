import { describe, expect, it } from 'vitest';
import { listDriveScanCandidates, listGmailScanCandidates } from './papersScanSources';
import { PAPERS_SCAN_MAX_BYTES } from './papersScanTypes';

describe('papers scan sources', () => {
  it('does not download an oversize Gmail attachment', async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('/messages?')) {
        return new Response(JSON.stringify({ messages: [{ id: 'm1' }] }), { status: 200 });
      }
      if (url.includes('/messages/m1?')) {
        return new Response(JSON.stringify({
          payload: {
            headers: [{ name: 'Subject', value: 'Sysco invoice' }],
            parts: [{
              filename: 'invoice.pdf',
              mimeType: 'application/pdf',
              body: { attachmentId: 'a1', size: PAPERS_SCAN_MAX_BYTES + 50 },
            }],
          },
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };
    const hits = await listGmailScanCandidates({ accessToken: 'tok', fetchImpl });
    expect(hits).toEqual([
      expect.objectContaining({ externalId: 'm1:a1', skip: 'oversize', filename: 'invoice.pdf' }),
    ]);
    expect(calls.some((url) => url.includes('/attachments/'))).toBe(false);
  });

  it('does not download an oversize Drive file', async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('alt=media')) return new Response('nope', { status: 500 });
      return new Response(JSON.stringify({
        files: [{ id: 'big', name: 'invoice.pdf', size: String(PAPERS_SCAN_MAX_BYTES + 10) }],
      }), { status: 200 });
    };
    const hits = await listDriveScanCandidates({
      accessToken: 'tok',
      fetchImpl,
      now: new Date('2026-09-26T00:00:00.000Z'),
    });
    expect(hits[0]?.skip).toBe('oversize');
    expect(calls.some((url) => url.includes('alt=media'))).toBe(false);
    expect(decodeURIComponent(calls[0] ?? '')).toMatch(/modifiedTime/);
  });
});
