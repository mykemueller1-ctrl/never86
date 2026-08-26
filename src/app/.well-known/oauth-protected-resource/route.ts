import { NextResponse } from 'next/server';
import { OAUTH_SCOPES } from '../../../lib/orchestratorOAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    resource: 'https://www.never86.ai/api/orchestrator/mcp',
    authorization_servers: ['https://www.never86.ai'],
    bearer_methods_supported: ['header'],
    scopes_supported: OAUTH_SCOPES,
  });
}

