'use client';

import { useEffect } from 'react';

// Fire-and-forget visitor event beacon. Drops a session-id cookie (90-day)
// so we can correlate multi-page visits. Never blocks render.
export function Track({
  eventType,
  agentName,
  audience,
}: {
  eventType: 'agent_view' | 'role_view' | 'page_view';
  agentName?: string;
  audience?: string;
}) {
  useEffect(() => {
    try {
      // Pull or mint a session id (sessionStorage = browser tab; localStorage = device).
      let sid = '';
      try {
        sid = localStorage.getItem('n86_sid') || '';
        if (!sid) {
          sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
          localStorage.setItem('n86_sid', sid);
        }
      } catch {}
      const payload = {
        sessionId: sid || undefined,
        eventType,
        pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        agentName,
        audience,
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      // Prefer sendBeacon — survives page navigation.
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', blob);
      } else {
        fetch('/api/track', { method: 'POST', body: blob, keepalive: true }).catch(() => {});
      }
    } catch {}
  }, [eventType, agentName, audience]);
  return null;
}
