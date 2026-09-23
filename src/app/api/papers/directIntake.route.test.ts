import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as uploadPost } from './upload/route';
import { POST as photoPost } from './photo/route';
import { POST as chatPost } from './chat/route';
import { GET as statusGet } from './status/route';
import { resetPapersTokenStore } from '@/lib/papersInboxHttp';

function cookieFrom(res: Response): string {
  const raw = res.headers.get('set-cookie') || '';
  const match = /n86_simple_owner=([^;]+)/.exec(raw);
  return match ? `n86_simple_owner=${match[1]}` : '';
}

describe('POST /api/papers/upload, /photo, /chat', () => {
  it('peels a literal TOTAL/DUE, keeps a SKU price Missing, and labels a chat-typed dollar Estimated', async () => {
    resetPapersTokenStore();
    const totals = new FormData();
    totals.append('files', new File(['Vendor note TOTAL DUE $19.00\n'], 'a.txt', { type: 'text/plain' }));
    totals.append('files', new File(['Other note TOTAL DUE $20.00\n'], 'b.txt', { type: 'text/plain' }));
    const uploaded = await uploadPost(new NextRequest('http://localhost/api/papers/upload', { method: 'POST', body: totals }));
    const uploadBody = await uploaded.json();
    expect(uploaded.status).toBe(200);
    expect(uploadBody.honesty).toBe('Estimated');
    expect(uploadBody.papers).toHaveLength(2);
    expect(uploadBody.papers.map((row: { text: string }) => row.text)).toEqual([
      'TOTAL DUE $19.00',
      'TOTAL DUE $20.00',
    ]);
    expect(uploadBody.text).not.toMatch(/39\.00|56\.00/);
    expect(uploadBody.connection.gmail).toBe(false);
    expect(uploadBody.connection.drive).toBe(false);
    expect(uploadBody.elevated).toBe(true);
    expect(uploadBody.lead).toEqual(['photo', 'upload', 'chat']);
    const cookie = cookieFrom(uploaded);

    const csv = new FormData();
    csv.set(
      'file',
      new File(
        ['Vendor,SKU,Description,Period,Unit Price,Qty\nSample Dairy,MZ-452,Whole Milk Mozzarella,2026-09-08,56.00,1\n'],
        'sku-sample.csv',
        { type: 'text/csv' },
      ),
    );
    const sku = await uploadPost(new NextRequest('http://localhost/api/papers/upload', {
      method: 'POST',
      body: csv,
      headers: cookie ? { cookie } : {},
    }));
    const skuBody = await sku.json();
    expect(sku.status).toBe(200);
    expect(skuBody.honesty).toBe('Missing');
    expect(skuBody.text).toBe('');
    expect(JSON.stringify(skuBody)).not.toMatch(/56\.00/);

    const heic = new FormData();
    heic.set(
      'file',
      new File([new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63])], 'ticket.heic', { type: 'image/heic' }),
    );
    const photo = await photoPost(new NextRequest('http://localhost/api/papers/photo', {
      method: 'POST',
      body: heic,
      headers: cookie ? { cookie } : {},
    }));
    const photoBody = await photo.json();
    expect(photo.status).toBe(200);
    expect(photoBody.honesty).toBe('Missing');
    expect(photoBody.text).toBe('');
    expect(photoBody.connection.gmail).toBe(false);
    expect(JSON.stringify(photoBody)).not.toMatch(/\$\d/);

    const chat = await chatPost(new NextRequest('http://localhost/api/papers/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: JSON.stringify({ text: 'invoice was $999' }),
    }));
    const chatBody = await chat.json();
    expect(chat.status).toBe(200);
    expect(chatBody.honesty).toBe('Estimated');
    expect(chatBody.text).toBe('$999');
    expect(chatBody.note).toMatch(/Estimated/);
    expect(chatBody.note).toContain('Not Verified');
    expect(chatBody.honesty).not.toBe('Verified');
    expect(chatBody.text).not.toMatch(/999\.00|1,000/);
    expect(chatBody.connection.gmail).toBe(false);
    expect(chatBody.elevated).toBe(true);
    expect(chatBody.lead).toEqual(['photo', 'upload', 'chat']);

    const status = await statusGet(new NextRequest('http://localhost/api/papers/status', {
      headers: cookie ? { cookie } : {},
    }));
    const statusBody = await status.json();
    expect(statusBody.connection.gmail).toBe(false);
    expect(statusBody.connection.drive).toBe(false);
    expect(statusBody.intakeOrder).toEqual(['gmail', 'photo', 'chat']);
    expect(statusBody.honesty).toBe('Missing');
    expect(statusBody.intake.map((row: { kind: string; honesty: string }) => `${row.kind}:${row.honesty}`)).toEqual([
      'upload:Estimated',
      'upload:Estimated',
      'upload:Missing',
      'photo:Missing',
      'chat:Estimated',
    ]);
    const chatRow = statusBody.intake.find((row: { kind: string }) => row.kind === 'chat');
    expect(chatRow.text).toBe('$999');
    expect(JSON.stringify(statusBody.intake)).not.toMatch(/56\.00/);
  });

  it('fail-closes an empty upload and an empty chat', async () => {
    const upload = await uploadPost(new NextRequest('http://localhost/api/papers/upload', { method: 'POST', body: new FormData() }));
    expect(upload.status).toBe(400);
    expect((await upload.json()).honesty).toBe('Missing');
    const chat = await chatPost(new NextRequest('http://localhost/api/papers/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    }));
    expect(chat.status).toBe(400);
    expect((await chat.json()).honesty).toBe('Missing');
  });
});
