import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { sendWelcomeEmail, sendNotification } from '@/lib/email';
import { captureLead } from '@/lib/leadCapture';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

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

    // 1) Mirror into admin.leads + queue 24h and 7d follow-ups. Safe to call
    //    even if the Supabase pooler is unreachable — falls back without
    //    breaking the form flow.
    await captureLead({
      email: data.email,
      name: data.name,
      restaurantName: data.restaurantName,
      units: unitsNum,
      role: data.role,
      sourcePage,
      requestedAgent: data.agentRequested,
      posType: data.posType,
      dataPreference: data.dataPreference,
      interestedAgent: data.interestedAgent,
      referrer: req.headers.get('referer') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    });

    // 2) Primary waitlist insert (Neon)
    const [entry] = await db
      .insert(waitlist)
      .values({
        email: data.email,
        name: data.name,
        restaurantName: data.restaurantName,
        role: data.role,
      })
      .onConflictDoNothing({ target: waitlist.email })
      .returning();

    if (!entry) {
      return NextResponse.json({ success: true, message: 'Already on the list.' });
    }

    // 3) Welcome email to the lead
    await sendWelcomeEmail(data.email, data.name);

    // 4) Notify Myke — agent unlock requests jump the queue
    const agentLine = data.agentRequested
      ? `⚡ <strong>UNLOCK REQUEST · ${data.agentRequested}</strong><br/>`
      : '';
    await sendNotification(
      process.env.OWNER_EMAIL || 'myke@n86.app',
      data.agentRequested
        ? `⚡ ${data.agentRequested} unlock · ${data.name || data.email}`
        : data.interestedAgent
        ? `🚪 Self-onboard · ${data.name || data.email} · ${data.interestedAgent}`
        : `New lead · ${data.name || data.email}${data.restaurantName ? ' · ' + data.restaurantName : ''}`,
      `<p>${agentLine}<strong>${data.name || 'Someone'}</strong> just hit the form.</p>
       <p>Email: ${data.email}<br/>
       ${data.restaurantName ? `Restaurant: ${data.restaurantName}<br/>` : ''}
       ${unitsNum ? `Units: ${unitsNum}<br/>` : ''}
       ${data.role ? `Role: ${data.role}<br/>` : ''}
       ${data.posType ? `POS: ${data.posType}<br/>` : ''}
       ${data.interestedAgent ? `Wants agent: ${data.interestedAgent}<br/>` : ''}
       ${data.dataPreference ? `Data-share: ${data.dataPreference}<br/>` : ''}
       ${sourcePage ? `From: ${sourcePage}` : ''}</p>
       <p>Stored in admin.leads · 24h + 7d follow-ups queued.</p>`
    );

    await db
      .update(waitlist)
      .set({ welcomeEmailSent: true })
      .where(eq(waitlist.id, entry.id));

    return NextResponse.json({ success: true, message: "You're on the list." });
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string };
    if (e.code === '23505') {
      return NextResponse.json({ success: true, message: 'Already on the list.' });
    }
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: e.message || 'Something went wrong' },
      { status: 400 }
    );
  }
}
