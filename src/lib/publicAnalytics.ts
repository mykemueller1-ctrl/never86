'use client';

import { track } from '@vercel/analytics';
import { trackEvent } from '@/lib/track';

/** Site visit events. Vercel Web Analytics must be enabled on the never86-main project or these stay quiet. */
export function trackPublic(event: string, meta?: Record<string, string | number | boolean | null>) {
  trackEvent(event, { meta });
  try {
    track(event, meta);
  } catch {
    // Analytics is optional. A blocked beacon must not break the click.
  }
}
