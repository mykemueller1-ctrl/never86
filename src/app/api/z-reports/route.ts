import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { zReports } from '@/db/schema';
import { parseZReport } from '@/lib/anthropic';
import { z } from 'zod';

const zReportInput = z.object({
  rawText: z.string().min(1),
  userId: z.string().default('default'),
});

// POST /api/z-reports — Upload and process a Z-Report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, userId } = zReportInput.parse(body);

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
        userId,
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
    return NextResponse.json(
      { error: error.message || 'Failed to process Z-Report' },
      { status: 400 }
    );
  }
}
