#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSync } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundle = buildSync({
  entryPoints: [join(__dirname, '..', 'src', 'lib', 'cateringLeakCsv.ts')],
  bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022',
});
const data = 'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64');
const { runCateringLeak } = await import(data);

const fixture = readFileSync(join(__dirname, 'fixtures', 'catering-reconciliation.csv'), 'utf8');
const result = runCateringLeak(fixture);

if ('error' in result) { console.error('FAIL', result.error); process.exit(1); }

const usd = (n) => '$' + Math.round(n).toLocaleString();
console.log(`Catering · ${result.orders} orders · ${result.stores.length} stores`);
console.log(`  Invoice ${usd(result.totalInvoice)} · POS ${usd(result.totalPos)} · Gap ${usd(result.totalGap)} (${(result.gapRatio * 100).toFixed(2)}%)`);
console.log(`  Unmatched: ${result.unmatchedOrders.length} · Flagged: ${result.flaggedOrders.length}`);
console.log('');

let pass = 0, fail = 0;
const cases = [
  {
    name: 'Unmatched orders · 3 invoices with $0 POS (Hagie + 2 × Sukup)',
    ok: result.unmatchedOrders.length === 3
      && result.unmatchedOrders.some((o) => o.customer === 'Hagie Manufacturing'),
    actual: result.unmatchedOrders.map((o) => `${o.customer}(${o.orderId})`).join(' · '),
  },
  {
    name: 'Top customer concentration · Sukup tops total gap, Acme tops order count',
    ok: result.topCustomerConcentration[0]?.customer === 'Sukup Manufacturing'
      && result.topCustomerConcentration.find((c) => c.customer === 'Acme Corp')?.orders === 7,
    actual: result.topCustomerConcentration.slice(0, 3).map((c) => `${c.customer}(${c.orders}, gap ${usd(c.totalGap)})`).join(' · '),
  },
  {
    name: 'Flagged orders · gap > $50 AND >10% of invoice (excluding unmatched)',
    ok: result.flaggedOrders.length >= 4,
    actual: result.flaggedOrders.map((o) => `${o.customer}(gap ${usd(o.gap)})`).slice(0, 4).join(' · '),
  },
  {
    name: 'Per-store · top leak store has highest totalGap',
    ok: result.perStore[0]?.totalGap >= 1000,
    actual: result.perStore.map((s) => `${s.store}(gap ${usd(s.totalGap)})`).join(' · '),
  },
  {
    name: 'Gap ratio reasonable (between 10% and 25% for this fixture)',
    ok: result.gapRatio > 0.10 && result.gapRatio < 0.25,
    actual: `${(result.gapRatio * 100).toFixed(2)}%`,
  },
];

for (const c of cases) {
  if (c.ok) { pass++; console.log(`✓ PASS  ${c.name}\n        ${c.actual}\n`); }
  else { fail++; console.log(`✗ FAIL  ${c.name}\n        ${c.actual}\n`); }
}
console.log('═'.repeat(70));
console.log(`Results: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
