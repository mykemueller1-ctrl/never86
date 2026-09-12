import type { MetadataRoute } from 'next';
import { ROBOTS_ALLOW, ROBOTS_DISALLOW, WWW } from '@/lib/seoAeo';

export default function robots(): MetadataRoute.Robots {
  // Public evidence, answers, and the MCP description are discoverable.
  // Private operator/admin/upload routes remain blocked for every crawler.
  const allow = [...ROBOTS_ALLOW];
  const disallow = [...ROBOTS_DISALLOW];

  return {
    rules: [
      {
        userAgent: '*',
        allow,
        disallow,
      },
      // Search / user-retrieval agents. Keep these explicit so Never86'd can
      // be discovered and cited in ChatGPT, Claude, and Perplexity answers.
      {
        userAgent: [
          'OAI-SearchBot',
          'Claude-SearchBot',
          'Claude-User',
          'PerplexityBot',
          'Perplexity-User',
        ],
        allow,
        disallow,
      },
      // Existing public-content training/product posture is unchanged. These
      // agents still receive only the same public surface and never private routes.
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'],
        allow,
        disallow,
      },
    ],
    sitemap: `${WWW}/sitemap.xml`,
    host: WWW,
  };
}
