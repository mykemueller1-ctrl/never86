import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { OPERATOR_ANSWERS } from './operatorAnswers';
import { ROLES, roleSeoDescription, roleSeoTitle } from './roles';
import {
  AEO_PAGE_LASTMOD,
  HOME_OPERATOR_AGENTS,
  HOME_OPERATOR_ANSWERS,
  ISSUE_122_3P_SLUGS,
  ROBOTS_ALLOW,
  ROBOTS_DISALLOW,
  WWW,
  answerCanonicalUrl,
  answerSeoDescription,
  answerSeoTitle,
  buildAnswerFaqJsonLd,
} from './seoAeo';

const EIGHT = ISSUE_122_3P_SLUGS.map((slug) => {
  const answer = OPERATOR_ANSWERS.find((row) => row.slug === slug);
  if (!answer) throw new Error(`missing ${slug}`);
  return answer;
});

describe('issue #122 3P AEO', () => {
  it('sharpens eight existing slugs without duplicating pages', () => {
    expect(ISSUE_122_3P_SLUGS).toHaveLength(8);
    expect(new Set(ISSUE_122_3P_SLUGS).size).toBe(8);
    expect(HOME_OPERATOR_ANSWERS).toHaveLength(3);
    expect(HOME_OPERATOR_AGENTS).toHaveLength(3);
    for (const slug of ISSUE_122_3P_SLUGS) {
      expect(OPERATOR_ANSWERS.filter((answer) => answer.slug === slug)).toHaveLength(1);
    }
  });

  it('uses a unique operator question as title and a unique description', () => {
    const titles = EIGHT.map((answer) => answerSeoTitle(answer));
    const descriptions = EIGHT.map((answer) => answerSeoDescription(answer));
    expect(new Set(titles).size).toBe(8);
    expect(new Set(descriptions).size).toBe(8);
    for (const answer of EIGHT) {
      expect(answer.title.endsWith('?') || (answer.question ?? '').endsWith('?')).toBe(true);
      expect(answerSeoTitle(answer)).toContain(answer.question ?? answer.title);
      expect(answerSeoDescription(answer)).toBe(answer.summary);
      expect(answerCanonicalUrl(answer.slug)).toBe(`${WWW}/answers/${answer.slug}`);
      expect(answer.updatedAt.startsWith('2026-08-26')).toBe(true);
    }
  });

  it('emits FAQ JSON-LD that repeats the visible operator question', () => {
    for (const answer of EIGHT) {
      const faq = buildAnswerFaqJsonLd(answer);
      expect(faq['@type']).toBe('FAQPage');
      expect(faq.mainEntity[0]?.name).toBe(answer.question);
      expect(faq.mainEntity[0]?.acceptedAnswer.text).toContain(answer.summary);
      expect(faq.mainEntity.some((item) => item.name.includes('working formula'))).toBe(Boolean(answer.formula));
    }
  });

  it('does not pitch portal passwords, CTap private dollars, or guaranteed recovery', () => {
    const corpus = EIGHT.map((answer) => [answer.title, answer.question, answer.summary, answer.answer, answer.evidenceBoundary].join('\n')).join('\n');
    expect(corpus).not.toMatch(/guaranteed recovery/i);
    expect(corpus).not.toMatch(/we (will )?recover/i);
    expect(corpus).not.toMatch(/share your (doordash |merchant )?portal password/i);
    expect(corpus).not.toMatch(/Community Tap[^\n]{0,80}\$[\d,]+/i);
    expect(corpus).not.toMatch(/\bPIN\b/);
    expect(corpus).toMatch(/does not take/i);
    expect(corpus).toMatch(/\$0/);
  });
});

describe('robots.txt Allow /api/answers then Disallow /api/', () => {
  it('keeps the public JSON allowlist ahead of the /api/ deny', () => {
    expect([...ROBOTS_ALLOW]).toEqual(['/', '/api/answers', '/api/mcp', '/api/llm-shells', '/api/quick-wins']);
    expect([...ROBOTS_DISALLOW]).toContain('/api/');
    expect([...ROBOTS_DISALLOW]).toContain('/action-shift/lab');
    const doc = robots();
    const rule = Array.isArray(doc.rules) ? doc.rules[0] : doc.rules;
    expect(rule).toBeTruthy();
    const keys = Object.keys(rule as object);
    expect(keys.indexOf('allow')).toBeLessThan(keys.indexOf('disallow'));
    expect((rule as { allow: string[] }).allow[1]).toBe('/api/answers');
    expect((rule as { disallow: string[] }).disallow.at(-1)).toBe('/api/');
    expect(doc.host).toBe(WWW);
  });
});

describe('sitemap lastmod for sharpened AEO URLs', () => {
  it('stamps the eight 3P answers and owner/home/audit surfaces', async () => {
    const entries = await sitemap();
    const byUrl = new Map(entries.map((entry) => [entry.url, entry]));
    for (const slug of ISSUE_122_3P_SLUGS) {
      const entry = byUrl.get(`${WWW}/answers/${slug}`);
      expect(entry, slug).toBeTruthy();
      expect(new Date(entry?.lastModified as Date).toISOString().startsWith('2026-08-26')).toBe(true);
    }
    for (const path of ['', '/audit', '/for/owner', '/answers']) {
      const lastModified = byUrl.get(`${WWW}${path}`)?.lastModified;
      expect(new Date(lastModified as Date).getTime()).toBe(AEO_PAGE_LASTMOD.getTime());
    }
    expect(byUrl.get(`${WWW}/llm-shells`)).toBeTruthy();
  });
});

describe('/for/owner CTA copy', () => {
  it('keeps the free seat primary and points owners at /audit', () => {
    const owner = ROLES.owner;
    expect(roleSeoTitle(owner)).toMatch(/Owner:/);
    expect(roleSeoDescription(owner)).toMatch(/\/trial/);
    expect(roleSeoDescription(owner)).toMatch(/\/audit/);
    expect(roleSeoDescription(ROLES.ceo)).not.toMatch(/\/audit/);
  });
});
