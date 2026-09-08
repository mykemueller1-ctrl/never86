/**
 * Seat isolation — New American Grill / Max Grill vs Community Tap.
 *
 * Store name on the Max / NAG seat is **New American Grill**
 * (Toast header `--The New American Grill`). Product mouth may say
 * Max Grill. Crossing CTAP ↔ NAG is Fail.
 *
 * Toast = NAG / Taco lab only. CTAP Seat 1 = PDQ Signature only.
 */

import {
  CTAP_SEAT1_PUBLIC_LABEL,
  CTAP_SEAT1_RESTAURANT_DEFAULT,
} from './ctapSeat1';
import { day1StoreTitle } from './day1Coach';

export const NAG_SEAT_RESTAURANT_NAME = 'New American Grill';
export const NAG_TOAST_HEADER = 'The New American Grill';

const NAG_NAME_RE = /(?:the\s+)?new american grill|max grill/i;
const CTAP_NAME_RE = /community\s*tap/i;
const NAG_OPERATOR_RE = /(?:^|[:/_-])(?:nag|new[\s._-]*american|max[\s._-]*grill)(?:$|[:/_-])/i;

export function isNagRestaurantName(name?: string | null): boolean {
  return NAG_NAME_RE.test((name ?? '').trim());
}

export function isCtapRestaurantName(name?: string | null): boolean {
  return CTAP_NAME_RE.test((name ?? '').trim());
}

/** Demo / lab operator ids. Numeric `seat:1000000` is not NAG or CTAP by itself. */
export function restaurantNameHintFromOperatorId(operatorId: string): string | undefined {
  const id = operatorId.trim();
  if (!id) return undefined;
  if (NAG_OPERATOR_RE.test(id) || /nag-toast|nag-training|max-grill/i.test(id)) {
    return NAG_SEAT_RESTAURANT_NAME;
  }
  const lower = id.toLowerCase();
  if (lower.includes('ctap') || /community[\s._-]*tap/.test(lower)) {
    return CTAP_SEAT1_RESTAURANT_DEFAULT;
  }
  return undefined;
}

/**
 * CTAP Seat 1 lock. A New American Grill / Max Grill restaurant name
 * wins over a leftover free-seat floor id — first Neon id is not CTAP.
 */
export function isCtapSeat(operatorId: string, restaurantName?: string | null): boolean {
  if (isNagRestaurantName(restaurantName)) return false;
  if (isCtapRestaurantName(restaurantName)) return true;
  const hint = restaurantNameHintFromOperatorId(operatorId);
  if (isNagRestaurantName(hint)) return false;
  if (isCtapRestaurantName(hint)) return true;
  const id = operatorId.trim().toLowerCase();
  if (!id) return false;
  if (id.includes('ctap')) return true;
  if (/community[\s._-]*tap/.test(id)) return true;
  return false;
}

export function toastMayAnswerSeat(operatorId: string, restaurantName?: string | null): boolean {
  if (isNagRestaurantName(restaurantName)) return true;
  if (isNagRestaurantName(restaurantNameHintFromOperatorId(operatorId))) return true;
  return !isCtapSeat(operatorId, restaurantName);
}

/** Visible store name. Never paints Community Tap on a NAG / Max Grill seat. */
export function deskSeatLabel(restaurantName?: string | null): string {
  if (isNagRestaurantName(restaurantName)) return NAG_SEAT_RESTAURANT_NAME;
  return day1StoreTitle(restaurantName);
}

/**
 * Header title / tooltip. Community Tap Seat 1 only when this seat
 * is Community Tap. NAG never carries that label.
 */
export function deskSeatTitle(restaurantName?: string | null): string {
  if (isNagRestaurantName(restaurantName)) return NAG_SEAT_RESTAURANT_NAME;
  if (isCtapRestaurantName(restaurantName)) return CTAP_SEAT1_PUBLIC_LABEL;
  if (!restaurantName?.trim()) return '';
  return deskSeatLabel(restaurantName);
}

export function deskHeaderIsolated(visible: string, title: string): boolean {
  const vis = visible.trim();
  const tip = title.trim();
  if (isNagRestaurantName(vis) || isNagRestaurantName(tip)) {
    return !CTAP_NAME_RE.test(vis) && !CTAP_NAME_RE.test(tip) && !/seat\s*1/i.test(tip);
  }
  if (isCtapRestaurantName(vis) || /community tap/i.test(tip)) {
    return !NAG_NAME_RE.test(vis) && !NAG_NAME_RE.test(tip);
  }
  return true;
}

export { CTAP_SEAT1_PUBLIC_LABEL };
