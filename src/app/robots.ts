import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/admin/', '/reports/', '/command-center/', '/tools/', '/api/', '/action-shift/lab', '/action-shift/setup'];
  const allow = ['/', '/api/answers', '/api/mcp', '/api/llm-shells', '/api/quick-wins'];
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
