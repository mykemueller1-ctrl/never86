/** All restaurant money stays in integer cents. Never float mid-formula. */

export function dollarsToCents(n: number): number {
  if (!Number.isFinite(n)) throw new Error("non-finite money");
  return Math.round(n * 100);
}

export function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function requireNonNeg(name: string, n: number): number {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${name} must be a finite number >= 0`);
  }
  return n;
}

export function requirePositive(name: string, n: number): number {
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${name} must be > 0`);
  }
  return n;
}
