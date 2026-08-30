export type HunterUtmSource = 'reddit' | 'facebook' | 'x' | 'tiktok' | 'linkedin';

const BASE = 'https://www.never86.ai/audit';
const CAMPAIGN = '100_statement_audit';

export function buildHunterAuditUrl(input: {
  source: HunterUtmSource;
  contentId: string;
  medium?: 'hunter' | 'organic';
}): string {
  const params = new URLSearchParams({
    utm_source: input.source,
    utm_medium: input.medium ?? 'hunter',
    utm_campaign: CAMPAIGN,
    utm_content: input.contentId,
  });
  return `${BASE}?${params.toString()}`;
}

/** e.g. reddit_restaurantowners_20260825_1 */
export function hunterContentId(
  platform: HunterUtmSource,
  context: string,
  date: Date,
  index: number,
): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const slug = context.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${platform}_${slug}_${y}${m}${d}_${index}`;
}
