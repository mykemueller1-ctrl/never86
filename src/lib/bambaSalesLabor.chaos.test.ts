import { describe, expect, it } from 'vitest';
import { buildBambaSalesLaborDesk } from './bambaSalesLabor/desk';
import { CHAOS_KILL_JOB_IDS, runChaosSwarm, runBambaSwarm } from './bambaSalesLabor/swarm';
import { BAMBA_SWARM_JOB_IDS } from './bambaSalesLabor/types';
import { FOREIGN_TENANT_PATTERN } from './bambaSalesLabor/tenant';

describe('bamba sales-labor chaos harness', () => {
  it('kills 3 of 12 swarm jobs and marks the desk incomplete, not done', () => {
    expect(CHAOS_KILL_JOB_IDS).toHaveLength(3);
    expect(BAMBA_SWARM_JOB_IDS).toHaveLength(12);
    const swarm = runChaosSwarm();
    expect(swarm.killedJobIds).toEqual([...CHAOS_KILL_JOB_IDS]);
    expect(swarm.jobs.filter((job) => job.status === 'killed')).toHaveLength(3);
    expect(swarm.jobs.filter((job) => job.status === 'done')).toHaveLength(9);
    expect(swarm.completeness).toBe('incomplete');
    expect(swarm.completeness).not.toBe('done');

    const desk = buildBambaSalesLaborDesk('bamba', { killJobIds: CHAOS_KILL_JOB_IDS });
    expect(desk.completeness).toBe('incomplete');
    expect(desk.completeness).not.toBe('done');
    expect(desk.swarm.killedJobIds).toEqual(['ticket-time', 'pmix', 'labor']);
  });

  it('keeps a clean 12-job run done only when nothing is killed', () => {
    const swarm = runBambaSwarm();
    expect(swarm.completeness).toBe('done');
    expect(buildBambaSalesLaborDesk().completeness).toBe('done');
  });

  it('fans every job to 16 Bamba stores and never names a foreign tenant', () => {
    const desk = buildBambaSalesLaborDesk('bamba', { killJobIds: CHAOS_KILL_JOB_IDS });
    expect(desk.swarm.storeCount).toBe(16);
    expect(desk.roster).toHaveLength(16);
    expect(desk.swarm.jobs.every((job) => job.storeCount === 16)).toBe(true);
    expect(JSON.stringify(desk.swarm)).not.toMatch(FOREIGN_TENANT_PATTERN);
  });
});
