/**
 * Restaurant-paper classifier. Filename and subject are a direct read (Verified).
 * A hit that exists only in the body is Estimated. No match stays out of the review.
 */

import {
  PAPERS_SCAN_LOOKBACK_DAYS,
  type PapersFieldHonesty,
  type PapersScanCategory,
} from '@/lib/papersScanTypes';

const RULES: Array<{ id: PapersScanCategory; re: RegExp }> = [
  { id: 'delivery-app', re: /\b(doordash|uber\s*eats|ubereats|grubhub|grub\s*hub)\b/i },
  { id: 'labor', re: /\b(timesheets?|time\s*sheets?|time\s*clock|timeclock|punches?|labor\s*report|employee\s*hours)\b/i },
  { id: 'eod-z', re: /\b(z[-\s]?reports?|end\s+of\s+day|\beod\b|sales\s*summary|hourly\s*sales)\b/i },
  { id: 'liquor-beer', re: /\b(liquor|beer|wine|kegs?|beverage)\b/i },
  { id: 'menu-recipe', re: /\b(recipes?|menus?|plate\s*cost|prep\s*sheets?)\b/i },
  { id: 'vendor-invoice', re: /\b(invoices?|vendor\s*bill|\bskus?\b)\b/i },
];

export function classifyRestaurantPaper(input: {
  filename: string;
  subject?: string;
  text?: string;
}): { category: PapersScanCategory | null; honesty: PapersFieldHonesty } {
  const name = `${input.filename ?? ''}\n${input.subject ?? ''}`;
  const body = input.text ?? '';
  for (const rule of RULES) {
    if (rule.re.test(name)) return { category: rule.id, honesty: 'Verified' };
  }
  for (const rule of RULES) {
    if (rule.re.test(body)) return { category: rule.id, honesty: 'Estimated' };
  }
  return { category: null, honesty: 'Missing' };
}

export function buildPapersScanGmailQuery(): string {
  return [
    `newer_than:${PAPERS_SCAN_LOOKBACK_DAYS}d`,
    '(filename:invoice OR filename:eod OR filename:z-report OR filename:zreport OR filename:labor',
    'OR filename:timesheet OR filename:menu OR filename:recipe OR filename:doordash OR filename:grubhub',
    'OR filename:ubereats OR filename:beer OR filename:liquor OR filename:csv OR filename:xlsx',
    'OR subject:invoice OR subject:EOD OR subject:"Z report" OR subject:timesheet OR subject:labor',
    'OR subject:doordash OR subject:grubhub OR subject:"uber eats" OR subject:recipe OR subject:menu',
    'OR subject:beer OR subject:liquor OR subject:keg)',
  ].join(' ');
}
