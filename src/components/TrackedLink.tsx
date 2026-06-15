'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { trackEvent } from '@/lib/track';

// Generic client wrapper around next/link with telemetry. Use from
// either server or client components — Next.js auto-promotes this
// to a client island only where it's used, so importing TrackedLink
// in a server-rendered page.tsx doesn't disable SSR for the rest
// of the tree.
//
// Pattern:
//   <TrackedLink href="/trial" event="agents_hero_cta_click"
//                meta={{ label: '60 minutes free' }}>
//     60 minutes free · drop a CSV →
//   </TrackedLink>
//
// Optional: `external` flag flips to plain <a> with target=_blank
// + rel="noopener noreferrer" — handy for outbound links to the
// operator app, mailto, etc.

type TrackedLinkProps = Omit<ComponentProps<typeof Link>, 'onClick'> & {
  event: string;
  meta?: Record<string, unknown>;
  external?: boolean;
  children: ReactNode;
};

export function TrackedLink({
  event,
  meta,
  external = false,
  children,
  href,
  ...rest
}: TrackedLinkProps) {
  const onClick = () => trackEvent(event, { meta });

  if (external) {
    // Plain anchor for cross-origin / mailto so the browser doesn't
    // try to client-route. Spread the rest minus Link-only props.
    const { prefetch: _p, replace: _r, scroll: _s, shallow: _sh, ...anchorProps } = rest as Record<string, unknown>;
    void _p; void _r; void _s; void _sh;
    return (
      <a
        href={typeof href === 'string' ? href : String(href)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        {...(anchorProps as Record<string, unknown>)}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
