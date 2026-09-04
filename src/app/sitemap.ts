import type { MetadataRoute } from 'next';
import { listPublishedAnswers } from '@/lib/answersDb';
import { AGENT_SPECS } from '@/lib/agentSpecs';
import { POS_SPECS } from '@/lib/posSpecs';
import { AEO_PAGE_LASTMOD, ISSUE_122_3P_SLUGS, SITE_LASTMOD, WWW } from '@/lib/seoAeo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BASE = WWW;
const AEO_PATHS = new Set<string>(['/', '/audit', '/for/owner', '/answers', ...ISSUE_122_3P_SLUGS.map((slug) => `/answers/${slug}`)]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let answers: { slug: string; updatedAt: string }[] = [];
  try {
    const rows = await listPublishedAnswers();
    answers = rows.map((a) => ({ slug: a.slug, updatedAt: a.updatedAt }));
  } catch {}

  // Fixed content release date: request-time timestamps mislead crawlers into
  // treating every URL as newly changed on every sitemap fetch.
  const now = SITE_LASTMOD;
  const stamp = (path: string) => (AEO_PATHS.has(path) ? AEO_PAGE_LASTMOD : now);

  const fixed: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: stamp('/'), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/audit`, lastModified: stamp('/audit'), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/audit/payout-mismatch`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/audit/promotions-ads`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/audit/refunds-adjustments`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/audit/high-delivery-cost`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/for`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/for/ceo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/cfo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/coo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/cto`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/chef`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/owner`, lastModified: stamp('/for/owner'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/manager`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/crew`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/demo/void-hunter`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/demo/3p-fee-finder`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/demo/labor-leak`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/demo/tip-variance`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/demo/catering-leak`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/demo/shift-pulse`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/demo/rate-card-audit`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/agents`,  lastModified: now, changeFrequency: 'weekly', priority: 0.97 },
    { url: `${BASE}/trial`,   lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/connect`, lastModified: now, changeFrequency: 'weekly', priority: 0.98 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/install`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/onboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/operator`, lastModified: now, changeFrequency: 'weekly', priority: 0.96 },
    { url: `${BASE}/operators`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/answers`, lastModified: stamp('/answers'), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/delivery-marketplace-reconciliation`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/evidence-standard`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/research/3p-operator-signal-august-2026`, lastModified: now, changeFrequency: 'monthly', priority: 0.92 },
    { url: `${BASE}/press`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/mcp`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/llm-shells`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/people`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/story`, lastModified: now, changeFrequency: 'monthly', priority: 0.92 },
    { url: `${BASE}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/case/walked-the-number-back`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  ];

  const dynamicEntries: MetadataRoute.Sitemap = answers.map((a) => ({
    url: `${BASE}/answers/${a.slug}`,
    lastModified: a.updatedAt ? new Date(a.updatedAt) : stamp(`/answers/${a.slug}`),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const agentEntries: MetadataRoute.Sitemap = AGENT_SPECS.map((a) => ({
    url: `${BASE}/agents/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.92,
  }));

  const posEntries: MetadataRoute.Sitemap = Object.keys(POS_SPECS).map((slug) => ({
    url: `${BASE}/connect/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...fixed, ...agentEntries, ...posEntries, ...dynamicEntries];
}
