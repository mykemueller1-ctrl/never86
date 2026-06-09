import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request) {
  const raw = Number(new URL(req.url).searchParams.get('size'));
  const size = Math.min(2048, Math.max(64, Number.isFinite(raw) && raw > 0 ? raw : 1024));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0066ff 0%, #003bb5 100%)',
          color: '#ffffff',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: Math.round(size * 0.58),
          lineHeight: 1,
        }}
      >
        N
      </div>
    ),
    { width: size, height: size }
  );
}
