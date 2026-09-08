import { decodeToastText, packFromSourceTag, TOAST_PARSE_PREFIX, type ToastFactPack } from '@/lib/toastParse';
import {
  decodePdqText,
  PDQ_PARSE_PREFIX,
  pdqPackHasNumber,
  type PdqFactPack,
} from '@/lib/pdqEodParse';
import {
  HYVEE_PARSE_PREFIX,
  hyveePackHasNumber,
  type HyveeFactPack,
} from '@/lib/hyveeWineParse';
import type { SourceTag } from '@/lib/simpleOwnerDemo/types';
import { detectReport, parseRegisteredReport, type RegisteredFactPack } from './registry';

function packHasNumber(pack: RegisteredFactPack): boolean {
  if (pack.pos === 'pdq') return pdqPackHasNumber(pack as PdqFactPack);
  if (pack.pos === 'hy-vee') return hyveePackHasNumber(pack as HyveeFactPack);
  const toast = pack as ToastFactPack;
  return (
    toast.netSales != null
    || toast.laborCost != null
    || toast.voidLineCount != null
    || toast.hours != null
    || Object.keys(toast.itemDayNet ?? {}).length > 0
    || Object.keys(toast.dayNetSales ?? {}).length > 0
  );
}

function decodeRegisteredText(bytes: Uint8Array): string | null {
  return decodeToastText(bytes) ?? decodePdqText(bytes);
}

function prefixFor(pos: string): string {
  if (pos === 'toast') return TOAST_PARSE_PREFIX;
  if (pos === 'pdq') return PDQ_PARSE_PREFIX;
  if (pos === 'hy-vee') return HYVEE_PARSE_PREFIX;
  return `${pos}-parse:v1:`;
}

/**
 * Source-tag any registered adapter. Toast packs keep toast-parse:v1 so the
 * desk can rehydrate Verified/Estimated facts. A hook with parse=null adds
 * no dollars.
 */
export function reportSourceTags(filename: string, bytes: Uint8Array): SourceTag[] {
  const text = decodeRegisteredText(bytes);
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
  const prefix = prefixFor(hit.pos);
  const date =
    ('businessDate' in pack ? pack.businessDate : null)
    || ('periodStart' in pack ? pack.periodStart : null)
    || filename;
  return [
    {
      tag: ready ? 'verified' : 'unverified',
      source: `${hit.pos}:${hit.family}:${date}`,
    },
    { tag: ready ? 'verified' : 'unverified', source: `${prefix}${JSON.stringify(pack)}` },
  ];
}

export function hasParsedReportPack(tags: readonly SourceTag[]): boolean {
  return tags.some((tag) => packFromSourceTag(tag) != null || /[-]parse:v1:/.test(tag.source));
}
