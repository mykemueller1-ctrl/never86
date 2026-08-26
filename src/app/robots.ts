import type { MetadataRoute } from 'next';
import { ROBOTS_ALLOW, ROBOTS_DISALLOW, WWW } from '@/lib/seoAeo';

export default function robots(): MetadataRoute.Robots {
  // Allow public JSON first, then Disallow /api/. First-match crawlers honor order;
  // Google still uses the longest path, so /api/answers wins over /api/.
  const allow = [...ROBOTS_ALLOW];
  const disallow = [...ROBOTS_DISALLOW];
  return {
    rules: [
      {
        userAgent: '*',
        allow,
        disallow,
      },
      // Named AI crawlers can read the public evidence surface but not private
      // operator, admin, command-center, or upload routes.
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'OAI-SearchBot', 'Applebot-Extended'],
        allow,
        disallow,
      },
    ],
    sitemap: `${WWW}/sitemap.xml`,
    host: WWW,
  };
}
