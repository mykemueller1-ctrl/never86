'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/track';

const DISCOVERY_SOURCES = [
  'chatgpt.com',
  'perplexity.ai',
  'google.com',
  'bing.com',
  'copilot.microsoft.com',
  'claude.ai',
] as const;

export function DiscoveryReferralTracker() {
  const pathname = usePathname();
  const lastTracked = useRef('');

  useEffect(() => {
    if (!document.referrer) return;
    let referrerHost = '';
    try {
      referrerHost = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return;
    }

    const source = DISCOVERY_SOURCES.find((candidate) => referrerHost === candidate || referrerHost.endsWith(`.${candidate}`));
    if (!source) return;

    const key = `${pathname}:${source}`;
    if (lastTracked.current === key) return;
    lastTracked.current = key;
    trackEvent('discovery_referral', { pagePath: pathname, meta: { source } });
  }, [pathname]);

  return null;
}
