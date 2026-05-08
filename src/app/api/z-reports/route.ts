import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { zReports } from '@/db/schema';
import { parseZReport } from '@/lib/anthropic';
import {
  checkRateLimit,
  requireBearerTokenFromEnv,
  requireUserIdHeader,
  responseInternalError,
} from '@/lib/security';
import { z } from 'zod';

const zReportInput = z.object({
  rawText: z.string().min(1),
});

// POST /api/z-reports — Upload and process a Z-Report
export async function POST(req: NextRequest) {
  const auth = requireBearerTokenFromEnv(req, 'INTERNAL_API_KEY');
  if (!auth.ok) return auth.response;

  const userScope = requireUserIdHeader(req);
  if (!userScope.ok) return userScope.response;

  const rateLimit = checkRateLimit(req, `z-reports-post:${userScope.userId}`, 20, 60_000);
  if (rateLimit) return rateLimit;

  try {
    const db = getDb();
    const body = await req.json();
    const { rawText } = zReportInput.parse(body);

    // Claude parses the Z-Report
    const parsed = await parseZReport(rawText);

    // Calculate cost percentages
    const foodCostPercent = parsed.foodSales && parsed.netSales
      ? ((parsed.foodSales / parsed.netSales) * 100).toFixed(2)
      : null;
    const liquorCostPercent = parsed.liquorSales && parsed.netSales
      ? ((parsed.liquorSales / parsed.netSales) * 100).toFixed(2)
      : null;
    const primeCost = (parsed.foodSales || 0) + (parsed.laborCost || 0);
    const primeCostPercent = parsed.netSales
      ? ((primeCost / parsed.netSales) * 100).toFixed(2)
      : null;

    const [report] = await db
      .insert(zReports)
      .values({
        userId: userScope.userId,
        reportDate: parsed.reportDate ? new Date(parsed.reportDate) : new Date(),
        grossSales: parsed.grossSales?.toString(),
        netSales: parsed.netSales?.toString(),
        foodSales: parsed.foodSales?.toString(),
        liquorSales: parsed.liquorSales?.toString(),
        beerSales: parsed.beerSales?.toString(),
        wineSales: parsed.wineSales?.toString(),
        laborCost: parsed.laborCost?.toString(),
        foodCostPercent,
        liquorCostPercent,
        primeCostPercent,
        guestCount: parsed.guestCount,
        checkAverage: parsed.checkAverage?.toString(),
        rawData: parsed,
        processedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Z-Report processing error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    return responseInternalError();
  }
}
