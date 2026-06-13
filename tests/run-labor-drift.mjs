#!/usr/bin/env node
// Test harness for the Labor Drift parser. Verifies early-clock-ins,
// late-clock-outs, OT estimate, ghost-shift detection on a synthetic
// 7shifts-style timesheet export.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSync } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));

const bundle = buildSync({
  entryPoints: [join(__dirname, '..', 'src', 'lib', 'laborDriftCsv.ts')],
  bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022',
});
const data = 'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64');
const { runLaborDrift } = await import(data);

const fixture = readFileSync(join(__dirname, 'fixtures', 'timesheet-labor.csv'), 'utf8');
const result = runLaborDrift(fixture);

if ('error' in result) {
  console.error('✗ FAIL  Labor Drift returned error:', result.error);
  process.exit(1);
}

console.log(`Timesheet · ${result.shifts} shifts · ${result.employees} employees · ${result.stores.length} stores`);
console.log(`  Total drift: ${result.totalDriftMinutes} min · est $${result.totalDriftDollars} · ratio ${(result.driftRatio * 100).toFixed(2)}%`);
console.log(`  Ghost shifts flagged: ${result.ghostShifts.length}`);
console.log('');

let pass = 0, fail = 0;
const cases = [
  {
    name: 'James Wilson · 4 early clock-ins (avg ~21 min early)',
    ok: (() => {
      const j = result.perEmployee.find((e) => e.name === 'James Wilson');
      return j && j.earlyClockIns === 4 && j.earlyMinutes >= 60;
    })(),
    actual: result.perEmployee.find((e) => e.name === 'James Wilson')
      ? `early=${result.perEmployee.find((e) => e.name === 'James Wilson').earlyClockIns} earlyMin=${result.perEmployee.find((e) => e.name === 'James Wilson').earlyMinutes}`
      : '(not found)',
  },
  {
    name: 'James Wilson · top OT offender (most totalOtMinutes)',
    ok: result.perEmployee[0]?.name === 'James Wilson',
    actual: `top=${result.perEmployee[0]?.name}(${result.perEmployee[0]?.totalOtMinutes}min)`,
  },
  {
    name: 'Aisha Chen · ghost shift (6 hr clocked, zero sales)',
    ok: result.ghostShifts.some((g) => g.name === 'Aisha Chen' && g.clockedMinutes >= 360),
    actual: result.ghostShifts.map((g) => `${g.name}:${g.clockedMinutes}min`).join(' · '),
  },
  {
    name: 'Maria Rodriguez · within tolerance (no early/late flags)',
    ok: (() => {
      const m = result.perEmployee.find((e) => e.name === 'Maria Rodriguez');
      return m && m.earlyClockIns === 0 && m.lateClockOuts === 0;
    })(),
    actual: result.perEmployee.find((e) => e.name === 'Maria Rodriguez')
      ? `early=${result.perEmployee.find((e) => e.name === 'Maria Rodriguez').earlyClockIns} late=${result.perEmployee.find((e) => e.name === 'Maria Rodriguez').lateClockOuts}`
      : '(not found)',
  },
  {
    name: 'OT $ estimate accounts for actual wage rate',
    ok: result.totalDriftDollars > 50 && result.totalDriftDollars < 500,
    actual: `$${result.totalDriftDollars} on ~${(result.totalDriftMinutes / 60).toFixed(1)} hr drift`,
  },
];

for (const c of cases) {
  if (c.ok) { pass++; console.log(`✓ PASS  ${c.name}\n        ${c.actual}\n`); }
  else { fail++; console.log(`✗ FAIL  ${c.name}\n        actual: ${c.actual}\n`); }
}

console.log('═'.repeat(70));
console.log(`Results: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
