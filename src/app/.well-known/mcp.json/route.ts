import { NextResponse } from 'next/server';
import { NEVER86_MCP_DISCOVERY } from '@/lib/mcpDiscovery';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(NEVER86_MCP_DISCOVERY, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
