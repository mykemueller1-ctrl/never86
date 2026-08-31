import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  deliverPublicLead,
  publicLeadHttpStatus,
} from '@/lib/publicLeadIntake';

const waitlistInput = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().optional(),
  units: z.union([z.string(), z.number()]).optional(),
  role: z.string().optional(),
  sourcePage: z.string().optional(),
  agentRequested: z.string().optional(),
  posType: z.string().optional(),
  dataPreference: z.string().optional(),
  interestedAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = waitlistInput.parse(body);
    const unitsNum = typeof data.units === 'number' ? data.units : data.units ? Number(data.units) || null : null;
    const sourcePage = data.sourcePage ?? req.headers.get('referer') ?? undefined;

    const result = await deliverPublicLead({
      kind: 'waitlist',
      email: data.email,
      name: data.name,
      restaurantName: data.restaurantName,
      units: unitsNum,
      role: data.role,
      sourcePage,
      agentRequested: data.agentRequested,
      interestedAgent: data.interestedAgent,
      posType: data.posType,
      dataPreference: data.dataPreference,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
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
    const e = error as { code?: string; message?: string };
    if (e.code === '23505') {
      return NextResponse.json({ success: true, message: 'Already on the list.' });
    }
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { success: false, error: e.message || 'Something went wrong' },
      { status: 400 },
    );
  }
}
