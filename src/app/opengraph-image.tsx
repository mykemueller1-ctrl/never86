import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "Never 86'd — Month-end is too late. Built by restaurant operators.";
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
          background: '#f4efe6',
          color: '#171717',
          fontFamily: 'Georgia, Times New Roman, serif',
        }}
      >
        <div
          style={{
            width: 735,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '58px 56px 48px',
            backgroundImage:
              'linear-gradient(rgba(90,80,68,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(90,80,68,0.07) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 58,
                height: 58,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: '#005de8',
                color: 'white',
                fontSize: 34,
                fontStyle: 'italic',
                boxShadow: '5px 5px 0 #17304c',
              }}
            >
              N
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 31, letterSpacing: '-0.02em' }}>
                Never 86&apos;d <span style={{ color: '#5f574f', fontStyle: 'italic' }}>for operators</span>
              </div>
              <div
                style={{
                  marginTop: 5,
                  color: '#005de8',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Fort Dodge, Iowa · built inside the work
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 83, lineHeight: 0.92, letterSpacing: '-0.055em' }}>
              Month-end is
            </div>
            <div style={{ marginTop: 10, color: '#005de8', fontSize: 96, fontStyle: 'italic', lineHeight: 0.9, letterSpacing: '-0.055em' }}>
              too late.
            </div>
            <div
              style={{
                marginTop: 30,
                maxWidth: 590,
                fontFamily: 'Arial, sans-serif',
                fontSize: 22,
                lineHeight: 1.35,
                color: '#514b43',
              }}
            >
              One DoorDash statement. The documented cost, the payout bridge, and the missing proof—plain English, source attached.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bfb3a5', paddingTop: 18, fontFamily: 'Arial, sans-serif', fontSize: 16, color: '#615950' }}>
            <span>Restaurant work first · software second</span>
            <span style={{ color: '#005de8', fontWeight: 700 }}>never86.ai</span>
          </div>
        </div>

        <div style={{ position: 'relative', width: 465, height: '100%', display: 'flex', overflow: 'hidden', background: '#17304c' }}>
          <img
            src="https://www.never86.ai/field/myke-kitchen.jpg"
            alt=""
            width="465"
            height="630"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 78%' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,20,30,0.68), transparent 45%)' }} />
          <div style={{ position: 'absolute', left: 28, right: 28, bottom: 27, color: 'white', fontFamily: 'Arial, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            Myke · Community Tap kitchen · Fort Dodge
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
