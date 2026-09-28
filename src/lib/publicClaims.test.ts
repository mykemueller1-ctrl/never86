import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import robots from '../app/robots';
import { PUBLIC_FAQ } from './publicFaq';

const BANNED = [
  /\$8\.3M/,
  /\$1\.81M/,
  /\$15\.72M/,
  /545,677/,
  /28-location/,
  /16-unit/,
  /\$1,043,797/,
  /\$787\.55/,
  /\$7,646\.86/,
  /\$103\.6K/,
  /\$199\/mo/,
  /OG-IMAGE-PLACEHOLDER/,
];

const PUBLIC_FILES = [
  'src/app/story/page.tsx',
  'src/app/case/walked-the-number-back/page.tsx',
  'src/app/press/page.tsx',
  'src/app/audit/page.tsx',
  'src/app/agents/page.tsx',
  'src/app/faq/page.tsx',
  'src/app/blog/restaurant-margin-inspection/route.ts',
  'src/app/llms.txt/route.ts',
  'src/components/OwnerHome.tsx',
  'src/components/HumanSiteShell.tsx',
  'src/components/HomePage.tsx',
  'src/lib/roles.ts',
  'src/app/team/page.tsx',
];

describe('public claims stay inside what the site can show', () => {
  it('removes unverified traction figures from public copy', () => {
    const corpus = PUBLIC_FILES.map((path) => readFileSync(resolve(path), 'utf8')).join('\n');
    for (const pattern of BANNED) {
      expect(corpus, pattern.source).not.toMatch(pattern);
    }
  });

  it('keeps the free-seat FAQ answers free of invented prices', () => {
    const cost = PUBLIC_FAQ.find((item) => item.question.includes('cost'));
    expect(cost?.answer).toMatch(/free/i);
    expect(cost?.answer).toMatch(/not finalized/);
    expect(cost?.answer).not.toMatch(/\$\d/);
  });

  it('names the answer-engine crawlers in robots.txt', () => {
    const doc = robots();
    const rules = Array.isArray(doc.rules) ? doc.rules : [doc.rules];
    const agents = rules.flatMap((rule) => {
      const userAgent = rule?.userAgent;
      return Array.isArray(userAgent) ? userAgent : userAgent ? [userAgent] : [];
    });
    for (const bot of ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'OAI-SearchBot']) {
      expect(agents).toContain(bot);
    }
    expect(doc.sitemap).toBe('https://www.never86.ai/sitemap.xml');
  });
});
