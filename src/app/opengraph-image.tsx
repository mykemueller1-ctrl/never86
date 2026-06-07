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
          padding: '70px',
          background: '#000000',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          backgroundImage: 'linear-gradient(180deg, #050505 0%, #000000 100%)',
        }}
      >
        {/* Top brand band */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(100deg, #0066ff 0%, #003bb5 100%)',
          }}
        />

        {/* Brand mark + eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #0066ff, #003bb5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 36,
              fontStyle: 'italic',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            N
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 500,
                fontSize: 32,
                color: '#ffffff',
                letterSpacing: '-0.018em',
                lineHeight: 1,
              }}
            >
              <span>Never 86&apos;d</span>
              <span
                style={{
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                for operators
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#0066ff',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              — Operator OS · 8 agents · source-tagged
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 500,
            fontSize: 88,
            lineHeight: 1.04,
            letterSpacing: '-0.022em',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
            <span>Find the leak.</span>
            <span style={{ color: '#0066ff', fontStyle: 'italic' }}>Name who</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
            <span>owns it.</span>
            <span style={{ color: '#0066ff', fontStyle: 'italic' }}>Keep</span>
            <span>the receipt.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#86868b',
            fontSize: 20,
            letterSpacing: '-0.011em',
            borderTop: '1px solid #1f1f1f',
            paddingTop: 24,
          }}
        >
          <div>$1.81M recovered · 545,677 orders · built by operators</div>
          <div
            style={{
              color: '#ffffff',
              fontWeight: 500,
              fontFamily: 'Georgia, serif',
              fontSize: 22,
            }}
          >
            never86.ai
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
