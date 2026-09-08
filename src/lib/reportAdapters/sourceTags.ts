import { decodeToastText, packFromSourceTag, TOAST_PARSE_PREFIX, type ToastFactPack } from '@/lib/toastParse';
import type { SourceTag } from '@/lib/simpleOwnerDemo/types';
import { detectReport, parseRegisteredReport } from './registry';

function packHasNumber(pack: ToastFactPack): boolean {
  return (
    pack.netSales != null
    || pack.laborCost != null
    || pack.voidLineCount != null
    || pack.hours != null
    || Object.keys(pack.itemDayNet).length > 0
    || Object.keys(pack.dayNetSales).length > 0
  );
}

/**
 * Source-tag any registered adapter. Toast packs keep toast-parse:v1 so the
 * desk can rehydrate Verified/Estimated facts. A hook with parse=null adds
 * no dollars.
 */
export function reportSourceTags(filename: string, bytes: Uint8Array): SourceTag[] {
  const text = decodeToastText(bytes);
  const hit = detectReport(filename, text ?? '');
  if (!hit) return [];
  const short: SourceTag = {
    tag: 'unverified',
    source: `${hit.pos}:${hit.family}:${filename.trim() || 'upload'}`,
  };
  if (!text) {
    return [short, { tag: 'unverified', source: `${hit.pos}-parse:unreadable:${hit.family}` }];
  }
  const pack = parseRegisteredReport(text, filename);
  if (!pack) return [short];
  const ready = packHasNumber(pack);
  const prefix = hit.pos === 'toast' ? TOAST_PARSE_PREFIX : `${hit.pos}-parse:v1:`;
  return [
    {
      tag: ready ? 'verified' : 'unverified',
      source: `${hit.pos}:${hit.family}:${pack.businessDate || pack.periodStart || filename}`,
    },
    { tag: ready ? 'verified' : 'unverified', source: `${prefix}${JSON.stringify(pack)}` },
  ];
}

export function hasParsedReportPack(tags: readonly SourceTag[]): boolean {
  return tags.some((tag) => packFromSourceTag(tag) != null || /[-]parse:v1:/.test(tag.source));
}
