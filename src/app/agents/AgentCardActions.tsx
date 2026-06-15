'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/track';

// Client island for the per-card CTAs on /agents. /agents/page.tsx
// stays a server component (SEO + AI Overviews need the agent
// catalog fully SSR'd). Only the two per-card links flip to client
// so we can attach onClick telemetry.
//
// Each card emits two distinct events when clicked:
//   agents_card_read_more  · slug + agentName
//   agents_card_try        · slug + agentName + tryHref
//
// Together these answer: which agents are pulling click-through
// from /agents? Use the result to choose which 1–2 to feature on
// the homepage hero or in outreach decks.

export function AgentCardActions({
  slug,
  agentName,
  tryHref,
}: {
  slug: string;
  agentName: string;
  tryHref: string;
}) {
  return (
    <div className="flex gap-3 mt-5 flex-wrap">
      <Link
        href={`/agents/${slug}`}
        onClick={() => trackEvent('agents_card_read_more', { meta: { slug, agentName } })}
        className="text-[13px] inline-flex items-center gap-1 hover:gap-2 transition-all"
        style={{ color: '#0066ff' }}
      >
        Read more <span aria-hidden>→</span>
      </Link>
      <Link
        href={tryHref}
        onClick={() => trackEvent('agents_card_try', { meta: { slug, agentName, tryHref } })}
        className="text-[13px] inline-flex items-center gap-1 hover:gap-2 transition-all"
        style={{ color: '#86868b' }}
      >
        Try {agentName} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
