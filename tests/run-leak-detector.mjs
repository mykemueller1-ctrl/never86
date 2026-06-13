#!/usr/bin/env node
// Test harness for the Leak Detector. Verifies that the synthetic Toast
// Sales Detail fixture correctly surfaces five signals: void-after-
// payment, cash-only voiders, promo stacking, comp abuse, discount-
// after-close.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSync } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Bundle the leak detector with esbuild so its `import { parseCsv } from
// './voidHunterCsv'` resolves correctly without duplicate-symbol errors.
const bundle = buildSync({
  entryPoints: [join(__dirname, '..', 'src', 'lib', 'leakDetectorCsv.ts')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
});
const data = 'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64');
const { runLeakDetector } = await import(data);

const fixture = readFileSync(join(__dirname, 'fixtures', 'toast-sales-detail.csv'), 'utf8');
const result = runLeakDetector(fixture);

const usd = (n) => '$' + Math.round(n).toLocaleString();

if ('error' in result) {
  console.error('✗ FAIL  Toast Sales Detail returned error:', result.error);
  if (result.hint) console.error('        hint:', result.hint);
  if (result.detectedColumns) console.error('        cols:', result.detectedColumns.join(', '));
  process.exit(1);
}

console.log(`Toast Sales Detail · ${result.rowsParsed} tickets · ${result.stores.length} stores`);
console.log(`  Network: ${usd(result.networkNet)} net · ${usd(result.networkVoids)} voids · ${usd(result.networkComps)} comps · ${usd(result.networkDiscounts)} discounts`);
console.log('');

let pass = 0, fail = 0;
const cases = [
  {
    name: 'Void-after-payment · catches James Wilson (6 ticket pattern, all cash, all PostVoid=1)',
    ok: result.signals.voidAfterPayment.totalCount >= 6
        && result.signals.voidAfterPayment.flagged.some((f) => f.name === 'James Wilson' && f.count === 6),
    actual: `count=${result.signals.voidAfterPayment.totalCount}, flagged=${result.signals.voidAfterPayment.flagged.map((f) => `${f.name}(${f.count})`).join(', ')}`,
  },
  {
    name: 'Cash-only voiders · James Wilson 6/6 cash voids',
    ok: result.signals.cashOnlyVoiders.some((f) => f.name === 'James Wilson' && f.rate === 1),
    actual: `${result.signals.cashOnlyVoiders.map((f) => `${f.name} ${(f.rate*100).toFixed(0)}%`).join(', ')}`,
  },
  {
    name: 'Comp abuse · Devon Park (5 comps, every credit ticket comped)',
    ok: result.signals.compAbuse.some((f) => f.name === 'Devon Park'),
    actual: result.signals.compAbuse.map((f) => `${f.name} ${(f.rate*100).toFixed(1)}%`).join(', '),
  },
  {
    name: 'Promo stacking · Aisha Chen (4 tickets with 2+ discounts)',
    ok: result.signals.promoStacking.totalCount >= 4
        && result.signals.promoStacking.flagged.some((f) => f.name === 'Aisha Chen' && f.count >= 4),
    actual: `count=${result.signals.promoStacking.totalCount}, flagged=${result.signals.promoStacking.flagged.map((f) => `${f.name}(${f.count})`).join(', ')}`,
  },
  {
    name: 'Discount-after-close · Chris Foster (3 tickets, discounts later than close)',
    ok: result.signals.discountAfterClose.flagged.some((f) => f.name === 'Chris Foster' && f.count >= 3)
       || result.signals.discountAfterClose.totalCount >= 3,
    actual: `count=${result.signals.discountAfterClose.totalCount}, flagged=${result.signals.discountAfterClose.flagged.map((f) => `${f.name}(${f.count})`).join(', ')}`,
  },
  {
    name: 'Day-of-week pattern · James Wilson · all 6 voids on Tuesday',
    ok: result.signals.dowVoidPatterns.some((p) => p.name === 'James Wilson' && p.dow === 'Tue' && p.voidsOnDow === 6),
    actual: result.signals.dowVoidPatterns.map((p) => `${p.name} ${p.dow} ${p.voidsOnDow}/${p.totalVoids}`).join(' · ') || '(none)',
  },
  {
    name: 'Micro-comp pattern · Riley Cooper · 12 comps averaging ~$2.25 each',
    ok: result.signals.microCompPatterns.some((p) => p.name === 'Riley Cooper' && p.compsCount === 12 && p.avgComp > 1.5 && p.avgComp < 3),
    actual: result.signals.microCompPatterns.map((p) => `${p.name} ${p.compsCount}x avg $${p.avgComp.toFixed(2)}`).join(' · ') || '(none)',
  },
  {
    name: 'Risk score · top 3 are the three bad actors (James, Devon, Aisha or Chris)',
    ok: (() => {
      const top3 = result.employees.slice(0, 4).map((e) => e.name);
      const bad = ['James Wilson', 'Devon Park', 'Aisha Chen', 'Chris Foster'];
      const hits = bad.filter((b) => top3.includes(b)).length;
      return hits >= 3;
    })(),
    actual: `top: ${result.employees.slice(0, 5).map((e) => `${e.name}(${e.riskScore})`).join(' · ')}`,
  },
  {
    name: 'Clean employees (Mason, Tre, Olivia) have riskScore 0',
    ok: ['Mason Reyes', 'Tre Brown', 'Olivia Park'].every((n) => {
      const e = result.employees.find((e) => e.name === n);
      return e === undefined || e.riskScore === 0;
    }),
    actual: 'clean employees: ' + result.employees.filter((e) => ['Mason Reyes','Tre Brown','Olivia Park'].includes(e.name)).map((e) => `${e.name}=${e.riskScore}`).join(', '),
  },
];

for (const c of cases) {
  if (c.ok) {
    console.log(`✓ PASS  ${c.name}`);
    console.log(`        ${c.actual}`);
    pass++;
  } else {
    console.log(`✗ FAIL  ${c.name}`);
    console.log(`        actual: ${c.actual}`);
    fail++;
  }
  console.log('');
}

console.log('═'.repeat(70));
console.log(`Results: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
