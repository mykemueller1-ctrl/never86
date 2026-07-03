#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSync } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundle = buildSync({
  entryPoints: [join(__dirname, '..', 'src', 'lib', 'vendorDriftCsv.ts')],
  bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022',
});
const data = 'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64');
const { runVendorDrift } = await import(data);

const fixture = readFileSync(join(__dirname, 'fixtures', 'vendor-drift.csv'), 'utf8');
const result = runVendorDrift(fixture);

if ('error' in result) { console.error('FAIL', result.error); process.exit(1); }

console.log(`Vendor Drift · ${result.vendors.length} vendors · ${result.totalSkus} SKUs · ${result.flaggedSkus} flagged`);
console.log(`  ${result.prevPeriod} → ${result.currPeriod} · $${result.totalDriftDollars.toFixed(2)} total upward drift`);
console.log('');

let pass = 0, fail = 0;
const cases = [
  {
    name: 'PFG Olive Oil flagged · 15.8% drift ($68.40 → $79.20)',
    ok: result.perSku.some((s) => s.vendor === 'PFG' && s.sku.includes('Olive Oil') && s.driftPct > 0.15 && s.flagged),
    actual: result.perSku.find((s) => s.sku.includes('Olive Oil'))?.driftPct.toFixed(3) || '(not found)',
  },
  {
    name: 'PFG Pasta Penne flagged · 18.5% drift',
    ok: result.perSku.some((s) => s.vendor === 'PFG' && s.sku.includes('Penne') && s.driftPct > 0.15 && s.flagged),
    actual: result.perSku.find((s) => s.sku.includes('Penne') && s.vendor === 'PFG')?.driftPct.toFixed(3) || '(not found)',
  },
  {
    name: 'Sysco Mozzarella · 0% drift · not flagged',
    ok: result.perSku.some((s) => s.vendor === 'Sysco' && s.sku.includes('Mozzarella') && !s.flagged && Math.abs(s.driftPct) < 0.001),
    actual: result.perSku.find((s) => s.vendor === 'Sysco' && s.sku.includes('Mozzarella'))?.driftPct.toFixed(3) || '(not found)',
  },
  {
    name: 'Result sorted descending by driftPct (highest first)',
    ok: result.perSku[0]?.driftPct >= result.perSku[result.perSku.length - 1]?.driftPct,
    actual: result.perSku.slice(0, 3).map((s) => `${s.sku.split(' ')[0]}(${(s.driftPct * 100).toFixed(1)}%)`).join(' > '),
  },
  {
    name: 'At least 4 SKUs flagged · the obvious upward movers',
    ok: result.flaggedSkus >= 4,
    actual: `${result.flaggedSkus} flagged`,
  },
];

for (const c of cases) {
  if (c.ok) { pass++; console.log(`✓ PASS  ${c.name}\n        ${c.actual}\n`); }
  else { fail++; console.log(`✗ FAIL  ${c.name}\n        ${c.actual}\n`); }
}
console.log('═'.repeat(70));
console.log(`Results: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
