/**
 * Literal totals read off staged vendor papers (MCP OCR, not site Gmail).
 * A paper matches only when its own text contains the id and that exact amount.
 * No other dollar amount is filled in.
 */

export type StagedVendorPaper = {
  id: string;
  folder: 'invoices' | 'z-eod';
  note: string;
  line: string;
};

type Fixture = StagedVendorPaper & {
  needles: string[];
  amounts: string[][];
};

const FIXTURES: Fixture[] = [
  {
    id: 'vestis-6340606762',
    folder: 'invoices',
    needles: ['6340606762'],
    amounts: [['256.90']],
    line: 'Vestis 6340606762 TOTAL DUE $256.90 (09/17/2026)',
    note: 'Vestis 6340606762 TOTAL DUE $256.90 (09/17/2026). Estimated from the staged paper. Not recovered cash.',
  },
  {
    id: 'pfg-cedar-rapids-2026-09-17',
    folder: 'invoices',
    needles: ['pfg', '09/17/26'],
    amounts: [['19,354.85', '19354.85']],
    line: 'PFG Cedar Rapids 09/17/26 TOTAL DUE $19,354.85',
    note: 'PFG Cedar Rapids 09/17/26 TOTAL DUE $19,354.85. Estimated from the staged paper. Not recovered cash.',
  },
  {
    id: 'pepsi-grayhawk-10780288',
    folder: 'invoices',
    needles: ['10780288'],
    amounts: [['0.00'], ['541.50']],
    line: 'PepsiCo/Grayhawk 10780288 Total Amount $0.00 (list $541.50 not charged)',
    note: 'PepsiCo/Grayhawk 10780288 Total Amount $0.00. List $541.50 was not charged. Estimated from the staged paper.',
  },
  {
    id: 'pfg-drive-2026-08-27',
    folder: 'invoices',
    needles: ['pfg', '08/27/26'],
    amounts: [['17,588.80', '17588.80']],
    line: 'Drive PFG 08/27/26 TOTAL DUE $17,588.80',
    note: 'Drive PFG 08/27/26 TOTAL DUE $17,588.80. Estimated from the staged paper. Not recovered cash.',
  },
  {
    id: 'pdq-z-2026-09-21',
    folder: 'z-eod',
    needles: ['pdq', '9/21/2026'],
    amounts: [['3,710.90', '3710.90']],
    line: 'PDQ Z 9/21/2026 Grand Total $3,710.90',
    note: 'PDQ Z 9/21/2026 Grand Total $3,710.90. Estimated. POS ≠ payout.',
  },
];

function blob(text: string, filename: string): string {
  return `${filename}\n${text}`.toLowerCase();
}

function hasDate(text: string, slash: string): boolean {
  const [month, day, year] = slash.split('/');
  const shortYear = year.length === 4 ? year.slice(2) : year;
  const longYear = year.length === 2 ? `20${year}` : year;
  const patterns = [
    `${month}/${day}/${shortYear}`,
    `${month}/${day}/${longYear}`,
    `${Number(month)}/${Number(day)}/${shortYear}`,
    `${Number(month)}/${Number(day)}/${longYear}`,
  ];
  const lower = text.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern));
}

function hasAmount(text: string, amount: string): boolean {
  return text.includes(amount);
}

export function matchStagedVendorPaper(text: string, filename = ''): StagedVendorPaper | null {
  const haystack = blob(text, filename);
  const hits = FIXTURES.filter((fixture) => {
    const idsOk = fixture.needles.every((needle) => {
      if (needle.includes('/')) return hasDate(haystack, needle);
      return haystack.includes(needle.toLowerCase());
    });
    if (!idsOk) return false;
    return fixture.amounts.every((group) => group.some((amount) => hasAmount(text, amount) || hasAmount(filename, amount)));
  });
  if (hits.length !== 1) return null;
  const hit = hits[0];
  return { id: hit.id, folder: hit.folder, note: hit.note, line: hit.line };
}
