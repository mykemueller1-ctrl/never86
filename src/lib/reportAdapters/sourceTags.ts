import { decodeToastText, packFromSourceTag, TOAST_PARSE_PREFIX } from '@/lib/toastParse';
import {
  decodePdqText,
  PDQ_PARSE_PREFIX,
  pdqPackHasNumber,
} from '@/lib/pdqEodParse';
import {
  HYVEE_PARSE_PREFIX,
  hyveePackHasNumber,
} from '@/lib/hyveeWineParse';
import { isCtapSeat1Id, uploadLooksLikeToastContaminant } from '@/lib/ctapPosLock';
import type { SourceTag } from '@/lib/simpleOwnerDemo/types';
import { detectReport, isHyveeFactPack, isPdqFactPack, isToastFactPack, parseRegisteredReport, type RegisteredFactPack } from './registry';

export const CTAP_TOAST_CONTAMINANT_SOURCE = 'ctap-pos-lock:toast-contaminant:fail';

function packHasNumber(pack: RegisteredFactPack): boolean {
  if (isPdqFactPack(pack)) return pdqPackHasNumber(pack);
  if (isHyveeFactPack(pack)) return hyveePackHasNumber(pack);
  if (!isToastFactPack(pack)) return false;
  const toast = pack;
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

export function hasCtapToastContaminantTag(tags: readonly SourceTag[]): boolean {
  return tags.some((tag) => tag.source === CTAP_TOAST_CONTAMINANT_SOURCE);
}

/** CTAP Seat 1 never stores Toast parse $ — Fail tag only. */
export function reportSourceTagsForSeat(
  operatorId: string,
  filename: string,
  bytes: Uint8Array,
): SourceTag[] {
  if (isCtapSeat1Id(operatorId) && uploadLooksLikeToastContaminant(filename)) {
    return [{ tag: 'unverified', source: CTAP_TOAST_CONTAMINANT_SOURCE }];
  }
  return reportSourceTags(filename, bytes);
}
