import { median } from '../csv/core';

/** Same Void Hunter rule: flag above 1.5× this file's own peer median. Never an industry %. */
export const PEER_MEDIAN_MULTIPLIER = 1.5;
export const VOID_FLAG_RULE = 'peer-median-1.5x' as const;

export function peerMedian(rates: number[]): number {
  return median(rates.filter((rate) => Number.isFinite(rate)));
}

export function flagAgainstPeerMedian(rate: number, peer: number): boolean {
  return peer > 0 && Number.isFinite(rate) && rate > PEER_MEDIAN_MULTIPLIER * peer;
}

export function rate(amount: number, base: number): number | null {
  if (!Number.isFinite(amount) || !Number.isFinite(base) || base <= 0) return null;
  return amount / base;
}

export function cents(value: number): number {
  return Math.round(value * 100) / 100;
}
