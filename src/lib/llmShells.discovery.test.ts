import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
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

describe('llm-shells crawler and LLM discovery gate', () => {
  it('advertises /llm-shells as the public try door', async () => {
    const entries = await sitemap();
    expect(entries.some((entry) => String(entry.url).includes('/llm-shells'))).toBe(true);

    const llmsTxt = await (await getLlmsTxt()).text();
    const llmsFull = await (await getLlmsFullTxt()).text();
    expect(llmsTxt).toContain('/llm-shells');
    expect(llmsFull).toContain('/llm-shells');
    expect(llmsTxt).toContain(PUBLIC_LLM_SHELLS_URL);
    expect(llmsFull).toContain(PUBLIC_LLM_SHELLS_URL);

    expect(getNever86SkillPack().knowledge.publicSurfaces).toContain(PUBLIC_LLM_SHELLS_URL);
    expect(llmShellsMetadata.robots).toMatchObject({ index: true, follow: true });
  });

  it('links the try page from crawler-surface source files', () => {
    const sitemapSource = readFileSync(join(ROOT, 'src/app/sitemap.ts'), 'utf8');
    expect(sitemapSource).toMatch(/\/llm-shells/);

    const llmsSource = readFileSync(join(ROOT, 'src/app/llms.txt/route.ts'), 'utf8');
    expect(llmsSource).toContain(PUBLIC_LLM_SHELLS_URL);

    const skillSource = readFileSync(join(ROOT, 'src/lib/llmShells/skillPack.ts'), 'utf8');
    expect(skillSource).toContain(PUBLIC_LLM_SHELLS_URL);

    const mcpSource = readFileSync(join(ROOT, 'src/app/mcp/page.tsx'), 'utf8');
    expect(mcpSource).toContain('href="/llm-shells"');

    const seoAeoPath = join(ROOT, 'src/lib/seoAeo.ts');
    if (existsSync(seoAeoPath)) {
      const seoAeo = readFileSync(seoAeoPath, 'utf8');
      expect(seoAeo).not.toMatch(/disallow.*llm-shells/i);
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
    expect(pageSource).toContain('https://grok.com/connectors');
  });
});
