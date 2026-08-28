import { describe, expect, it } from 'vitest';
import { getGrokShell, getInstallMatrix } from './providers';

describe('four-LLM try doors', () => {
  it('keeps honest marketplace status and exposes operator open URLs', () => {
    const matrix = getInstallMatrix();
    expect(matrix.status.marketplacePublication).toBe('not-submitted');
    expect(matrix.shells).toHaveLength(4);
    const grok = matrix.shells.find((shell) => shell.provider === 'grok');
    expect(grok?.openUrl).toBe('https://grok.com/connectors');
    expect(grok?.steps.some((step) => step.includes('grok.com/connectors'))).toBe(true);
    expect(getGrokShell().status.credentials).toBe('none-claimed');
  });
});
