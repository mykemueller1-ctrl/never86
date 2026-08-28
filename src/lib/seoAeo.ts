export const WWW = 'https://www.never86.ai';

/** Content date for surfaces sharpened for GitHub issue #122 (GSC indexed 2026-08-21). */
export const AEO_PAGE_LASTMOD = new Date('2026-08-26T17:00:00Z');

/** Unchanged public URLs keep the prior sitemap stamp so crawlers are not lied to. */
export const SITE_LASTMOD = new Date('2026-08-21T05:30:00Z');

export const ISSUE_122_3P_SLUGS = [
  'audit-doordash-fees-without-portal-login',
  'reconcile-doordash-payout-to-bank-deposit',
  'calculate-true-third-party-delivery-cost',
  'restaurant-funded-promotions-delivery-statement',
  'why-pos-sales-and-doordash-statement-do-not-match',
  'compare-doordash-uber-eats-grubhub-like-for-like',
  'best-restaurant-software-for-delivery-fee-audit',
  'what-to-redact-from-restaurant-statement-before-ai-audit',
] as const;

export type Issue122ThreePSlug = (typeof ISSUE_122_3P_SLUGS)[number];

export const HOME_OPERATOR_ANSWERS = [
  {
    href: '/answers/audit-doordash-fees-without-portal-login',
    title: 'Can I audit DoorDash fees without a portal login?',
  },
  {
    href: '/answers/reconcile-doordash-payout-to-bank-deposit',
    title: 'How do I reconcile a DoorDash payout to the bank?',
  },
  {
    href: '/answers/calculate-true-third-party-delivery-cost',
    title: 'What is the true cost of third-party delivery?',
  },
] as const;

export const HOME_OPERATOR_AGENTS = [
  {
    href: '/agents/void-hunter',
    title: 'Void Hunter',
    line: 'Who is above this store’s own void band?',
  },
  {
    href: '/agents/labor-leak',
    title: 'Labor Leak',
    line: 'Where did overtime drift before payroll closed?',
  },
  {
    href: '/agents/vendor-drift',
    title: 'Vendor Drift',
    line: 'Which invoice SKU silently crept this week?',
  },
] as const;

/** Allow public answer/MCP/LLM-shell JSON; then Disallow the rest of /api/. Order matters for first-match crawlers. */
export const ROBOTS_ALLOW = ['/', '/api/answers', '/api/mcp', '/api/llm-shells', '/api/quick-wins'] as const;
export const ROBOTS_DISALLOW = ['/admin/', '/reports/', '/command-center/', '/tools/', '/action-shift/lab', '/api/'] as const;

export function answerCanonicalUrl(slug: string): string {
  return `${WWW}/answers/${slug}`;
}

export function answerSeoTitle(answer: { title: string; question?: string | null }): string {
  const question = (answer.question ?? answer.title).trim();
  return question.includes("Never 86") ? question : `${question} · Never 86'd`;
}

export function answerSeoDescription(answer: { summary?: string | null; answer: string }): string {
  const summary = answer.summary?.trim();
  if (summary && summary.length > 20) return summary;
  const clipped = answer.answer.replace(/\s+/g, ' ').trim().slice(0, 200);
  return clipped.length < answer.answer.trim().length ? `${clipped}…` : clipped;
}

export type FaqJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }>;
};

function visibleFaqItems(answer: {
  title: string;
  question?: string | null;
  answer: string;
  formula?: string | null;
  evidenceBoundary?: string | null;
}): FaqJsonLd['mainEntity'] {
  const name = (answer.question ?? answer.title).trim();
  // FAQ answers must match on-page copy. Summary is metadata-only.
  const body = answer.answer.replace(/\s+/g, ' ').trim();
  const items: FaqJsonLd['mainEntity'] = [
    {
      '@type': 'Question',
      name,
      acceptedAnswer: { '@type': 'Answer', text: body },
    },
  ];
  if (answer.formula) {
    items.push({
      '@type': 'Question',
      name: 'What working formula does this answer use?',
      acceptedAnswer: { '@type': 'Answer', text: answer.formula },
    });
  }
  if (answer.evidenceBoundary) {
    items.push({
      '@type': 'Question',
      name: 'What can this evidence not prove?',
      acceptedAnswer: { '@type': 'Answer', text: answer.evidenceBoundary },
    });
  }
  return items;
}

export function buildAnswerFaqJsonLd(answer: {
  title: string;
  question?: string | null;
  answer: string;
  summary?: string | null;
  formula?: string | null;
  evidenceBoundary?: string | null;
}): FaqJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: visibleFaqItems(answer),
  };
}
