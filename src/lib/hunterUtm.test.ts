import { describe, expect, it } from 'vitest';
import { buildHunterAuditUrl, hunterContentId } from './hunterUtm';

describe('hunterUtm', () => {
  it('builds tracked audit URL', () => {
    const url = buildHunterAuditUrl({
      source: 'reddit',
      contentId: 'reddit_restaurantowners_20260825_1',
    });
    expect(url).toContain('utm_source=reddit');
    expect(url).toContain('utm_medium=hunter');
    expect(url).toContain('utm_campaign=100_statement_audit');
    expect(url).toContain('utm_content=reddit_restaurantowners_20260825_1');
  });

  it('builds content id slug', () => {
    expect(hunterContentId('tiktok', 'comment rant', new Date('2026-08-25T12:00:00Z'), 2)).toBe(
      'tiktok_comment_rant_20260825_2',
    );
  });
});
