import { describe, expect, it } from 'vitest';
import { MCP_PUBLIC_ENDPOINT } from '../mcpPublicContract';
import {
  STORE_DIRECTORY_STATUS,
  STORE_LISTING,
  STORE_NEGATIVE_TESTS,
  STORE_POSITIVE_TESTS,
  getStoreListingPacket,
} from './storeListing';

describe('store listing packet', () => {
  it('stays unsubmitted and points at the public MCP', () => {
    const packet = getStoreListingPacket();
    expect(packet.status.chatgptPluginDirectory).toBe('not-submitted');
    expect(packet.status.claudeConnectorsDirectory).toBe('not-submitted');
    expect(packet.status.grokFeaturedCatalog).toBe('no-public-submit-path');
    expect(packet.status.geminiConsumerConnectors).toBe('partnership-only');
    expect(packet.listing.mcpUrl).toBe(MCP_PUBLIC_ENDPOINT);
    expect(packet.listing.chatgptPortal).toBe('https://platform.openai.com/plugins');
    expect(packet.listing.privacyUrl).toBe('https://www.never86.ai/privacy');
    expect(packet.listing.termsUrl).toBe('https://www.never86.ai/terms');
    expect(packet.listing.authentication).toBe('none-public-read-only');
  });

  it('has the ChatGPT 5-positive / 3-negative test pack', () => {
    expect(STORE_POSITIVE_TESTS).toHaveLength(5);
    expect(STORE_NEGATIVE_TESTS).toHaveLength(3);
    expect(STORE_DIRECTORY_STATUS.chatgptPluginDirectory).toBe('not-submitted');
    expect(STORE_LISTING.chatgptSubmitType).toBe('With MCP');
  });

  it('does not claim a live store listing', () => {
    const blob = JSON.stringify(getStoreListingPacket());
    expect(blob).not.toMatch(/listed in GPT Store|published to Claude directory|featured on Grok/i);
  });
});
