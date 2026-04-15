import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { sendWelcomeEmail, sendNotification } from '@/lib/email';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const waitlistInput = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().optional(),
  role: z.string().optional(),
});

// POST /api/waitlist — Join the waitlist
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = waitlistInput.parse(body);

    // Insert into waitlist
    const [entry] = await db
      .insert(waitlist)
      .values(data)
      .onConflictDoNothing({ target: waitlist.email })
      .returning();

    if (!entry) {
      return NextResponse.json({ success: true, message: 'Already on the list!' });
    }

    // Send welcome email
    await sendWelcomeEmail(data.email, data.name);

    // Notify Myke
    await sendNotification(
      process.env.OWNER_EMAIL || 'myke@n86.app',
      `New waitlist signup: ${data.name || data.email}`,
      `<strong>${data.name || 'Someone'}</strong> just joined the Never 86'd waitlist.<br/><br/>
       Email: ${data.email}<br/>
       ${data.restaurantName ? `Restaurant: ${data.restaurantName}<br/>` : ''}
       ${data.role ? `Role: ${data.role}` : ''}`
    );

    // Mark welcome email as sent
    await db
      .update(waitlist)
      .set({ welcomeEmailSent: true })
      .where(eq(waitlist.id, entry.id));

    return NextResponse.json({ success: true, message: 'You\'re on the list!' });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ success: true, message: 'Already on the list!' });
    }
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 400 }
    );
  }
}
