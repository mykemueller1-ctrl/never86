import {
  detectToastFamily,
  parseToastReport,
  type ToastFactPack,
  type ToastFamily,
} from '@/lib/toastParse';
import {
  PLANNED_REPORT_ADAPTERS,
  TOAST_REPORT_FAMILIES,
  type ReportAdapter,
  type ReportAdapterHit,
  type ReportFamily,
  type ReportPos,
} from './types';

const adapters: ReportAdapter<ToastFactPack>[] = [];

function toastAdapter(family: ToastFamily): ReportAdapter<ToastFactPack> {
  return {
    pos: 'toast',
    family,
    detect(filename, text) {
      return detectToastFamily(filename, text) === family;
    },
    parse(text, filename) {
      const pack = parseToastReport(text, filename);
      return pack?.family === family ? pack : null;
    },
  };
}

for (const family of TOAST_REPORT_FAMILIES) {
  adapters.push(toastAdapter(family));
}

export function listReportAdapters(): readonly ReportAdapter<ToastFactPack>[] {
  return adapters;
}

export function registerReportAdapter(adapter: ReportAdapter<ToastFactPack>): void {
  const dup = adapters.find((row) => row.pos === adapter.pos && row.family === adapter.family);
  if (dup) return;
  adapters.push(adapter);
}

export function unregisterReportAdapter(pos: ReportPos, family: ReportFamily): void {
  if (pos === 'toast' && (TOAST_REPORT_FAMILIES as readonly string[]).includes(family)) return;
  const idx = adapters.findIndex((row) => row.pos === pos && row.family === family);
  if (idx >= 0) adapters.splice(idx, 1);
}

export function detectReport(filename: string, text = ''): ReportAdapterHit | null {
  for (const adapter of adapters) {
    if (adapter.detect(filename, text)) {
      return { pos: adapter.pos, family: adapter.family };
    }
  }
  return null;
}

export function parseRegisteredReport(text: string, filename: string): ToastFactPack | null {
  const hit = detectReport(filename, text);
  if (!hit) return null;
  const adapter = adapters.find((row) => row.pos === hit.pos && row.family === hit.family);
  return adapter?.parse(text, filename) ?? null;
}

export function isRegisteredPosFamily(pos: ReportPos, family: ReportFamily): boolean {
  return adapters.some((row) => row.pos === pos && row.family === family);
}

export function plannedReportAdapterHooks(): typeof PLANNED_REPORT_ADAPTERS {
  return PLANNED_REPORT_ADAPTERS;
}
