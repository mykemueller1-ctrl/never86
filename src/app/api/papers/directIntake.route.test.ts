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
  it('persists a file price only from the file, a photo as Missing, and chat dollars as not evidence', async () => {
    resetPapersTokenStore();
    const csv = new FormData();
    csv.set(
      'file',
      new File(
        ['Vendor,SKU,Description,Period,Unit Price,Qty\nSample Dairy,MZ-452,Whole Milk Mozzarella,2026-09-08,56.00,1\n'],
        'vestis-sample.csv',
        { type: 'text/csv' },
      ),
    );
    const uploaded = await uploadPost(new NextRequest('http://localhost/api/papers/upload', { method: 'POST', body: csv }));
    const uploadBody = await uploaded.json();
    expect(uploaded.status).toBe(200);
    expect(uploadBody.honesty).toBe('Estimated');
    expect(uploadBody.text).toMatch(/56\.00/);
    expect(uploadBody.connection.gmail).toBe(false);
    expect(uploadBody.connection.drive).toBe(false);
    const cookie = cookieFrom(uploaded);

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
    expect(chatBody.honesty).toBe('Missing');
    expect(chatBody.note).toMatch(/not evidence/);
    expect(JSON.stringify(chatBody)).not.toMatch(/999/);
    expect(chatBody.connection.gmail).toBe(false);

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
      'photo:Missing',
      'chat:Missing',
    ]);
    expect(JSON.stringify(statusBody.intake)).not.toMatch(/999/);
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
