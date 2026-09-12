import { describe, expect, it } from 'vitest';
import { getGeminiShell, getGrokShell, getInstallMatrix } from './providers';

describe('major-LLM try doors', () => {
  it('keeps publication honest and exposes five provider paths', () => {
    const matrix = getInstallMatrix();
    expect(matrix.status.marketplacePublication).toBe('not-submitted');
    expect(matrix.status.liveProviderInstall).toBe('unverified');
    expect(matrix.shells).toHaveLength(5);

    const perplexity = matrix.shells.find((shell) => shell.provider === 'perplexity');
    expect(perplexity?.openUrl).toBe('https://www.perplexity.ai');
    expect(perplexity?.steps.some((step) => step.includes('Custom connector'))).toBe(true);

    const grok = matrix.shells.find((shell) => shell.provider === 'grok');
    expect(grok?.openUrl).toBe('https://grok.com/connectors');
    expect(grok?.steps.some((step) => step.includes('New Connector'))).toBe(true);
    expect(getGrokShell().status.credentials).toBe('none-claimed');

    const gemini = getGeminiShell();
    expect(gemini.install.client).toMatch(/Gemini API remote MCP/i);
    expect(gemini.install.steps.join(' ')).toMatch(/not.*consumer Gemini/i);
  });
});
