import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/admin/', '/reports/', '/command-center/', '/tools/', '/api/'];
  const allow = ['/', '/api/answers', '/api/mcp', '/api/quick-wins'];
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
    sitemap: 'https://www.never86.ai/sitemap.xml',
    host: 'https://www.never86.ai',
  };
}
