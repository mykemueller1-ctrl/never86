import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const challenge = process.env.OPENAI_APPS_CHALLENGE?.trim();
  if (!challenge) {
    return new NextResponse('Challenge token is not configured.', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  return new NextResponse(challenge, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
