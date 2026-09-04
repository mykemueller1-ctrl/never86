import { BAMBA_STORE_COUNT, listBambaStoreNames } from './roster';
import { assertBambaMemory, assertBambaTenant } from './tenant';
import {
  BAMBA_SWARM_JOB_IDS,
  SALES_LABOR_TENANT_ID,
  type BambaSwarmJobId,
  type BambaSwarmJobResult,
  type BambaSwarmReport,
  type DeskCompleteness,
  type SalesLaborDesk,
} from './types';

export const CHAOS_KILL_JOB_IDS: readonly BambaSwarmJobId[] = ['ticket-time', 'pmix', 'labor'];

const JOB_NOTE: Record<BambaSwarmJobId, string> = {
  ingest: 'Load the Aug 12 Daily parse into Bamba tenant memory.',
  hygiene: 'Reject foreign-tenant tokens before any rollup.',
  'sales-vs-py-fcst': 'Compare CY to PY and forecast at store and region.',
  'traffic-avg-check': 'Checks and average check by store.',
  'catering-leak': 'Catering line with owner and due date.',
  'void-hunter': 'Void ranking against 1.5× this pull peer median.',
  'comp-staff-meal': 'Comp and staff-meal stations, no names.',
  'ticket-time': 'Daypart ticket times from Sheet1.',
  pmix: 'Category mix from the Daily parse.',
  labor: 'Labor desk slot — incomplete unless this job finishes.',
  'coach-card': 'One action per miss. Human sends.',
  'qa-retest': 'Replay canary 125273.41 and Landmark void rank.',
};

export function runBambaSwarm(options: { killJobIds?: readonly BambaSwarmJobId[] } = {}): BambaSwarmReport {
  assertBambaTenant(SALES_LABOR_TENANT_ID);
  const killed = new Set(options.killJobIds ?? []);
  const jobs: BambaSwarmJobResult[] = BAMBA_SWARM_JOB_IDS.map((jobId) => {
    if (killed.has(jobId)) {
      return {
        jobId,
        status: 'killed',
        storeCount: BAMBA_STORE_COUNT,
        note: `${JOB_NOTE[jobId]} Killed mid-run. Desk stays incomplete.`,
      };
    }
    return {
      jobId,
      status: 'done',
      storeCount: BAMBA_STORE_COUNT,
      note: JOB_NOTE[jobId],
    };
  });

  const completeness: DeskCompleteness = killed.size > 0 ? 'incomplete' : 'done';
  const report: BambaSwarmReport = {
    tenantId: SALES_LABOR_TENANT_ID,
    jobCount: 12,
    storeCount: 16,
    killedJobIds: BAMBA_SWARM_JOB_IDS.filter((id) => killed.has(id)),
    jobs,
    completeness,
  };
  if (report.storeCount !== listBambaStoreNames().length) {
    throw new Error('Swarm fan-out drifted from the 16-store Bamba roster.');
  }
  assertBambaMemory(report);
  return report;
}

export function applySwarmToDesk(desk: SalesLaborDesk, swarm: BambaSwarmReport): SalesLaborDesk {
  const completeness = swarm.completeness === 'done' && desk.periods.daily.status === 'verified' ? 'done' : 'incomplete';
  if (swarm.killedJobIds.length > 0 && completeness === 'done') {
    throw new Error('Chaos rule: a killed swarm cannot mark the desk done.');
  }
  return {
    ...desk,
    swarm,
    completeness,
  };
}

export function runChaosSwarm(): BambaSwarmReport {
  if (CHAOS_KILL_JOB_IDS.length !== 3) {
    throw new Error('Chaos harness must kill exactly 3 of 12 jobs.');
  }
  return runBambaSwarm({ killJobIds: CHAOS_KILL_JOB_IDS });
}
