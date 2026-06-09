#!/usr/bin/env node
// Test harness for the CSV Void Hunter parser. Runs every fixture in
// ./fixtures through runVoidHunter and reports PASS / FAIL.
//
// Usage: node tests/run-void-hunter.mjs
//
// Compiles the TS source on-the-fly via the tsx loader if available;
// falls back to a quick transpile via esbuild if not.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { register } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));

let runVoidHunter;
try {
  register('tsx/esm', import.meta.url);
} catch {}
try {
  const mod = await import(join(__dirname, '..', 'src', 'lib', 'voidHunterCsv.ts'));
  runVoidHunter = mod.runVoidHunter;
} catch (e) {
  // tsx not available — compile the TS source with esbuild ad-hoc.
  const { transformSync } = await import('esbuild');
  const src = readFileSync(join(__dirname, '..', 'src', 'lib', 'voidHunterCsv.ts'), 'utf8');
  const out = transformSync(src, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
  const data = 'data:text/javascript;base64,' + Buffer.from(out).toString('base64');
  const mod = await import(data);
  runVoidHunter = mod.runVoidHunter;
}

const usd = (n) => '$' + Math.round(n).toLocaleString();
const pct = (n) => (n * 100).toFixed(2) + '%';

const TESTS = [
  {
    name: 'Toast · employee performance · quoted $ values · 15 rows · 4 stores',
    fixture: 'toast-employee-performance.csv',
    expect: { ok: true, minStores: 4, minRows: 15, flaggedAtLeast: 1 },
  },
  {
    name: 'Square · employee summary · unquoted decimals · 9 rows · 3 stores',
    fixture: 'square-employee-summary.csv',
    expect: { ok: true, minStores: 3, minRows: 9, flaggedAtLeast: 1 },
  },
  {
    name: 'PDQ · employee report · "Site" + "Cashier Name" + "Voided Sales" headers',
    fixture: 'pdq-employee-report.csv',
    expect: { ok: true, minStores: 3, minRows: 10, flaggedAtLeast: 1 },
  },
  {
    name: 'Clover · double-quoted everything · $ + comma values',
    fixture: 'clover-employee-export.csv',
    expect: { ok: true, minStores: 2, minRows: 6, flaggedAtLeast: 1 },
  },
  {
    name: 'UTF-8 BOM · leading "Notes" column · multiple stores',
    fixture: 'utf8-bom-and-extras.csv',
    expect: { ok: true, minStores: 2, minRows: 6, flaggedAtLeast: 1 },
  },
  {
    name: 'Mixed-case / underscored headers (store_name, EMPLOYEE)',
    fixture: 'mixed-case-headers.csv',
    expect: { ok: true, minStores: 2, minRows: 4, flaggedAtLeast: 1 },
  },
  {
    name: 'Single store · no peer to compare to · should not flag',
    fixture: 'single-store-no-flag.csv',
    expect: { ok: true, minStores: 1, minRows: 3, flaggedExactly: 0 },
  },
  {
    name: 'Empty file · should fail cleanly',
    fixture: 'empty-file.csv',
    expect: { ok: false },
  },
  {
    name: 'Headers only · no data rows · should fail cleanly',
    fixture: 'headers-only.csv',
    expect: { ok: false },
  },
  {
    name: 'Bad headers · should fail with hint',
    fixture: 'bad-headers.csv',
    expect: { ok: false },
  },
];

let pass = 0, fail = 0;
const failures = [];

for (const t of TESTS) {
  const csv = readFileSync(join(__dirname, 'fixtures', t.fixture), 'utf8');
  const result = runVoidHunter(csv);

  let ok = true;
  let detail = '';

  if (t.expect.ok === true) {
    if ('error' in result) {
      ok = false; detail = `expected success but got error: ${result.error}`;
    } else {
      if (t.expect.minStores && result.stores.length < t.expect.minStores) {
        ok = false; detail = `stores: ${result.stores.length} < expected ${t.expect.minStores}`;
      }
      if (ok && t.expect.minRows && result.rowsParsed < t.expect.minRows) {
        ok = false; detail = `rowsParsed: ${result.rowsParsed} < expected ${t.expect.minRows}`;
      }
      if (ok && t.expect.flaggedAtLeast && result.storesFlagged < t.expect.flaggedAtLeast) {
        ok = false; detail = `storesFlagged: ${result.storesFlagged} < expected ${t.expect.flaggedAtLeast}`;
      }
      if (ok && t.expect.flaggedExactly !== undefined && result.storesFlagged !== t.expect.flaggedExactly) {
        ok = false; detail = `storesFlagged: ${result.storesFlagged} != expected ${t.expect.flaggedExactly}`;
      }
    }
  } else if (t.expect.ok === false) {
    if (!('error' in result)) {
      ok = false; detail = 'expected error but got success';
    }
  }

  if (ok) {
    pass++;
    console.log(`✓ PASS  ${t.name}`);
    if ('rowsParsed' in result) {
      console.log(`        rows=${result.rowsParsed}  stores=${result.stores.length}  flagged=${result.storesFlagged}  network=${usd(result.networkNet)}  voidRate=${pct(result.networkVoidRate)}  median=${pct(result.medianStoreVoidRate)}`);
      const above = result.stores.filter((s) => s.flagged).map((s) => `${s.name} @ ${pct(s.voidRate)}`).join(', ') || 'none';
      console.log(`        flagged stores: ${above}`);
    } else {
      console.log(`        error: ${result.error}`);
      if (result.detectedColumns) console.log(`        detected cols: ${result.detectedColumns.join(', ')}`);
    }
  } else {
    fail++;
    failures.push({ name: t.name, detail, result });
    console.log(`✗ FAIL  ${t.name}`);
    console.log(`        ${detail}`);
  }
  console.log('');
}

console.log('═'.repeat(70));
console.log(`Results: ${pass} pass · ${fail} fail`);
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}
