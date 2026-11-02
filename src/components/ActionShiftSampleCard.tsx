'use client';

import { FormEvent, useState } from 'react';
import {
  ACTION_SHIFT_SWARM_PROMPT,
  FREE_SEAT_COPY,
  GM_MORNING_LINES,
  GM_SAMPLE_MATH,
  googleOneTapEnabled,
} from '@/lib/actionShiftSwarm';

/**
 * Public sample first. No login wall. Soft free-seat claim after the sample.
 * "Send it" is a human tap; the swarm hand-off only copies the locked prompt, never auto-sends.
 */
export function ActionShiftSampleCard() {
  const [sent, setSent] = useState(false);
  const [handed, setHanded] = useState<'idle' | 'copied' | 'missing'>('idle');
  const [email, setEmail] = useState('');
  const [store, setStore] = useState('');
  const [claim, setClaim] = useState<'idle' | 'loading' | 'sent' | 'missing' | 'error'>('idle');
  const [claimMsg, setClaimMsg] = useState('');
  const google = googleOneTapEnabled();

  async function handToSwarm() {
    try {
      await navigator.clipboard.writeText(ACTION_SHIFT_SWARM_PROMPT);
      setHanded('copied');
    } catch {
      setHanded('missing');
    }
  }

  async function onClaim(event: FormEvent) {
    event.preventDefault();
    setClaim('loading');
    try {
      const res = await fetch('/api/onboard/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          restaurantName: store.trim() || 'My restaurant',
          storeName: store.trim() || 'My restaurant',
          sourcePage: '/action-shift#sample',
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; honesty?: string };
      if (!res.ok || !data.success) {
        setClaim(data.honesty === 'Missing' ? 'missing' : 'error');
        setClaimMsg(data.error || 'Could not send the link.');
        return;
      }
      setClaim('sent');
      setClaimMsg('Check your inbox for the link.');
    } catch {
      setClaim('missing');
      setClaimMsg('Could not reach the seat service. Missing.');
    }
  }

  return (
    <section id="sample" data-testid="action-shift-sample-card" style={{ margin: '0 0 24px' }}>
      <p role="status" style={{ fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', background: '#fff6e4', color: '#8a5a00', border: '1px solid #e2c48a', borderRadius: 8, padding: '6px 10px', display: 'inline-block' }}>
        SAMPLE · not your store · not money recovered
      </p>
      <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: '#fff', color: '#15120f', border: '1px solid #d9d0c7', maxWidth: 520 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b625c' }}>From your GM · 6:42 AM · SAMPLE</p>
        {GM_MORNING_LINES.map((line) => (
          <p key={line} style={{ margin: '0 0 4px', fontSize: 17 }}>{line}</p>
        ))}
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Show the math</summary>
          <ul style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
            {GM_SAMPLE_MATH.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </details>
        {!sent ? (
          <button type="button" onClick={() => setSent(true)} style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, fontWeight: 800, background: '#15120f', color: '#fff' }}>
            Send it
          </button>
        ) : (
          <div style={{ marginTop: 12 }}>
            <p style={{ margin: 0 }}>Sent to your GM (sample). You tapped it. Nothing goes out on its own.</p>
            <button type="button" onClick={handToSwarm} style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid #15120f' }}>
              Hand to Action Shift swarm
            </button>
            {handed === 'copied' ? <p style={{ fontSize: 13 }}>Prompt copied. Paste it where your swarm runs. You still tap send.</p> : null}
            {handed === 'missing' ? (
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{ACTION_SHIFT_SWARM_PROMPT}</pre>
            ) : null}
          </div>
        )}
      </div>
      <form onSubmit={onClaim} style={{ marginTop: 16, maxWidth: 520 }}>
        <p style={{ fontWeight: 700, margin: '0 0 6px' }}>{FREE_SEAT_COPY}</p>
        {google ? <div id="g_id_onload" data-testid="google-one-tap" /> : null}
        <input type="email" required placeholder="you@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" style={{ padding: 8, marginRight: 6, color: '#15120f' }} />
        <input placeholder="Store name (optional)" value={store} onChange={(e) => setStore(e.target.value)} aria-label="Store name" style={{ padding: 8, marginRight: 6, color: '#15120f' }} />
        <button type="submit" disabled={claim === 'loading'} style={{ padding: '8px 14px', borderRadius: 8, fontWeight: 700 }}>
          Claim my free seat
        </button>
        {claimMsg ? <p role="status" style={{ fontSize: 13 }}>{claim === 'missing' ? `Missing: ${claimMsg}` : claimMsg}</p> : null}
      </form>
    </section>
  );
}
