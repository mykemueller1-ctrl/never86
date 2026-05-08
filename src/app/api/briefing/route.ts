import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { briefings, zReports, invoices } from '@/db/schema';
import { generateBriefing } from '@/lib/anthropic';
import { sendMorningBriefing } from '@/lib/email';
import { desc, eq } from 'drizzle-orm';
import {
  checkRateLimit,
  requireBearerTokenFromEnv,
  responseInternalError,
  validateUserId,
} from '@/lib/security';

// GET /api/briefing — Trigger morning briefing (called by Vercel Cron)
export async function GET(req: NextRequest) {
  const auth = requireBearerTokenFromEnv(req, 'CRON_SECRET');
  if (!auth.ok) return auth.response;

  const rateLimit = checkRateLimit(req, 'briefing-get', 10, 60_000);
  if (rateLimit) return rateLimit;

  try {
    const db = getDb();
    const briefingUserId = validateUserId(process.env.BRIEFING_USER_ID);
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!briefingUserId || !ownerEmail) {
      console.error('Briefing configuration incomplete', {
        hasBriefingUserId: Boolean(briefingUserId),
        hasOwnerEmail: Boolean(ownerEmail),
      });
      return responseInternalError();
    }

    // Get yesterday's Z-report
    const recentReports = await db
      .select()
      .from(zReports)
      .where(eq(zReports.userId, briefingUserId))
      .orderBy(desc(zReports.reportDate))
      .limit(7);

    const yesterdayReport = recentReports[0] || null;

    // Get recent invoices (last 7 days)
    const recentInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, briefingUserId))
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
        userId: briefingUserId,
        briefingDate: new Date(),
        htmlContent,
      })
      .returning();

    // Send email
    await sendMorningBriefing(ownerEmail, htmlContent);

    // Update sent timestamp
    await db
      .update(briefings)
      .set({ sentAt: new Date() })
      .where(eq(briefings.id, briefing.id));

    return NextResponse.json({ success: true, briefingId: briefing.id });
  } catch (error: any) {
    console.error('Briefing error:', error);
    return responseInternalError();
  }
}
