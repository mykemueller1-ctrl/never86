import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { sendAuditIntakeEmail, sendNotification } from '@/lib/email';
import { z } from 'zod';

const auditInterestInput = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().max(120).optional().default(''),
  restaurantName: z.string().trim().max(160).optional().default(''),
  platform: z.enum(['DoorDash', 'Uber Eats', 'Grubhub', 'Multiple', 'Other']),
  source: z.string().trim().max(80).optional().default('direct'),
  medium: z.string().trim().max(80).optional().default('social'),
  campaign: z.string().trim().max(120).optional().default('100-statement-audit'),
  website: z.string().max(0).optional().default(''),
});

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = auditInterestInput.parse(body);

    const attribution = [
      'marketplace-audit',
      `platform=${data.platform}`,
      `source=${data.source || 'direct'}`,
      `medium=${data.medium || 'social'}`,
      `campaign=${data.campaign || '100-statement-audit'}`,
    ].join('|');

    await db
      .insert(waitlist)
      .values({
        email: data.email,
        name: data.name || null,
        restaurantName: data.restaurantName || null,
        role: attribution,
      })
      .onConflictDoUpdate({
        target: waitlist.email,
        set: {
          name: data.name || null,
          restaurantName: data.restaurantName || null,
          role: attribution,
        },
      });

    const ownerEmail = process.env.OWNER_EMAIL || 'myke@n86.app';

    const results = await Promise.allSettled([
      sendAuditIntakeEmail(data.email, data.name),
      sendNotification(
        ownerEmail,
        `Marketplace audit request: ${data.restaurantName || data.name || data.email}`,
        `<strong>${escapeHtml(data.name || 'Restaurant operator')}</strong> requested a free marketplace audit.<br/><br/>
         Email: ${escapeHtml(data.email)}<br/>
         Restaurant: ${escapeHtml(data.restaurantName || 'Not supplied')}<br/>
         Platform: ${escapeHtml(data.platform)}<br/>
         Source: ${escapeHtml(data.source || 'direct')} / ${escapeHtml(data.medium || 'social')}<br/>
         Campaign: ${escapeHtml(data.campaign || '100-statement-audit')}<br/><br/>
         Next move: reply and request one redacted marketplace statement.`
      ),
    ]);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(index === 0 ? 'Audit intake email failed' : 'Owner notification failed', result.reason);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Check your email. Reply with one redacted marketplace statement.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Enter a valid email and select the marketplace you use.' },
        { status: 400 }
      );
    }

    console.error('Audit interest error:', error);
    return NextResponse.json(
      { error: 'We could not save your request. Try again or email Myke directly.' },
      { status: 500 }
    );
  }
}
