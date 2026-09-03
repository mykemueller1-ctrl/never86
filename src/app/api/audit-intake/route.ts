import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  deliverPublicLead,
  publicLeadHttpStatus,
} from '@/lib/publicLeadIntake';

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

    const result = await deliverPublicLead({
      kind: 'audit_request',
      email: input.email,
      name: input.name,
      restaurantName: input.restaurantName,
      units,
      role: 'Restaurant operator',
      sourcePage,
      platform: input.platform,
      utm: {
        source: input.utmSource,
        medium: input.utmMedium,
        campaign: input.utmCampaign,
        content: input.utmContent,
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, emailSent: false, error: result.error, code: result.code },
        { status: publicLeadHttpStatus(result) },
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: result.operatorEmailed,
      ownerNotified: result.ownerNotified,
      persisted: result.persisted,
      message: result.confirmation,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Check the form and try again.' },
        { status: 400 },
      );
    }

    console.error('Audit intake error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to submit audit request.' },
      { status: 500 },
    );
  }
}
