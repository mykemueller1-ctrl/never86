'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { trackPublic } from '@/lib/publicAnalytics';

type FunnelLinkProps = ComponentProps<typeof Link> & {
  event: 'cta_try' | 'onboard_start' | 'signup_complete';
  children: ReactNode;
};

export function FunnelLink({ event, href, children, onClick, ...rest }: FunnelLinkProps) {
  return (
    <Link
      href={href}
      {...rest}
      onClick={(eventClick) => {
        onClick?.(eventClick);
        trackPublic(event, { href: typeof href === 'string' ? href : '' });
      }}
    >
      {children}
    </Link>
  );
}
