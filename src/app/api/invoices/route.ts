import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { parseInvoice } from '@/lib/anthropic';
import { z } from 'zod';

const invoiceInput = z.object({
  rawText: z.string().min(1),
  userId: z.string().default('default'),
  fileUrl: z.string().optional(),
});

// POST /api/invoices — Upload and process an invoice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, userId, fileUrl } = invoiceInput.parse(body);

    // Claude parses the invoice
    const parsed = await parseInvoice(rawText);

    // Store in DB
    const [invoice] = await db
      .insert(invoices)
      .values({
        userId,
        vendorName: parsed.vendorName,
        invoiceNumber: parsed.invoiceNumber,
        invoiceDate: parsed.invoiceDate ? new Date(parsed.invoiceDate) : null,
        totalAmount: parsed.totalAmount?.toString(),
        category: parsed.category,
        lineItems: parsed.lineItems,
        rawText,
        fileUrl: fileUrl || null,
        processedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Invoice processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process invoice' },
      { status: 400 }
    );
  }
}

// GET /api/invoices — List invoices
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'default';
    const results = await db.select().from(invoices);
    return NextResponse.json({ invoices: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
