import type { SalesLaborRosterStore } from './types';

/**
 * 16-store Bamba roster for swarm fan-out.
 * Daily dollars stay on the six Aug 12 parsed stores. The rest are roster-only
 * (not loaded this pull) so the 125273.41 canary cannot drift.
 * Public storefront names only. No staff names. No foreign tenants.
 */
export const BAMBA_STORE_ROSTER: readonly SalesLaborRosterStore[] = [
  { store: 'Ballston', region: 'Arlington', inDailyPull: true },
  { store: 'Shirlington', region: 'Arlington', inDailyPull: true },
  { store: 'City Ridge', region: 'DC', inDailyPull: true },
  { store: 'Landmark', region: 'Alexandria', inDailyPull: true },
  { store: 'Fair Lakes', region: 'Fairfax', inDailyPull: true },
  { store: 'Fairfax at University Mall', region: 'Fairfax', inDailyPull: true },
  { store: 'Reston', region: 'Fairfax', inDailyPull: false },
  { store: 'Tysons', region: 'Fairfax', inDailyPull: false },
  { store: 'Mosaic', region: 'Fairfax', inDailyPull: false },
  { store: 'One Loudoun', region: 'Loudoun', inDailyPull: false },
  { store: 'Kingstowne', region: 'Alexandria', inDailyPull: false },
  { store: 'Pentagon Row', region: 'Arlington', inDailyPull: false },
  { store: 'Falls Church', region: 'Fairfax', inDailyPull: false },
  { store: 'Springfield', region: 'Fairfax', inDailyPull: false },
  { store: 'Ashburn', region: 'Loudoun', inDailyPull: false },
  { store: 'Gainesville', region: 'Prince William', inDailyPull: false },
];

export const BAMBA_STORE_COUNT = BAMBA_STORE_ROSTER.length;

export function listBambaStoreNames(): string[] {
  return BAMBA_STORE_ROSTER.map((row) => row.store);
}
