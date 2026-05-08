import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { invoices } from '@/db/schema';
import { parseInvoice } from '@/lib/anthropic';
import {
  checkRateLimit,
  requireBearerTokenFromEnv,
  requireUserIdHeader,
  responseInternalError,
} from '@/lib/security';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const invoiceInput = z.object({
  rawText: z.string().min(1),
  fileUrl: z.string().optional(),
});

// POST /api/invoices — Upload and process an invoice
export async function POST(req: NextRequest) {
  const auth = requireBearerTokenFromEnv(req, 'INTERNAL_API_KEY');
  if (!auth.ok) return auth.response;

  const userScope = requireUserIdHeader(req);
  if (!userScope.ok) return userScope.response;

  const rateLimit = checkRateLimit(req, `invoices-post:${userScope.userId}`, 20, 60_000);
  if (rateLimit) return rateLimit;

  try {
    const db = getDb();
    const body = await req.json();
    const { rawText, fileUrl } = invoiceInput.parse(body);

    // Claude parses the invoice
    const parsed = await parseInvoice(rawText);

    // Store in DB
    const [invoice] = await db
      .insert(invoices)
      .values({
        userId: userScope.userId,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    return responseInternalError();
  }
}

// GET /api/invoices — List invoices
export async function GET(req: NextRequest) {
  const auth = requireBearerTokenFromEnv(req, 'INTERNAL_API_KEY');
  if (!auth.ok) return auth.response;

  const userScope = requireUserIdHeader(req);
  if (!userScope.ok) return userScope.response;

  const rateLimit = checkRateLimit(req, `invoices-get:${userScope.userId}`, 60, 60_000);
  if (rateLimit) return rateLimit;

  try {
    const db = getDb();
    const results = await db.select().from(invoices).where(eq(invoices.userId, userScope.userId));
    return NextResponse.json({ invoices: results });
  } catch (error: any) {
    console.error('Invoice list error:', error);
    return responseInternalError();
  }
}
