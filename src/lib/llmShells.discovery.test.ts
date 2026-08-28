import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import { metadata as llmShellsMetadata } from '../app/llm-shells/page';
import { GET as getLlmsTxt } from '../app/llms.txt/route';
import { GET as getLlmsFullTxt } from '../app/llms-full.txt/route';
import {
  DURABLE_SHELL_CLAIMS,
  getInstallMatrix,
  getNever86SkillPack,
} from './llmShells';

const ROOT = join(process.cwd());
const PUBLIC_LLM_SHELLS_URL = 'https://www.never86.ai/llm-shells';
const IMPOSSIBLE_DEPLOY_STATUS =
  /\bnot merged\b|\bnot-merged\b|\bpreview-only\b|\bpreview only\b|\bnot production-deployed\b|\bnot-deployed\b|\bproduction-deployed from this branch\b|\bmerged \/ production-deployed\b/i;

function firstRobotsRule() {
  const doc = robots();
  const rule = Array.isArray(doc.rules) ? doc.rules[0] : doc.rules;
  if (!rule || typeof rule !== 'object') throw new Error('robots.txt missing rules');
  return rule as { allow?: string | string[]; disallow?: string | string[] };
}

function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

describe('llm-shells crawler and LLM discovery gate', () => {
  it('does not advertise /llm-shells in sitemap, robots, or LLM indexes', async () => {
    const entries = await sitemap();
    expect(entries.some((entry) => String(entry.url).includes('/llm-shells'))).toBe(false);

    const rule = firstRobotsRule();
    const allow = asList(rule.allow);
    const disallow = asList(rule.disallow);
    expect(allow.some((path) => path.includes('llm-shells'))).toBe(false);
    expect(disallow.some((path) => path.includes('llm-shells'))).toBe(false);

    const llmsTxt = await (await getLlmsTxt()).text();
    const llmsFull = await (await getLlmsFullTxt()).text();
    expect(llmsTxt).not.toContain('/llm-shells');
    expect(llmsFull).not.toContain('/llm-shells');
    expect(llmsTxt).not.toContain(PUBLIC_LLM_SHELLS_URL);
    expect(llmsFull).not.toContain(PUBLIC_LLM_SHELLS_URL);

    expect(getNever86SkillPack().knowledge.publicSurfaces).not.toContain(PUBLIC_LLM_SHELLS_URL);
    expect(llmShellsMetadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('keeps /llm-shells out of crawler-surface source files', () => {
    const crawlerFiles = [
      'src/app/sitemap.ts',
      'src/app/robots.ts',
      'src/app/llms.txt/route.ts',
      'src/app/llms-full.txt/route.ts',
      'src/app/mcp/page.tsx',
      'src/lib/llmShells/skillPack.ts',
    ];
    for (const relative of crawlerFiles) {
      const source = readFileSync(join(ROOT, relative), 'utf8');
      expect(source, relative).not.toContain(PUBLIC_LLM_SHELLS_URL);
      expect(source, relative).not.toContain('href="/llm-shells"');
      if (!relative.endsWith('robots.ts')) {
        expect(source, relative).not.toMatch(/url: `\$\{BASE\}\/llm-shells`/);
      }
    }
    const robotsSource = readFileSync(join(ROOT, 'src/app/robots.ts'), 'utf8');
    expect(robotsSource).not.toMatch(/['"]\/api\/llm-shells['"]/);
    expect(robotsSource).not.toMatch(/['"]\/llm-shells['"]/);

    const seoAeoPath = join(ROOT, 'src/lib/seoAeo.ts');
    if (existsSync(seoAeoPath)) {
      const seoAeo = readFileSync(seoAeoPath, 'utf8');
      expect(seoAeo).not.toMatch(/['"]\/api\/llm-shells['"]/);
      expect(seoAeo).not.toMatch(/['"]\/llm-shells['"]/);
      expect(seoAeo).not.toContain(PUBLIC_LLM_SHELLS_URL);
    }
  });
});

describe('llm-shells durable status claims', () => {
  it('does not hard-code merge or deploy state that goes stale on a live build', () => {
    const matrix = getInstallMatrix();
    const pageSource = readFileSync(join(ROOT, 'src/app/llm-shells/page.tsx'), 'utf8');
    const installDoc = readFileSync(join(ROOT, 'docs/llm-shells/INSTALL.md'), 'utf8');
    const mcpSource = readFileSync(join(ROOT, 'src/app/mcp/page.tsx'), 'utf8');
    const surfaces = [
      pageSource,
      installDoc,
      mcpSource,
      JSON.stringify(matrix),
      matrix.honesty.join('\n'),
    ].join('\n');

    expect(surfaces).not.toMatch(IMPOSSIBLE_DEPLOY_STATUS);
    expect(matrix.status.liveProviderInstall).toBe('unverified');
    expect(matrix.status.marketplacePublication).toBe('not-submitted');
    expect(matrix.status.credentials).toBe('none-claimed');
    expect(matrix.status.readOnlyCertified).toBe('certified-in-repo');
    expect(matrix.status.draftOnlyCertified).toBe('certified-in-repo');
    expect(DURABLE_SHELL_CLAIMS).toEqual([
      'Provider installation: unverified.',
      'Marketplace publication: not submitted.',
      'Credentials: none claimed.',
      'READ-ONLY and DRAFT-ONLY: certified in repo.',
    ]);
    expect(pageSource).toContain('Provider installation: unverified');
    expect(pageSource).toContain('Marketplace publication: not submitted');
    expect(pageSource).toContain('Credentials: none claimed');
    expect(pageSource).toContain('READ-ONLY and DRAFT-ONLY: certified in repo');
  });
});
