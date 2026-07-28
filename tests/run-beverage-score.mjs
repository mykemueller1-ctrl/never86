#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSync } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundle = buildSync({
  entryPoints: [join(__dirname, '..', 'src', 'lib', 'beverageScoreCsv.ts')],
  bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022',
});
const data = 'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64');
const { runBeverageCostScore } = await import(data);

const fixture = readFileSync(join(__dirname, 'fixtures', 'beverage-pour.csv'), 'utf8');
const result = runBeverageCostScore(fixture);

if ('error' in result) { console.error('FAIL', result.error); process.exit(1); }

const usd = (n) => '$' + Math.round(n).toLocaleString();
console.log(`Bev · ${result.storesCount} stores · BCS ${result.networkBcsScore}`);
console.log(`  Consumed ${result.networkConsumed} · Poured ${result.networkPoured} · Shrink ${result.networkShrinkUnits} (${(result.networkShrinkPct * 100).toFixed(2)}%) · Lost ${usd(result.networkRevenueLost)}`);
console.log('');

let pass = 0, fail = 0;
const cases = [
  {
    name: 'Highway 7 has worst BCS (highest shrink across cats)',
    ok: result.perStore[0]?.store === 'Highway 7' && result.perStore[0].bcsScore < 70,
    actual: result.perStore.map((s) => `${s.store}(${s.bcsScore})`).join(' · '),
  },
  {
    name: 'Lake Front clean (BCS >= 95)',
    ok: result.perStore.find((s) => s.store === 'Lake Front')?.bcsScore >= 95,
    actual: `Lake Front BCS=${result.perStore.find((s) => s.store === 'Lake Front')?.bcsScore}`,
  },
  {
    name: 'Liquor is the highest-shrink category at Highway 7',
    ok: result.perStore.find((s) => s.store === 'Highway 7')?.byCategory[0]?.category === 'Liquor',
    actual: result.perStore.find((s) => s.store === 'Highway 7')?.byCategory.map((c) => `${c.category}(${c.shrinkUnits})`).join(' · '),
  },
  {
    name: 'Revenue lost > $0 when unit prices present',
    ok: result.networkRevenueLost > 0,
    actual: `network revenue lost ${usd(result.networkRevenueLost)}`,
  },
];

for (const c of cases) {
  if (c.ok) { pass++; console.log(`✓ PASS  ${c.name}\n        ${c.actual}\n`); }
  else { fail++; console.log(`✗ FAIL  ${c.name}\n        ${c.actual}\n`); }
}
console.log('═'.repeat(70));
console.log(`Results: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
