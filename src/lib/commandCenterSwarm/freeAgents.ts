import { AGENT_SPECS } from '../agentSpecs';
import { runBeverageCostScore } from '../beverageScoreCsv';
import { runCateringLeak } from '../cateringLeakCsv';
import { runLaborDrift } from '../laborDriftCsv';
import { runLeakDetector } from '../leakDetectorCsv';
import { runRateCardAudit } from '../rateCardAuditCsv';
import { runShiftPulse } from '../shiftPulseCsv';
import { runThreePFeeFinder } from '../threePFeeFinderCsv';
import { runTipVariance } from '../tipVarianceCsv';
import { runVendorDrift } from '../vendorDriftCsv';
import { runVoidHunter } from '../voidHunterCsv';
import { defendFile } from './gates';
import type { AgentRunRecord, EvidenceState, FreeAgentSlug } from './types';
import { FREE_AGENT_SLUGS } from './types';

export type FreeAgentRunner = (csv: string) => unknown;

export const FREE_AGENT_RUNNERS: Record<FreeAgentSlug, FreeAgentRunner> = {
  'void-hunter': runVoidHunter,
  'leak-detector': runLeakDetector,
  '3p-fee-finder': runThreePFeeFinder,
  'labor-leak': runLaborDrift,
  'tip-variance': runTipVariance,
  'catering-leak': runCateringLeak,
  'rate-card-audit': runRateCardAudit,
  'beverage-score': runBeverageCostScore,
  'vendor-drift': runVendorDrift,
  'shift-pulse': runShiftPulse,
};

export type FreeAgentRun = {
  record: AgentRunRecord;
  raw: unknown | null;
};

function isErrorPayload(value: unknown): value is { ok: false; error: string; hint?: string } {
  return Boolean(value && typeof value === 'object' && 'ok' in value && (value as { ok?: unknown }).ok === false);
}

function rowsParsedOf(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const rows = (value as { rowsParsed?: unknown }).rowsParsed;
  return typeof rows === 'number' ? rows : undefined;
}

function summarize(slug: FreeAgentSlug, raw: unknown): { summary: string; missing: string[]; state: EvidenceState } {
  if (isErrorPayload(raw)) {
    return { summary: raw.error, missing: raw.hint ? [raw.hint] : [], state: 'missingEvidence' };
  }
  switch (slug) {
    case 'void-hunter': {
      const r = raw as { storesFlagged?: number; rowsParsed?: number };
      return {
        summary: `Parsed ${r.rowsParsed ?? 0} rows. ${r.storesFlagged ?? 0} store(s) above this file's own peer median. Pattern only — not a verdict.`,
        missing: ['Final employee-performance export for the same store and period.'],
        state: 'unverified',
      };
    }
    case 'leak-detector': {
      const r = raw as { employees?: unknown[] };
      return {
        summary: `Ticket signals computed for ${r.employees?.length ?? 0} name(s). Review only — not theft.`,
        missing: ['Ticket-level exception detail with tender, void, and timestamp.'],
        state: 'unverified',
      };
    }
    case '3p-fee-finder': {
      const r = raw as { rows?: Array<{ observedMarketplaceCostPct: number; platform: string }> };
      const first = r.rows?.[0];
      return {
        summary: first
          ? `${first.platform || 'Marketplace'} observed cost ${first.observedMarketplaceCostPct.toFixed(1)}% of eligible sales. Statement math only.`
          : 'No statement rows.',
        missing: ['Finalized statement; contract only for a rate-card test; bank deposit for a cash claim.'],
        state: 'unverified',
      };
    }
    case 'labor-leak': {
      const r = raw as { totalDriftMinutes?: number; ghostShifts?: unknown[] };
      return {
        summary: `${Math.round(r.totalDriftMinutes ?? 0)} OT-drift minutes. ${r.ghostShifts?.length ?? 0} ghost-shift candidate(s). Clock vs schedule, not a payroll verdict.`,
        missing: ['Approved schedule, final time clock, and wage basis.'],
        state: 'unverified',
      };
    }
    case 'tip-variance': {
      const r = raw as { perEmployee?: Array<{ flagged?: boolean }> };
      const flagged = r.perEmployee?.filter((e) => e.flagged).length ?? 0;
      return {
        summary: `${flagged} name(s) with a week-over-week tip-rate drop on the supplied file.`,
        missing: ['Tip summary for two complete comparable weeks.'],
        state: 'unverified',
      };
    }
    case 'catering-leak': {
      const r = raw as { totalGap?: number; unmatchedOrders?: unknown[] };
      return {
        summary: `Invoice-vs-POS gap ${r.totalGap != null ? `$${r.totalGap.toFixed(2)}` : 'n/a'}. ${r.unmatchedOrders?.length ?? 0} unmatched order(s).`,
        missing: ['Matching invoice and POS catering tickets for the same events.'],
        state: 'unverified',
      };
    }
    case 'rate-card-audit': {
      const r = raw as { rows?: Array<{ status: string }> };
      const status = r.rows?.[0]?.status ?? 'unresolved';
      return {
        summary: `Rate-card test status: ${status}. No overcharge claim is made from this file alone.`,
        missing: ['Governing agreement and the statement fee base for the same store and period.'],
        state: status === 'unresolved' ? 'missingEvidence' : 'unverified',
      };
    }
    case 'beverage-score': {
      const r = raw as { networkBcsScore?: number };
      return {
        summary: `Beverage Cost Score ${r.networkBcsScore ?? 'n/a'} from inventory-vs-pour units. Not actual food cost.`,
        missing: ['Complete physical count plus POS pour export for the same close.'],
        state: 'unverified',
      };
    }
    case 'vendor-drift': {
      const r = raw as { flaggedSkus?: number; totalDriftDollars?: number };
      return {
        summary: `${r.flaggedSkus ?? 0} SKU(s) with >5% upward drift. Invoice price movement, not COGS.`,
        missing: ['Prior-period and current-period invoice lines for the same SKU and pack.'],
        state: 'unverified',
      };
    }
    case 'shift-pulse': {
      const r = raw as { pacingPct?: number; shift?: string };
      return {
        summary: `${r.shift || 'Shift'} pacing ${r.pacingPct != null ? `${r.pacingPct.toFixed(0)}%` : 'n/a'} of forecast. Unverified typed figures.`,
        missing: ['POS close and the operator-approved forecast for the same shift.'],
        state: 'unverified',
      };
    }
  }
}

