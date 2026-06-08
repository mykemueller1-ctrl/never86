import type { MetadataRoute } from 'next';
import { listPublishedAnswers } from '@/lib/answersDb';
import { AGENT_SPECS } from '@/lib/agentSpecs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BASE = 'https://never86.ai';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let answers: { slug: string; updatedAt: string }[] = [];
  try {
    const rows = await listPublishedAnswers();
    answers = rows.map((a) => ({ slug: a.slug, updatedAt: a.updatedAt }));
  } catch {}

  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/for`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/for/ceo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/cfo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/coo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/cto`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/chef`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/for/owner`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
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
    { url: `${BASE}/onboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/operators`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/answers`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/press`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/mcp`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/people`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/story`, lastModified: now, changeFrequency: 'monthly', priority: 0.92 },
    { url: `${BASE}/case/walked-the-number-back`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  ];

  const dynamicEntries: MetadataRoute.Sitemap = answers.map((a) => ({
    url: `${BASE}/answers/${a.slug}`,
    lastModified: a.updatedAt ? new Date(a.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const agentEntries: MetadataRoute.Sitemap = AGENT_SPECS.map((a) => ({
    url: `${BASE}/agents/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.92,
  }));

  return [...fixed, ...agentEntries, ...dynamicEntries];
}
