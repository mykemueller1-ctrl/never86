import { NextResponse } from 'next/server';
import { getInstallMatrix } from '@/lib/llmShells';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getInstallMatrix(), {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
