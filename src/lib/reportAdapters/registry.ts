import {
  detectToastFamily,
  parseToastReport,
  type ToastFactPack,
  type ToastFamily,
} from '@/lib/toastParse';
import {
  detectPdqFamily,
  parsePdqReport,
  type PdqFactPack,
} from '@/lib/pdqEodParse';
import {
  detectHyveeFamily,
  parseHyveeWineReport,
  HYVEE_REPORT_FAMILIES,
  type HyveeFactPack,
  type HyveeFamily,
} from '@/lib/hyveeWineParse';
import {
  PLANNED_REPORT_ADAPTERS,
  TOAST_REPORT_FAMILIES,
  PDQ_REPORT_FAMILIES,
  type ReportAdapter,
  type ReportAdapterHit,
  type ReportFamily,
  type ReportPos,
} from './types';

export type RegisteredFactPack = ToastFactPack | PdqFactPack | HyveeFactPack;

const adapters: ReportAdapter<RegisteredFactPack>[] = [];

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

function pdqAdapter(family: (typeof PDQ_REPORT_FAMILIES)[number]): ReportAdapter<PdqFactPack> {
  return {
    pos: 'pdq',
    family,
    detect(filename, text) {
      return detectPdqFamily(filename, text ?? '') === family;
    },
    parse(text, filename) {
      const pack = parsePdqReport(text, filename);
      return pack?.family === family ? pack : null;
    },
  };
}

function hyveeAdapter(family: HyveeFamily): ReportAdapter<HyveeFactPack> {
  return {
    pos: 'hy-vee',
    family,
    detect(filename, text) {
      return detectHyveeFamily(filename, text ?? '') === family;
    },
    parse(text, filename) {
      const pack = parseHyveeWineReport(text, filename);
      return pack?.family === family ? pack : null;
    },
  };
}

for (const family of TOAST_REPORT_FAMILIES) {
  adapters.push(toastAdapter(family));
}
for (const family of PDQ_REPORT_FAMILIES) {
  adapters.push(pdqAdapter(family));
}
for (const family of HYVEE_REPORT_FAMILIES) {
  adapters.push(hyveeAdapter(family));
}

const locked = new Set(
  [
    ...TOAST_REPORT_FAMILIES.map((family) => `toast:${family}`),
    ...PDQ_REPORT_FAMILIES.map((family) => `pdq:${family}`),
    ...HYVEE_REPORT_FAMILIES.map((family) => `hy-vee:${family}`),
  ],
);

export function listReportAdapters(): readonly ReportAdapter<RegisteredFactPack>[] {
  return adapters;
}

export function registerReportAdapter(adapter: ReportAdapter<RegisteredFactPack>): void {
  const dup = adapters.find((row) => row.pos === adapter.pos && row.family === adapter.family);
  if (dup) return;
  adapters.push(adapter);
}

export function unregisterReportAdapter(pos: ReportPos, family: ReportFamily): void {
  if (locked.has(`${pos}:${family}`)) return;
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

export function parseRegisteredReport(text: string, filename: string): RegisteredFactPack | null {
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
