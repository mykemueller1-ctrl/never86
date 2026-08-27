import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET as getMatrix } from './route';
import { GET as getProvider } from './[provider]/route';
import { LLM_SHELL_PROVIDERS } from '@/lib/llmShells';

describe('llm-shells machine-readable manifests', () => {
  it('returns the honest install matrix', async () => {
    const response = await getMatrix();
    const body = await response.json();
    expect(body.skillPack.providerNeutral).toBe(true);
    expect(body.status.marketplacePublication).toBe('not-submitted');
    expect(body.shells).toHaveLength(4);
  });

  it('returns each thin shell and 404s unknown providers', async () => {
    for (const provider of LLM_SHELL_PROVIDERS) {
      const response = await getProvider(new NextRequest(`http://localhost/api/llm-shells/${provider}`), {
        params: Promise.resolve({ provider }),
      });
      const body = await response.json();
      expect(body.provider).toBe(provider);
      expect(body.kind).toBe('thin-install-shell');
      expect(body.status.credentials).toBe('none-claimed');
    }

    const missing = await getProvider(new NextRequest('http://localhost/api/llm-shells/facebook'), {
      params: Promise.resolve({ provider: 'facebook' }),
    });
    expect(missing.status).toBe(404);
  });
});
