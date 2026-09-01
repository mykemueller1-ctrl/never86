export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.OPENAI_APPS_CHALLENGE?.trim();
  if (!token) {
    return new Response('Challenge token not configured.', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  // OpenAI domain verification requires the challenge value exactly as plain text.
  return new Response(token, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
