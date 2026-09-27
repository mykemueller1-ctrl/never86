'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/** Free-tier Vercel Web Analytics and Speed Insights. No PostHog in this repo. */
export function SiteAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
