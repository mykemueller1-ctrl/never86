/** Fictional prices and purchasing terms for the public operator demo only. */
export type VendorPrice = {
  sourceId: string;
  date: string;
  kind: 'invoice' | 'quote';
  vendorId: string;
  vendor: string;
  vendorSku: string;
  /** Confirmed manufacturer product/spec mapping, never a supplier SKU match. */
  productId: string | null;
  product: string;
  casePrice: number;
  poundsPerCase: number;
};

export type OrderTerms = {
  /** Incremental charge for this order, not a fee silently assigned to every SKU. */
  deliveryFee: number | null;
  minimumOrder: number | null;
  otherItemsInOrder: number | null;
  usableYieldPercent: number | null;
  arrivesInTime: 'yes' | 'no' | 'unknown';
  available: 'yes' | 'no' | 'unknown';
};

export const HILLTOP_BEFORE: VendorPrice = {
  sourceId: 'HILL-0901', date: 'Sep 1', kind: 'invoice', vendorId: 'hilltop',
  vendor: 'Hilltop Food Supply', vendorSku: 'CHZ-600',
  productId: 'sample-millhouse-whole-milk-block', product: 'Millhouse whole milk mozzarella · block',
  casePrice: 72, poundsPerCase: 30,
};
export const HILLTOP_NOW: VendorPrice = {
  ...HILLTOP_BEFORE, sourceId: 'HILL-0908', date: 'Sep 8', casePrice: 78,
};
export const LAKEFRONT_BEFORE: VendorPrice = {
  ...HILLTOP_BEFORE, sourceId: 'LAKE-0901', vendorId: 'lakefront', vendor: 'Lakefront Provisions',
  vendorSku: 'MZ-305', casePrice: 73.5,
};
export const LAKEFRONT_NOW: VendorPrice = {
  ...LAKEFRONT_BEFORE, sourceId: 'LAKE-Q0908', date: 'Sep 8', kind: 'quote', casePrice: 75,
};
export const HILLTOP_TERMS: OrderTerms = {
  deliveryFee: 0, minimumOrder: 150, otherItemsInOrder: 0,
  usableYieldPercent: 100, arrivesInTime: 'yes', available: 'yes',
};
export const LAKEFRONT_TERMS: OrderTerms = {
  ...HILLTOP_TERMS, deliveryFee: 12, minimumOrder: 100,
};

const positive = (value: number) => Number.isFinite(value) && value > 0;
const nonnegative = (value: number | null) => value === null || (Number.isFinite(value) && value >= 0);
const zeroSmall = (value: number) => Math.abs(value) < 1e-9 ? 0 : value;

export function vendorPriceDrift(before: VendorPrice, now: VendorPrice) {
  if (!before.productId || before.productId !== now.productId || before.vendorId !== now.vendorId) return null;
  if (![before.casePrice, now.casePrice, before.poundsPerCase, now.poundsPerCase].every(positive)) return null;
  const beforePerPound = before.casePrice / before.poundsPerCase;
  const nowPerPound = now.casePrice / now.poundsPerCase;
  const perPoundChange = zeroSmall(nowPerPound - beforePerPound);
  const percentChange = perPoundChange / beforePerPound * 100;
  const equivalentCaseChange = perPoundChange * now.poundsPerCase;
  if (![beforePerPound, nowPerPound, perPoundChange, percentChange, equivalentCaseChange].every(Number.isFinite)) return null;
  return {
    beforePerPound, nowPerPound, perPoundChange, percentChange, equivalentCaseChange,
    packChanged: before.poundsPerCase !== now.poundsPerCase,
  };
}

export function costVendorOrder(price: VendorPrice, terms: OrderTerms, neededUsablePounds: number) {
  if (![price.casePrice, price.poundsPerCase, neededUsablePounds].every(positive)) return null;
  if (![terms.deliveryFee, terms.minimumOrder, terms.otherItemsInOrder].every(nonnegative)) return null;
  if (terms.usableYieldPercent !== null && (!positive(terms.usableYieldPercent) || terms.usableYieldPercent > 100)) return null;
  const perPound = price.casePrice / price.poundsPerCase;
  if (!Number.isFinite(perPound)) return null;
  if (terms.usableYieldPercent === null) return {
    perPound, perUsablePound: null, cases: null, boughtPounds: null, extraUsablePounds: null,
    itemSubtotal: null, orderCost: null, minimumGap: null,
  };
  const usablePerCase = price.poundsPerCase * terms.usableYieldPercent / 100;
  // Whole cases only. Small floating point noise must not cause an extra case.
  const cases = Math.ceil(neededUsablePounds / usablePerCase - 1e-10);
  const boughtPounds = cases * price.poundsPerCase;
  const extraUsablePounds = zeroSmall(cases * usablePerCase - neededUsablePounds);
  const itemSubtotal = cases * price.casePrice;
  const orderCost = terms.deliveryFee === null ? null : itemSubtotal + terms.deliveryFee;
  // Other basket items satisfy a minimum, but are not silently added to cheese cost.
  const minimumGap = terms.minimumOrder === 0 ? 0 : terms.minimumOrder === null || terms.otherItemsInOrder === null
    ? null : Math.max(0, terms.minimumOrder - itemSubtotal - terms.otherItemsInOrder);
  const perUsablePound = price.casePrice / usablePerCase;
  if (![cases, boughtPounds, extraUsablePounds, itemSubtotal, orderCost, minimumGap, perUsablePound]
    .every(value => value === null || Number.isFinite(value)) || cases < 1) return null;
  return { perPound, perUsablePound, cases, boughtPounds, extraUsablePounds, itemSubtotal, orderCost, minimumGap };
}

export type VendorBlocker = 'product' | 'yield' | 'fees' | 'minimum-unknown' | 'minimum-unmet' | 'delivery' | 'stock';

export function compareVendorOrders(
  first: VendorPrice, firstTerms: OrderTerms,
  second: VendorPrice, secondTerms: OrderTerms,
  neededUsablePounds: number,
) {
  const firstOrder = costVendorOrder(first, firstTerms, neededUsablePounds);
  const secondOrder = costVendorOrder(second, secondTerms, neededUsablePounds);
  if (!firstOrder || !secondOrder) return null;
  const blockers: VendorBlocker[] = [];
  const sameProduct = Boolean(first.productId && first.productId === second.productId);
  if (!sameProduct) blockers.push('product');
  if (firstTerms.usableYieldPercent === null || secondTerms.usableYieldPercent === null) blockers.push('yield');
  if (firstTerms.deliveryFee === null || secondTerms.deliveryFee === null) blockers.push('fees');
  if (firstOrder.minimumGap === null || secondOrder.minimumGap === null) blockers.push('minimum-unknown');
  if ((firstOrder.minimumGap ?? 0) > 0 || (secondOrder.minimumGap ?? 0) > 0) blockers.push('minimum-unmet');
  if (firstTerms.arrivesInTime !== 'yes' || secondTerms.arrivesInTime !== 'yes') blockers.push('delivery');
  if (firstTerms.available !== 'yes' || secondTerms.available !== 'yes') blockers.push('stock');
  // A numeric difference is not a purchasing recommendation; require every relevant fact.
  const comparable = blockers.length === 0;
  const orderDifference = comparable && firstOrder.orderCost !== null && secondOrder.orderCost !== null
    ? zeroSmall(secondOrder.orderCost - firstOrder.orderCost) : null;
  const perPoundDifference = sameProduct ? zeroSmall(secondOrder.perPound - firstOrder.perPound) : null;
  return { firstOrder, secondOrder, sameProduct, blockers, comparable, orderDifference, perPoundDifference };
}
