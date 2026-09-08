/**
 * POS + report-family adapter contract.
 *
 * Toast ships first (NAG ground truth). Next POS is a new adapter in this
 * registry — not a fork of the desk. Honesty spine is enforced by the desk:
 * Verified | Estimated (show math) | Missing. Never invent $.
 * Taco Bomba / related-not-nag sheets are training shapes only — off NAG Qs.
 *
 * Add a POS:
 * 1. registerReportAdapter({ pos, family, detect, parse })
 * 2. parse returns a fact pack or null — null invents no dollars
 * 3. classifyUpload / reportSourceTags pick it up automatically
 * Do not edit compose chrome or onboard to add Square/Clover/Sysco.
 */

export const REPORT_POS = [
  'toast',
  'pdq',
  'square',
  'clover',
  'aloha',
  'lightspeed',
  'sysco',
  'us-foods',
  'hy-vee',
  'humes',
  'pfg',
  'pepsi',
  'fort-dodge',
  'confluence',
  'northern-lights',
  'other',
] as const;

export type ReportPos = (typeof REPORT_POS)[number];

export const TOAST_REPORT_FAMILIES = [
  'sales-summary',
  'labor-breakdown',
  'time-entries',
  'item-selection',
] as const;

export const PDQ_REPORT_FAMILIES = [
  'z-summary',
  'hourly',
  'void-promo',
] as const;

export type ToastReportFamily = (typeof TOAST_REPORT_FAMILIES)[number];
export type PdqReportFamily = (typeof PDQ_REPORT_FAMILIES)[number];

export type ReportFamily =
  | ToastReportFamily
  | PdqReportFamily
  | 'invoice'
  | 'catalog'
  | 'order-email'
  | 'charge-slip'
  | 'monday-batch'
  | 'unknown';

export type ReportAdapterHit = {
  pos: ReportPos;
  family: ReportFamily;
};

export type ReportAdapter<TPack> = {
  pos: ReportPos;
  family: ReportFamily;
  detect(filename: string, text?: string): boolean;
  parse(text: string, filename: string): TPack | null;
};

export type ReportFactPack = { pos?: string; family: string; filename?: string };

/** Planned seats — hooks only. Do not parse or invent dollars here. */
export const PLANNED_REPORT_ADAPTERS: readonly {
  pos: ReportPos;
  family: ReportFamily;
  status: 'hook' | 'registered';
  note: string;
}[] = [
  { pos: 'pdq', family: 'z-summary', status: 'registered', note: 'PDQ ZReport_Summary — pdqEodParse, registered this PR.' },
  { pos: 'pdq', family: 'hourly', status: 'registered', note: 'PDQ Hourly_Sales_Report — pdqEodParse, registered this PR.' },
  { pos: 'pdq', family: 'void-promo', status: 'registered', note: 'PDQ Void_Promo — pdqEodParse, registered this PR.' },
  { pos: 'hy-vee', family: 'invoice', status: 'registered', note: 'Hy-Vee Wine papers-in (order/slip/invoice/Monday batch).' },
  { pos: 'square', family: 'sales-summary', status: 'hook', note: 'Next adapter: Square sales CSV. Not in this PR.' },
  { pos: 'clover', family: 'sales-summary', status: 'hook', note: 'Next adapter: Clover sales export. Not in this PR.' },
  { pos: 'aloha', family: 'sales-summary', status: 'hook', note: 'Next adapter: Aloha sales. Not in this PR.' },
  { pos: 'lightspeed', family: 'sales-summary', status: 'hook', note: 'Next adapter: Lightspeed sales. Not in this PR.' },
  { pos: 'sysco', family: 'invoice', status: 'hook', note: 'Later wave: weekly Tue or Fri photo OCR. Soft zero-week nudge. No parse, no $.' },
  { pos: 'us-foods', family: 'invoice', status: 'hook', note: 'At-scale same pattern as PFG (order match + 21-day EFT). Hook only.' },
  { pos: 'pfg', family: 'invoice', status: 'hook', note: 'Later wave: Tue+Fri trucks, Seat 2 day-before, email↔invoice match, 21-day EFT. No parse, no $.' },
  { pos: 'pepsi', family: 'invoice', status: 'hook', note: 'Later wave: every-other-week photo OCR. First week papers-in, not savings/CO2. No parse, no $.' },
  { pos: 'fort-dodge', family: 'invoice', status: 'hook', note: 'Later wave: Miller/Coors Tue photo-only, never email. MOD Tue/Wed snap flag. No parse, no $.' },
  { pos: 'confluence', family: 'invoice', status: 'hook', note: 'Later wave: kegs + empties photo credits. Photo proof, not empties-as-cash $. No parse, no $.' },
  { pos: 'northern-lights', family: 'invoice', status: 'hook', note: 'Later wave: inv# dedup primary, vendor+total red flag, multi-sender ignore. No parse, no $.' },
  { pos: 'humes', family: 'invoice', status: 'hook', note: 'Later wave after PDQ/Hy-Vee (Tue+Fri AP email + photo OCR). No parse, no $.' },
];
