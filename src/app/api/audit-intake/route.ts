import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { sendAuditIntakeEmail, sendNotification } from '@/lib/email';
import { z } from 'zod';

const auditInput = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120),
  restaurantName: z.string().trim().min(1).max(160),
  platform: z.enum(['DoorDash', 'Uber Eats', 'Grubhub', 'Other']),
  locationCount: z.string().trim().max(20).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  utmContent: z.string().trim().max(120).optional(),
  referrer: z.string().trim().max(500).optional(),
});

function escapeHtml(value?: string) {
  return (value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(req: NextRequest) {
  try {
    const data = auditInput.parse(await req.json());

    const sourceTag = [
      'marketplace-audit',
      data.platform,
      data.utmSource || 'direct',
      data.utmContent || 'unknown',
    ].join('|');

    await db
      .insert(waitlist)
      .values({
        email: data.email,
        name: data.name,
        restaurantName: data.restaurantName,
        role: sourceTag,
      })
      .onConflictDoUpdate({
        target: waitlist.email,
        set: {
          name: data.name,
          restaurantName: data.restaurantName,
          role: sourceTag,
        },
      });

    const safeName = escapeHtml(data.name);
    const safeRestaurant = escapeHtml(data.restaurantName);
    const safePlatform = escapeHtml(data.platform);
    const safeLocations = escapeHtml(data.locationCount || 'Not supplied');
    const safeSource = escapeHtml(data.utmSource || 'direct');
    const safeMedium = escapeHtml(data.utmMedium || 'none');
    const safeCampaign = escapeHtml(data.utmCampaign || 'none');
    const safeContent = escapeHtml(data.utmContent || 'none');
    const safeReferrer = escapeHtml(data.referrer || 'none');

    const emailResults = await Promise.allSettled([
      sendAuditIntakeEmail(data.email, data.name),
      sendNotification(
        process.env.OWNER_EMAIL || 'myke@n86.app',
        `Marketplace audit lead: ${data.restaurantName}`,
        `<strong>${safeName}</strong> requested a free marketplace audit.<br/><br/>
         Restaurant: ${safeRestaurant}<br/>
         Email: ${escapeHtml(data.email)}<br/>
         Platform: ${safePlatform}<br/>
         Locations: ${safeLocations}<br/><br/>
         UTM source: ${safeSource}<br/>
         UTM medium: ${safeMedium}<br/>
         UTM campaign: ${safeCampaign}<br/>
         UTM content: ${safeContent}<br/>
         Referrer: ${safeReferrer}`
      ),
    ]);

    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Audit intake email ${index} failed:`, result.reason);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Check your email. Reply with one redacted marketplace statement.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Check the form and try again.', issues: error.flatten() },
        { status: 400 }
      );
    }

    console.error('Audit intake error:', error);
    return NextResponse.json(
      { error: 'We could not save the request. Try again or email hello@never86.ai.' },
      { status: 500 }
    );
  }
}
