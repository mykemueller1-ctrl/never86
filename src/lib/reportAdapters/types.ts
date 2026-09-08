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
  { pos: 'sysco', family: 'invoice', status: 'hook', note: 'Vendor silo: Sysco invoice/catalog. Not in this PR.' },
  { pos: 'us-foods', family: 'invoice', status: 'hook', note: 'Vendor silo: US Foods invoice/catalog. Not in this PR.' },
  { pos: 'humes', family: 'invoice', status: 'hook', note: 'Humes INV PDFs — out of this PR. Hy-Vee first. No parse, no $.' },
];
