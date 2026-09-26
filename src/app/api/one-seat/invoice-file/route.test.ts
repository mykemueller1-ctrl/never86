import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('POST /api/one-seat/invoice-file', () => {
  it('accepts a CSV and refuses a HEIC with Missing, not a price', async () => {
    const csv = new FormData();
    csv.set('file', new File(['Vendor,SKU,Description,Period,Unit Price,Qty\nSample Dairy,MZ-452,Whole Milk Mozzarella,2026-09-08,56.00,1\n'], 'current.csv', { type: 'text/csv' }));
    const csvRes = await POST(new NextRequest('http://localhost/api/one-seat/invoice-file', { method: 'POST', body: csv }));
    const csvBody = await csvRes.json();
    expect(csvRes.status).toBe(200);
    expect(csvBody.honesty).toBe('Estimated');
    expect(csvBody.text).toMatch(/56\.00|56/);

    const heic = new FormData();
    const bytes = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    heic.set('file', new File([bytes], 'ticket.heic', { type: 'image/heic' }));
    const heicRes = await POST(new NextRequest('http://localhost/api/one-seat/invoice-file', { method: 'POST', body: heic }));
    const heicBody = await heicRes.json();
    expect(heicBody.honesty).toBe('Missing');
    expect(heicBody.text).toBe('');
    expect(heicBody.note).toMatch(/HEIC/);
    expect(JSON.stringify(heicBody)).not.toMatch(/\$\d/);
  });
});
