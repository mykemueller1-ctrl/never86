import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { waitlist } from '@/db/schema';
import { sendWelcomeEmail, sendNotification } from '@/lib/email';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/security';

const waitlistInput = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().optional(),
  role: z.string().optional(),
});

// POST /api/waitlist — Join the waitlist
export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 'waitlist-post', 10, 60_000);
  if (rateLimit) return rateLimit;

  try {
    const db = getDb();
    const body = await req.json();
    const data = waitlistInput.parse(body);
    const escapedName = escapeHtml(data.name || '');
    const escapedEmail = escapeHtml(data.email);
    const escapedRestaurant = escapeHtml(data.restaurantName || '');
    const escapedRole = escapeHtml(data.role || '');

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
      `New waitlist signup: ${escapedName || escapedEmail}`,
      `<strong>${escapedName || 'Someone'}</strong> just joined the Never 86'd waitlist.<br/><br/>
       Email: ${escapedEmail}<br/>
       ${escapedRestaurant ? `Restaurant: ${escapedRestaurant}<br/>` : ''}
       ${escapedRole ? `Role: ${escapedRole}` : ''}`
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
      { error: 'Something went wrong' },
      { status: 400 }
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
