#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSync } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundle = buildSync({
  entryPoints: [join(__dirname, '..', 'src', 'lib', 'tipVarianceCsv.ts')],
  bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022',
});
const data = 'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64');
const { runTipVariance } = await import(data);

const fixture = readFileSync(join(__dirname, 'fixtures', 'tips-weekly.csv'), 'utf8');
const result = runTipVariance(fixture);

if ('error' in result) { console.error('FAIL', result.error); process.exit(1); }

console.log(`Tips · ${result.weeks.length} weeks · ${result.employees} employees`);
console.log(`  Network WoW: ${(result.networkWoW * 100).toFixed(2)}%`);
console.log('');

let pass = 0, fail = 0;
const cases = [
  {
    name: 'James Wilson · tip rate drops sharply WoW (large negative delta)',
    ok: result.perEmployee.some((e) => e.name === 'James Wilson' && e.deltaPp < -3 && e.flagged),
    actual: result.perEmployee.find((e) => e.name === 'James Wilson')
      ? `delta=${result.perEmployee.find((e) => e.name === 'James Wilson').deltaPp.toFixed(2)}pp flagged=${result.perEmployee.find((e) => e.name === 'James Wilson').flagged}`
      : '(not found)',
  },
  {
    name: 'Chris Foster · tip rate drops sharply WoW (large negative delta)',
    ok: result.perEmployee.some((e) => e.name === 'Chris Foster' && e.deltaPp < -5 && e.flagged),
    actual: result.perEmployee.find((e) => e.name === 'Chris Foster')
      ? `delta=${result.perEmployee.find((e) => e.name === 'Chris Foster').deltaPp.toFixed(2)}pp flagged=${result.perEmployee.find((e) => e.name === 'Chris Foster').flagged}`
      : '(not found)',
  },
  {
    name: 'Maria Rodriguez · stable tips (small delta, not flagged)',
    ok: result.perEmployee.some((e) => e.name === 'Maria Rodriguez' && Math.abs(e.deltaPp) < 1 && !e.flagged),
    actual: result.perEmployee.find((e) => e.name === 'Maria Rodriguez')
      ? `delta=${result.perEmployee.find((e) => e.name === 'Maria Rodriguez').deltaPp.toFixed(2)}pp flagged=${result.perEmployee.find((e) => e.name === 'Maria Rodriguez').flagged}`
      : '(not found)',
  },
  {
    name: 'Result sorted ascending by delta (most negative first)',
    ok: result.perEmployee[0] && result.perEmployee[0].deltaPp <= result.perEmployee[result.perEmployee.length - 1].deltaPp,
    actual: result.perEmployee.map((e) => `${e.name}(${e.deltaPp.toFixed(1)})`).join(' < '),
  },
];

for (const c of cases) {
  if (c.ok) { pass++; console.log(`✓ PASS  ${c.name}\n        ${c.actual}\n`); }
  else { fail++; console.log(`✗ FAIL  ${c.name}\n        ${c.actual}\n`); }
}
console.log('═'.repeat(70));
console.log(`Results: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
