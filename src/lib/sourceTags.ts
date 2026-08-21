// The source-tag system — the governance/honesty layer made visible.
// Every metric on the Command Center renders with one of these:
//   verified   = re-pullable primary source (POS, SEC, BLS, NOAA) — green
//   estimated  = industry benchmark or modeled/seeded number — amber
//   unverified = third-party scrape or stale/not-yet-wired source — gray
export type TagLevel = 'verified' | 'estimated' | 'unverified';

export const TAG_META: Record<TagLevel, { label: string; hex: string; bg: string }> = {
  verified: { label: 'Verified', hex: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  estimated: { label: 'Estimated', hex: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  unverified: { label: 'Unverified', hex: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

// Current provenance registry — the real state of each platform metric today.
// Drives the Data Lead tag-count summary. Update as sources get wired.
export const METRIC_REGISTRY: { metric: string; tag: TagLevel; source: string }[] = [
  { metric: 'Network net sales', tag: 'verified', source: 'toast_employee_performance (re-pullable)' },
  { metric: 'First-party % of digital', tag: 'verified', source: 'toast_dining_options (de-duped)' },
  { metric: 'Per-store net sales', tag: 'verified', source: 'toast_dining_options' },
  { metric: 'Void / discount exceptions', tag: 'verified', source: 'toast_employee_performance' },
  { metric: 'Toast sync freshness', tag: 'verified', source: 'toast_dining_options.created_at' },
  { metric: 'Recovery surface ($/yr)', tag: 'estimated', source: 'COMPASS methodology (modeled)' },
  { metric: '3P fee exposure ($/yr)', tag: 'estimated', source: '3P revenue (verified) × assumed 20–25% take' },
  { metric: 'Prime cost / food cost %', tag: 'unverified', source: 'not connected — invoices/recipes not loaded' },
  { metric: 'Public-peer benchmark', tag: 'unverified', source: 'SEC EDGAR — integration pending' },
  { metric: 'Area wage benchmark', tag: 'unverified', source: 'BLS OEWS — integration pending' },
];

export function tagCounts() {
  const counts = { verified: 0, estimated: 0, unverified: 0 };
  for (const m of METRIC_REGISTRY) counts[m.tag] += 1;
  const total = METRIC_REGISTRY.length;
  return { ...counts, total };
}
