'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/track';

// Small client island for /agents header nav. The page is a server
// component (one of our most-indexed assets for SEO + AI Overviews
// — we don't want to flip the whole page to 'use client' just to
// attach onClick handlers). Only the two interactive links become
// client; the rest of the page renders server-side.

export function AgentsNavLinks() {
  return (
    <nav className="flex items-center gap-2 text-[13px]">
      <Link
        href="/"
        onClick={() => trackEvent('agents_nav_click', { meta: { target: '/', label: 'Home' } })}
        className="compass-pill"
      >
        <span className="avatar">H</span><span>Home</span>
      </Link>
      <Link
        href="/trial"
        onClick={() => trackEvent('agents_nav_click', { meta: { target: '/trial', label: 'Try free' } })}
        className="btn-primary"
        style={{ background: '#0066ff' }}
      >
        Try free →
      </Link>
    </nav>
  );
}
