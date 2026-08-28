import { NextResponse } from 'next/server';
import { getLlmShell, isLlmShellProvider } from '@/lib/llmShells';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (!isLlmShellProvider(provider)) {
    return NextResponse.json(
      { error: 'Unknown provider. Use chatgpt, claude, gemini, or grok.' },
      { status: 404 },
    );
  }
  return NextResponse.json(getLlmShell(provider), {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
