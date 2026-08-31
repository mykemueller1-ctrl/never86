import { NextResponse } from 'next/server';
import { persistHealthBody } from '@/lib/persistHealth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Safe persist health. Returns whether DATABASE_URL is present.
 * Boolean only. Never echoes the URL. Never pings Neon. Never enables staff login.
 */
export async function GET() {
  return NextResponse.json(persistHealthBody());
}