export function runFreeAgent(
  slug: FreeAgentSlug,
  csv: string,
  lastRunAt: string,
): FreeAgentRun {
  const spec = AGENT_SPECS.find((a) => a.slug === slug);
  const name = spec?.name ?? slug;
  const defense = defendFile(`${slug}.csv`, csv);

  if (defense.label === 'EMPTY') {
    return {
      raw: null,
      record: {
        slug,
        name,
        team: 'free-agent',
        status: 'missing-evidence',
        lastRunAt,
        sourceStatus: 'missingEvidence',
        summary: `No CSV for ${name}.`,
        injectionSuspected: false,
        secretBlocked: false,
        portalLoginRequired: false,
        sendStatus: 'not-applicable',
        missingEvidence: [spec?.needs ?? 'CSV export'],
      },
    };
  }

  if (defense.label === 'SECRET_BLOCKED') {
    return {
      raw: null,
      record: {
        slug,
        name,
        team: 'free-agent',
        status: 'secret-blocked',
        lastRunAt,
        sourceStatus: 'missingEvidence',
        summary: defense.note,
        injectionSuspected: false,
        secretBlocked: true,
        portalLoginRequired: false,
        sendStatus: 'not-applicable',
        missingEvidence: ['A redacted report or CSV — not a password, key, or portal login.'],
      },
    };
  }

  const raw = FREE_AGENT_RUNNERS[slug](csv);
  const parsed = summarize(slug, raw);
  const injection = defense.injectionSuspected;
  const failed = isErrorPayload(raw);

  return {
    raw,
    record: {
      slug,
      name,
      team: 'free-agent',
      status: injection ? 'injection-review' : failed ? 'missing-evidence' : 'ran',
      lastRunAt,
      sourceStatus: parsed.state,
      summary: injection
        ? `INJECTION_SUSPECTED. ${parsed.summary} Embedded instructions were ignored.`
        : parsed.summary,
      rowsParsed: rowsParsedOf(raw),
      injectionSuspected: injection,
      secretBlocked: false,
      portalLoginRequired: false,
      sendStatus: 'not-applicable',
      missingEvidence: parsed.missing,
      claimBoundary: spec?.intro,
    },
  };
}

export function listWiredFreeAgents(): Array<{ slug: FreeAgentSlug; name: string; csvRunnable: true; portalLogin: false }> {
  return FREE_AGENT_SLUGS.map((slug) => ({
    slug,
    name: AGENT_SPECS.find((a) => a.slug === slug)?.name ?? slug,
    csvRunnable: true,
    portalLogin: false,
  }));
}
