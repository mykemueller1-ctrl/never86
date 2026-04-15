import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { briefings, zReports, invoices } from '@/db/schema';
import { generateBriefing } from '@/lib/anthropic';
import { sendMorningBriefing } from '@/lib/email';
import { desc } from 'drizzle-orm';

// GET /api/briefing — Trigger morning briefing (called by Vercel Cron)
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get yesterday's Z-report
    const recentReports = await db
      .select()
      .from(zReports)
      .orderBy(desc(zReports.reportDate))
      .limit(7);

    const yesterdayReport = recentReports[0] || null;

    // Get recent invoices (last 7 days)
    const recentInvoices = await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(20);

    // Build alerts
    const alerts: string[] = [];
    if (yesterdayReport) {
      const foodCost = parseFloat(yesterdayReport.foodCostPercent || '0');
      const primeCost = parseFloat(yesterdayReport.primeCostPercent || '0');
      if (foodCost > 32) alerts.push(`Food cost at ${foodCost}% — above 32% target`);
      if (primeCost > 62) alerts.push(`Prime cost at ${primeCost}% — above 62% target`);
    }

    // Generate briefing HTML via Claude
    const htmlContent = await generateBriefing({
      yesterdaySales: yesterdayReport,
      weekToDate: recentReports,
      recentInvoices,
      alerts,
    });

    // Store briefing
    const [briefing] = await db
      .insert(briefings)
      .values({
        userId: 'default',
        briefingDate: new Date(),
        htmlContent,
      })
      .returning();

    // Send email
    await sendMorningBriefing(
      process.env.OWNER_EMAIL || 'myke@n86.app',
      htmlContent
    );

    // Update sent timestamp
    await db
      .update(briefings)
      .set({ sentAt: new Date() })
      .where(/* eq(briefings.id, briefing.id) */);

    return NextResponse.json({ success: true, briefingId: briefing.id });
  } catch (error: any) {
    console.error('Briefing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
