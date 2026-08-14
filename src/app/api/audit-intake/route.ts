import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { captureLead } from '@/lib/leadCapture';
import { sendAuditIntakeEmail, sendNotification } from '@/lib/email';

const auditIntakeInput = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120).optional(),
  restaurantName: z.string().trim().min(1).max(160).optional(),
  platform: z.enum(['DoorDash', 'Uber Eats', 'Grubhub', 'ezCater', 'Other']),
  units: z.union([z.string(), z.number()]).optional(),
  sourcePage: z.string().trim().max(1000).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(160).optional(),
  utmContent: z.string().trim().max(160).optional(),
});

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeSubjectLabel(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
}

export async function POST(req: NextRequest) {
  try {
    const input = auditIntakeInput.parse(await req.json());
    const rawUnits =
      typeof input.units === 'number'
        ? input.units
        : input.units
          ? Number(input.units)
          : Number.NaN;
    const units =
      Number.isFinite(rawUnits) && rawUnits > 0 && rawUnits <= 10000
        ? Math.round(rawUnits)
        : null;

    const sourcePage = input.sourcePage ?? req.headers.get('referer') ?? '/audit';

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
      input.utmSource && `Source: ${escapeHtml(input.utmSource)}`,
      input.utmMedium && `Medium: ${escapeHtml(input.utmMedium)}`,
      input.utmCampaign && `Campaign: ${escapeHtml(input.utmCampaign)}`,
      input.utmContent && `Content: ${escapeHtml(input.utmContent)}`,
    ]
      .filter(Boolean)
      .join('<br/>');

    const subjectLabel = safeSubjectLabel(
      input.restaurantName || input.name || input.email
    );

    const [leadEmail, ownerNotification] = await Promise.allSettled([
      sendAuditIntakeEmail(input.email, input.name),
      sendNotification(
        ownerEmail,
        `Free audit request · ${subjectLabel}`,
        `<p><strong>${escapeHtml(input.name || 'A restaurant operator')}</strong> requested a free ${escapeHtml(input.platform)} audit.</p>
         <p>Email: ${escapeHtml(input.email)}<br/>
         ${input.restaurantName ? `Restaurant: ${escapeHtml(input.restaurantName)}<br/>` : ''}
         ${units ? `Units: ${units}<br/>` : ''}
         Platform: ${escapeHtml(input.platform)}<br/>
         ${sourceDetails ? `${sourceDetails}<br/>` : ''}
         Page: ${escapeHtml(sourcePage)}</p>
         <p><strong>Next move:</strong> Wait for the operator to reply with the redacted statement, then run the audit and return the receipt.</p>`
      ),
    ]);

    if (ownerNotification.status === 'rejected') {
      console.error('Audit owner notification failed:', ownerNotification.reason);
    }

    const emailSent = leadEmail.status === 'fulfilled';
    if (!emailSent) {
      console.error('Audit intake email failed:', leadEmail.reason);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? 'Check your inbox. Reply to Myke with one redacted marketplace statement.'
        : 'Your request is in. Email one redacted marketplace statement to myke@n86.app.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Check the form and try again.' },
        { status: 400 }
      );
    }

    console.error('Audit intake error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to submit audit request.' },
      { status: 500 }
    );
  }
}
