// Client-side ad-hoc event beacon. Mirror of the <Track> component for
// firing events outside of mount (clicks, drops, completions, errors).
// Never blocks render. sendBeacon when available so the call survives
// navigation.

export function trackEvent(
  eventType: string,
  opts?: {
    pagePath?: string;
    agentName?: string;
    audience?: string;
    meta?: Record<string, unknown>;
  }
) {
  if (typeof window === 'undefined') return;
  try {
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
      pagePath: opts?.pagePath ?? window.location.pathname,
      agentName: opts?.agentName,
      audience: opts?.audience,
      meta: opts?.meta,
    };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', blob);
    } else {
      fetch('/api/track', { method: 'POST', body: blob, keepalive: true }).catch(() => {});
    }
  } catch {}
}
