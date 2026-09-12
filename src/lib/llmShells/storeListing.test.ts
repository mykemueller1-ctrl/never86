import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  it('keeps directory publication unclaimed and points at the public MCP', () => {
    const packet = getStoreListingPacket();
    expect(packet.status.chatgptPluginDirectory).toBe('not-submitted');
    expect(packet.status.chatgptCustomMcp).toBe('available-in-developer-mode');
    expect(packet.status.claudeRemoteMcp).toBe('available-as-custom-connector');
    expect(packet.status.perplexityRemoteMcp).toBe('available-as-custom-connector');
    expect(packet.status.grokFeaturedCatalog).toBe('not-claimed');
    expect(packet.status.geminiConsumerConnector).toBe('not-claimed');
    expect(packet.listing.mcpUrl).toBe(MCP_PUBLIC_ENDPOINT);
    expect(packet.listing.chatgptPortal).toBe('https://chatgpt.com');
    expect(packet.listing.supportUrl).toBe('https://www.never86.ai/support');
    expect(packet.listing.privacyUrl).toBe('https://www.never86.ai/privacy');
    expect(packet.listing.termsUrl).toBe('https://www.never86.ai/terms');
    expect(packet.listing.authentication).toBe('none-public-read-only');
  });

  it('has the public connector 5-positive / 3-negative test pack', () => {
    expect(STORE_POSITIVE_TESTS).toHaveLength(5);
    expect(STORE_NEGATIVE_TESTS).toHaveLength(3);
    expect(STORE_DIRECTORY_STATUS.chatgptPluginDirectory).toBe('not-submitted');
    expect(STORE_LISTING.chatgptSubmitType).toMatch(/developer mode/i);
  });

  it('does not claim a live directory listing or unverified provider install path', () => {
    const blob = JSON.stringify(getStoreListingPacket());
    expect(blob).not.toMatch(/listed in GPT Store|published to Claude directory|featured on Grok/i);
    expect(blob).not.toMatch(/gemini consumer mcp.*available/i);
  });

  it('keeps the ChatGPT submission packet aligned to the public MCP tool set', () => {
    const submission = JSON.parse(
      readFileSync(join(process.cwd(), 'chatgpt-app-submission.json'), 'utf8'),
    );
    expect(submission.$schema).toBe(
      'https://developers.openai.com/plugins/schemas/chatgpt-app-submission.v1.json',
    );
    expect(submission.schema_version).toBe(1);
    expect(submission.app_info).toMatchObject({
      display_name: "Never86'd Operator",
      subtitle: 'Specialists · Payroll · Prices · Process',
      category: 'BUSINESS',
    });
    expect(Object.keys(submission.tools)).toEqual([
      'get_operator_system',
      'get_operator_logic',
      'get_3p_audit_logic',
      'list_answers',
      'list_free_agents',
      'list_agent_jobs',
      'list_specialists',
      'analyze_labor',
      'analyze_beverage',
      'convert_uom',
      'ask_pour_standards',
      'declare_pour_standards',
      'ask_fountain_standards',
      'analyze_recipe_cost',
      'analyze_vendor_prices',
      'build_action_shift',
    ]);
    expect(submission.test_cases).toHaveLength(5);
    expect(submission.negative_test_cases).toHaveLength(3);
  });
});
