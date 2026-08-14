import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { captureLead } from '@/lib/leadCapture';
import { sendAuditIntakeEmail, sendNotification } from '@/lib/email';

const auditIntakeInput = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120).optional(),
  restaurantName: z.string().trim().min(1).max(160).optional(),
  platform: z.enum(['DoorDash', 'Uber Eats', 'Grubhub', 'ezCater', 'Other']),
  units: z.union([z.string(), z.number()]).optional(),
  sourcePage: z.string().max(1000).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(160).optional(),
  utmContent: z.string().max(160).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const input = auditIntakeInput.parse(await req.json());
    const units =
      typeof input.units === 'number'
        ? input.units
        : input.units
          ? Number(input.units) || null
          : null;

    const sourcePage =
      input.sourcePage ?? req.headers.get('referer') ?? '/audit';

    await captureLead({
      email: input.email,
      name: input.name,
      restaurantName: input.restaurantName,
      units,
      role: 'Restaurant operator',
      sourcePage,
      requestedAgent: 'Marketplace Audit',
      interestedAgent: `${input.platform} Marketplace Audit`,
      dataPreference: 'Reply by email with one redacted statement',
      referrer: req.headers.get('referer') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      utm: {
        source: input.utmSource,
        medium: input.utmMedium,
        campaign: input.utmCampaign,
      },
    });

    const ownerEmail = process.env.OWNER_EMAIL || 'myke@n86.app';
    const sourceDetails = [
      input.utmSource && `Source: ${input.utmSource}`,
      input.utmMedium && `Medium: ${input.utmMedium}`,
      input.utmCampaign && `Campaign: ${input.utmCampaign}`,
      input.utmContent && `Content: ${input.utmContent}`,
    ]
      .filter(Boolean)
      .join('<br/>');

    const [leadEmail] = await Promise.allSettled([
      sendAuditIntakeEmail(input.email, input.name),
      sendNotification(
        ownerEmail,
        `🔥 Free audit request · ${input.restaurantName || input.name || input.email}`,
        `<p><strong>${input.name || 'A restaurant operator'}</strong> requested a free ${input.platform} audit.</p>
         <p>Email: ${input.email}<br/>
         ${input.restaurantName ? `Restaurant: ${input.restaurantName}<br/>` : ''}
         ${units ? `Units: ${units}<br/>` : ''}
         Platform: ${input.platform}<br/>
         ${sourceDetails ? `${sourceDetails}<br/>` : ''}
         Page: ${sourcePage}</p>
         <p><strong>Next move:</strong> Wait for the operator to reply with the redacted statement, then run the audit and return the receipt.</p>`
      ),
    ]);

    const emailSent = leadEmail.status === 'fulfilled';

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? 'Check your inbox. Reply to Myke with one redacted marketplace statement.'
        : 'Your request is in. Email one redacted marketplace statement to myke@n86.app.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to submit audit request.';
    console.error('Audit intake error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
