import { describe, expect, it } from 'vitest';
import { canWriteDriveFolders, ensureBohPapersFolders, listGmailOperatorPapers } from './papersGoogle';
import { PAPERS_ROOT_FOLDER } from './papersInbox';

describe('papers Google folders + list', () => {
  it('creates Never86 Papers / Invoices / Z-EOD / Labor / Liquor-Beer when drive.file is granted', async () => {
    expect(canWriteDriveFolders(['https://www.googleapis.com/auth/drive.file'])).toBe(true);
    expect(canWriteDriveFolders(['https://www.googleapis.com/auth/drive.readonly'])).toBe(false);

    const created: string[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes('/drive/v3/files') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { name: string };
        created.push(body.name);
        return new Response(JSON.stringify({ id: `id-${body.name}`, name: body.name }), { status: 200 });
      }
      return new Response(JSON.stringify({ files: [] }), { status: 200 });
    };

    const result = await ensureBohPapersFolders({
      accessToken: 'tok',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      fetchImpl,
    });
    expect(created[0]).toBe(PAPERS_ROOT_FOLDER);
    expect(created.slice(1)).toEqual(['Invoices', 'Z-EOD', 'Labor', 'Liquor-Beer']);
    expect(result.folders.every((folder) => folder.status === 'created')).toBe(true);
    expect(result.note).toMatch(/Created/);
  });

  it('auto-detects existing operator folders without inventing files', async () => {
    const existing = [
      { id: 'inv', name: 'Invoices' },
      { id: 'lab', name: 'Labor' },
    ];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      const decoded = decodeURIComponent(url);
      if (!decoded.includes('/drive/v3/files')) return new Response('{}', { status: 404 });
      if (/name = 'Never86 Papers'/.test(decoded)) return new Response(JSON.stringify({ files: [] }), { status: 200 });
      if (/name = '/.test(decoded)) {
        const named = existing.find((file) => decoded.includes(`name = '${file.name}'`));
        return new Response(JSON.stringify({ files: named ? [named] : [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ files: existing }), { status: 200 });
    };
    const result = await ensureBohPapersFolders({
      accessToken: 'tok',
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      fetchImpl,
    });
    expect(result.created).toBe(false);
    expect(result.folders.find((folder) => folder.id === 'invoices')?.status).toBe('found');
    expect(result.folders.find((folder) => folder.id === 'z-eod')?.honesty).toBe('Missing');
    expect(result.note).toMatch(/Missing: Z-EOD/);
  });

  it('lists Gmail attachments that look like invoices', async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('/messages?')) {
        return new Response(JSON.stringify({ messages: [{ id: 'm1' }] }), { status: 200 });
      }
      if (url.includes('/messages/m1?')) {
        return new Response(JSON.stringify({
          payload: {
            headers: [{ name: 'Subject', value: 'Sysco invoice' }],
            parts: [{ filename: 'invoice-truck.pdf', body: { attachmentId: 'a1' } }],
          },
        }), { status: 200 });
      }
      if (url.includes('/attachments/a1')) {
        return new Response(JSON.stringify({ data: Buffer.from('Vendor,SKU').toString('base64url') }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };
    const hits = await listGmailOperatorPapers({
      accessToken: 'tok',
      query: 'newer_than:8d',
      fetchImpl,
    });
    expect(hits[0]?.filename).toBe('invoice-truck.pdf');
    expect(hits[0]?.bytes?.byteLength).toBeGreaterThan(0);
  });
});
