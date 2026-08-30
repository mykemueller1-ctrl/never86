import { NEVER86_OPERATOR_SYSTEM } from '../operatorSystem';
import { SAMPLE_COMPANY_JOBS, routeCompanyJob, type CompanyJob } from './companyRouter';
import { defendFile, queueExternalSend } from './gates';
import { runFreeAgent } from './freeAgents';
import {
  analyzeMargins,
  chooseAction,
  coachFromShift,
  collectSources,
  curateMemory,
  verifyProof,
} from './storeTeam';
import { loadSampleStoreFiles, SAMPLE_STORE_CLOSE } from './sampleStore';
import type { ActionShiftInput } from '../actionShift';
import type { ExternalSendReceipt, FreeAgentSlug, SwarmReport } from './types';
import {
  FREE_AGENT_SLUGS,
  SAMPLE_BUSINESS_DATE,
  SAMPLE_STORE_ID,
  SAMPLE_STORE_NAME,
  SWARM_VERSION,
} from './types';

export type SwarmRunInput = {
  storeId?: string;
  storeName?: string;
  businessDate?: string;
  close?: ActionShiftInput;
  files?: Partial<Record<FreeAgentSlug, string>>;
  companyJobs?: CompanyJob[];
  externalSends?: Array<Parameters<typeof queueExternalSend>[0]>;
};

export function runCommandCenterSwarm(input: SwarmRunInput = {}): SwarmReport {
  const storeName = input.storeName ?? SAMPLE_STORE_NAME;
  const businessDate = input.businessDate ?? SAMPLE_BUSINESS_DATE;
  const close = {
    ...SAMPLE_STORE_CLOSE,
    ...input.close,
    store: input.close?.store ?? storeName,
    businessDate: input.close?.businessDate ?? businessDate,
  };
  const files = input.files ?? loadSampleStoreFiles();
  const lastRunAt = `${businessDate}T12:00:00.000Z`;

  const fileDefenses = FREE_AGENT_SLUGS.map((slug) =>
    defendFile(`${slug}.csv`, files[slug] ?? ''),
  );
  fileDefenses.unshift(defendFile('yesterday-close.json', JSON.stringify(close)));

  const freeRuns = FREE_AGENT_SLUGS.map((slug) => runFreeAgent(slug, files[slug] ?? '', lastRunAt));
  const freeAgents = freeRuns.map((run) => run.record);

  const sourceCollector = collectSources(fileDefenses);
  const marginAnalyst = analyzeMargins(freeAgents);
  const chief = chooseAction(close);
  const coach = coachFromShift(chief.shift);
  const proof = verifyProof(chief.shift);
  const memory = curateMemory(false);

  const companyRoutes = (input.companyJobs ?? SAMPLE_COMPANY_JOBS).map(routeCompanyJob);
  const pendingApprovals: ExternalSendReceipt[] = (input.externalSends ?? [
    {
      kind: 'external_email_send' as const,
      draft: 'Draft vendor follow-up for Sample Store One. Facts only. Do not send.',
    },
  ]).map(queueExternalSend);

  return {
    version: SWARM_VERSION,
    operatorSystem: '3.1.0',
    store: {
      id: input.storeId ?? SAMPLE_STORE_ID,
      name: storeName,
      businessDate,
    },
    ranAt: lastRunAt,
    loop: NEVER86_OPERATOR_SYSTEM.loop.map((step) => step.stage),
    fileDefenses,
    freeAgents,
    storeTeam: [sourceCollector, marginAnalyst, chief.specialist, coach, proof, memory],
    companyRoutes,
    actionShift: chief.shift,
    actionShiftError: chief.error,
    pendingApprovals,
    sendsDelivered: 0,
    portalLogins: 0,
    policy: {
      csvFirst: true,
      humanApprovalRequired: true,
      verbalYesCloses: false,
      storeScoped: true,
      noPortalLogin: true,
    },
  };
}

export function runSampleCommandCenterSwarm(): SwarmReport {
  return runCommandCenterSwarm();
}
