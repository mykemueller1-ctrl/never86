import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "Never 86'd — Find the leak. Name who owns it. Keep the receipt.";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#fbfbfd',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #d49a0e, #a3760a)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '0.05em',
            }}
          >
            N86
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 28,
              color: '#1d1d1f',
              letterSpacing: '-0.022em',
            }}
          >
            Never 86&apos;d
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#1d1d1f',
          }}
        >
          <div>Find the leak.</div>
          <div>Name who owns it.</div>
          <div>Keep the receipt.</div>
        </div>

        {/* Footer line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#86868b',
            fontSize: 22,
            letterSpacing: '-0.011em',
          }}
        >
          <div>Restaurant financial intelligence · built by an operator.</div>
          <div style={{ color: '#1d1d1f', fontWeight: 500 }}>never86.ai</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
