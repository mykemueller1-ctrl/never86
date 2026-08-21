export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(process.env.VERCEL_GIT_COMMIT_SHA ?? 'local', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
