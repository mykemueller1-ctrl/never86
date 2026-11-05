import { NextResponse } from 'next/server';
import { OAUTH_SCOPES } from '../../../../../../lib/orchestratorOAuth';

export const dynamic = 'force-dynamic';

/**
 * RFC 9728 path-specific Protected Resource Metadata for the private
 * orchestrator MCP only. Kept off the host root so OpenAI / public MCP
 * clients do not treat https://www.never86.ai/api/mcp as OAuth-protected.
 */
export async function GET() {
  return NextResponse.json({
    resource: 'https://www.never86.ai/api/orchestrator/mcp',
    authorization_servers: ['https://www.never86.ai'],
    bearer_methods_supported: ['header'],
    scopes_supported: OAUTH_SCOPES,
  });
}
