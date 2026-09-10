import { describe, expect, it } from 'vitest';
import {
  vendorPriceDrift, costVendorOrder, compareVendorOrders,
  HILLTOP_BEFORE, HILLTOP_NOW, LAKEFRONT_BEFORE, LAKEFRONT_NOW,
  HILLTOP_TERMS, LAKEFRONT_TERMS,
} from './operatorVendors';

describe('vendor drift and actual order decisions', () => {
  const compare = (second = LAKEFRONT_NOW, terms = LAKEFRONT_TERMS, needed = 60) =>
    compareVendorOrders(HILLTOP_NOW, HILLTOP_TERMS, second, terms, needed)!;

  it('finds a lower unit price that becomes a higher order cost after delivery', () => {
    const result = compare();
    expect(result.firstOrder.orderCost).toBe(156);
    expect(result.secondOrder.orderCost).toBe(162);
    expect(result.perPoundDifference).toBeCloseTo(-0.1);
    expect(result.orderDifference).toBe(6);
    expect(result.blockers).toEqual([]);
  });

  it('tracks each vendor against its own earlier product price', () => {
    expect(vendorPriceDrift(HILLTOP_BEFORE, HILLTOP_NOW)?.percentChange).toBeCloseTo(8.333333);
    expect(vendorPriceDrift(LAKEFRONT_BEFORE, LAKEFRONT_NOW)?.percentChange).toBeCloseTo(2.040816);
    expect(vendorPriceDrift(HILLTOP_BEFORE, LAKEFRONT_NOW)).toBeNull();
  });

  it('compares different supplier SKUs only through a confirmed product mapping', () => {
    expect(HILLTOP_NOW.vendorSku).not.toBe(LAKEFRONT_NOW.vendorSku);
    expect(compare().sameProduct).toBe(true);
    const sameSkuWrongProduct = compare({ ...LAKEFRONT_NOW, vendorSku: HILLTOP_NOW.vendorSku, productId: 'part-skim' });
    expect(sameSkuWrongProduct.blockers).toContain('product');
    expect(sameSkuWrongProduct.orderDifference).toBeNull();
    expect(sameSkuWrongProduct.perPoundDifference).toBeNull();
    expect(vendorPriceDrift(LAKEFRONT_BEFORE, { ...LAKEFRONT_NOW, productId: null })).toBeNull();
  });

  it('catches a smaller case whose lower sticker price hides a unit price increase', () => {
    const smaller = { ...LAKEFRONT_NOW, casePrice: 65, poundsPerCase: 25 };
    const drift = vendorPriceDrift(LAKEFRONT_BEFORE, smaller)!;
    expect(smaller.casePrice).toBeLessThan(LAKEFRONT_BEFORE.casePrice);
    expect(drift.percentChange).toBeCloseTo(6.122449);
    expect(drift.packChanged).toBe(true);
    const result = compare(smaller);
    expect(result.secondOrder.cases).toBe(3);
    expect(result.secondOrder.extraUsablePounds).toBe(15);
    expect(result.secondOrder.orderCost).toBe(207);
    expect(result.orderDifference).toBe(51);
  });

  it('recognizes a pack change with no real change in price per pound', () => {
    const drift = vendorPriceDrift(LAKEFRONT_BEFORE, { ...LAKEFRONT_NOW, casePrice: 36.75, poundsPerCase: 15 })!;
    expect(drift.packChanged).toBe(true);
    expect(drift.percentChange).toBe(0);
  });

  it('charges delivery once for the order, including when quantity increases', () => {
    const result = compare(LAKEFRONT_NOW, LAKEFRONT_TERMS, 120);
    expect(result.secondOrder.cases).toBe(4);
    expect(result.secondOrder.orderCost).toBe(312);
    expect(compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, deliveryFee: 0 }).orderDifference).toBe(-6);
  });

  it('keeps a missing delivery fee unknown instead of silently treating it as zero', () => {
    const result = compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, deliveryFee: null });
    expect(result.secondOrder.itemSubtotal).toBe(150);
    expect(result.secondOrder.orderCost).toBeNull();
    expect(result.blockers).toContain('fees');
    expect(result.orderDifference).toBeNull();
  });

  it('does not recommend a switch when the minimum is unmet', () => {
    const terms = { ...LAKEFRONT_TERMS, minimumOrder: 300 };
    expect(compare(LAKEFRONT_NOW, terms).secondOrder.minimumGap).toBe(150);
    expect(compare(LAKEFRONT_NOW, terms).blockers).toContain('minimum-unmet');
    expect(compare(LAKEFRONT_NOW, terms).orderDifference).toBeNull();
    const enoughBasket = compare(LAKEFRONT_NOW, { ...terms, otherItemsInOrder: 160 });
    expect(enoughBasket.secondOrder.minimumGap).toBe(0);
    expect(enoughBasket.secondOrder.orderCost).toBe(162);
    expect(enoughBasket.orderDifference).toBe(6);
  });

  it('distinguishes an unknown minimum from a known zero minimum', () => {
    expect(compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, minimumOrder: null }).blockers).toContain('minimum-unknown');
    expect(compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, otherItemsInOrder: null }).orderDifference).toBeNull();
    expect(compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, minimumOrder: 0, otherItemsInOrder: null }).orderDifference).toBe(6);
  });

  it('keeps the numeric order costs but withholds a price choice for late, uncertain or unavailable orders', () => {
    for (const timing of ['no', 'unknown'] as const) {
      const result = compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, arrivesInTime: timing });
      expect(result.secondOrder.orderCost).toBe(162);
      expect(result.blockers).toContain('delivery');
      expect(result.orderDifference).toBeNull();
    }
    for (const stock of ['no', 'unknown'] as const) {
      expect(compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, available: stock }).blockers).toContain('stock');
    }
  });

  it('buys whole cases based on usable quantity, and never assumes a missing yield', () => {
    const result = compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, usableYieldPercent: 80 });
    expect(result.secondOrder.cases).toBe(3);
    expect(result.secondOrder.extraUsablePounds).toBe(12);
    expect(result.secondOrder.orderCost).toBe(237);
    expect(result.secondOrder.perUsablePound).toBe(3.125);
    const unknown = compare(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, usableYieldPercent: null });
    expect(unknown.secondOrder.cases).toBeNull();
    expect(unknown.secondOrder.orderCost).toBeNull();
    expect(unknown.blockers).toContain('yield');
  });

  it('rejects impossible weights, needs, fees and yields without producing misleading money', () => {
    for (const value of [0, -1, NaN, Infinity]) {
      expect(compareVendorOrders(HILLTOP_NOW, HILLTOP_TERMS, { ...LAKEFRONT_NOW, poundsPerCase: value }, LAKEFRONT_TERMS, 60)).toBeNull();
      expect(costVendorOrder(LAKEFRONT_NOW, LAKEFRONT_TERMS, value)).toBeNull();
    }
    for (const value of [-1, NaN, Infinity]) expect(costVendorOrder(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, deliveryFee: value }, 60)).toBeNull();
    for (const value of [0, -1, 101, NaN, Infinity]) expect(costVendorOrder(LAKEFRONT_NOW, { ...LAKEFRONT_TERMS, usableYieldPercent: value }, 60)).toBeNull();
    expect(costVendorOrder({ ...LAKEFRONT_NOW, casePrice: Number.MAX_VALUE }, LAKEFRONT_TERMS, 120)).toBeNull();
  });

  it('does not buy an extra case due to decimal rounding noise', () => {
    const result = costVendorOrder({ ...LAKEFRONT_NOW, poundsPerCase: 0.1 }, { ...LAKEFRONT_TERMS, minimumOrder: 0 }, 0.3)!;
    expect(result.cases).toBe(3);
    expect(result.extraUsablePounds).toBe(0);
  });
});
