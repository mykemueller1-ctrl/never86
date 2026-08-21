'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/track';

// Small client island for /install header nav. Server component
// page.tsx stays SSR'd so crawlers + cross-session verifiers can
// fetch the hero + capability cards without JS — we only flip the
// two interactive nav links to client to attach telemetry.
//
// "Open operator app →" is the LITERAL bridge to Chase's CTAP
// operator app. Anyone clicking it is the hottest signal we have
// short of a form submit. Track it.

export function InstallNavLinks() {
  return (
    <nav className="flex items-center gap-2 text-[13px]">
      <Link
        href="/trial"
        onClick={() => trackEvent('install_nav_click', { meta: { target: '/trial', label: 'Back to trial' } })}
        className="compass-pill"
      >
        <span className="avatar">T</span><span>Back to trial</span>
      </Link>
      <a
        href="https://never86d-ctap.onrender.com"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('install_open_operator_app', { meta: { target: 'https://never86d-ctap.onrender.com' } })}
        className="btn-primary"
        style={{ background: '#0066ff' }}
      >
        Open operator app →
      </a>
    </nav>
  );
}
