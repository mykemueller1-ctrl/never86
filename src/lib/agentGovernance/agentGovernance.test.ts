import { beforeEach, describe, expect, it } from 'vitest';
import {
  approveMemoryAtom,
  getAgentJob,
  listAgentJobs,
  listMemoryAtoms,
  listSpecialists,
  getSpecialist,
  specialistBriefPrompt,
  orchestrationRule,
  proposeMemoryAtom,
  resetStoreMemoryForTests,
  supersedeMemoryAtom,
} from './index';
import { curateMemory } from '../commandCenterSwarm/storeTeam';

describe('agent governance registry', () => {
  it('lists one agent per job across store, company, and free agents', () => {
    const jobs = listAgentJobs('all');
    expect(jobs.length).toBeGreaterThan(15);
    expect(listAgentJobs('store').every((row) => row.team === 'store')).toBe(true);
    expect(getAgentJob('memory-curator')?.job).toMatch(/human-approved/i);
    expect(getAgentJob('void-hunter')?.team).toBe('free-agent');
    expect(orchestrationRule()).toMatch(/one deterministic backend/i);
    expect(orchestrationRule()).toMatch(/store-scoped memory/i);
  });

  it('exposes seven domain specialists with one job each', () => {
    const packs = listSpecialists();
    expect(packs.map((p) => p.id)).toEqual([
      'labor',
      'beverage',
      'food-invoice',
      'recipe-cost',
      'human-coach',
      'design-qa',
      'truth-qa',
    ]);
    expect(getSpecialist('labor')?.publicTools).toContain('analyze_labor');
    expect(getSpecialist('recipe-cost')?.publicTools).toContain('convert_uom');
    expect(specialistBriefPrompt('truth-qa')).toMatch(/NEVER/);
  });
});

describe('store memory propose/approve', () => {
  beforeEach(() => resetStoreMemoryForTests());

  it('rejects disallowed memory types and empty stores', () => {
    expect(
      proposeMemoryAtom({
        storeId: 'store-1',
        memoryType: 'vibes',
        rawRule: 'guess',
        normalizedInterpretation: 'nope',
        source: 'model',
        provenance: 'invented',
      }).ok,
    ).toBe(false);

    expect(
      proposeMemoryAtom({
        storeId: '',
        memoryType: 'vendor cadence',
        rawRule: 'Sysco Tue/Thu',
        normalizedInterpretation: 'delivery Tue/Thu',
        source: 'owner',
        provenance: 'load-day',
      }).ok,
    ).toBe(false);
  });

  it('never writes without a human approver', () => {
    const proposed = proposeMemoryAtom({
      storeId: 'sample-store-one',
      memoryType: 'vendor cadence',
      rawRule: 'Sysco Tue/Thu',
      normalizedInterpretation: 'Delivery cadence Tue/Thu',
      source: 'owner verbal',
      provenance: 'load-day conversation',
    });
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;

    expect(approveMemoryAtom(proposed.atom.id, '   ').ok).toBe(false);
    expect(listMemoryAtoms('sample-store-one', { status: 'pending' })).toHaveLength(1);

    const approved = approveMemoryAtom(proposed.atom.id, 'Myke');
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.atom.status).toBe('approved');
    expect(approved.atom.approver).toBe('Myke');
    expect(listMemoryAtoms('sample-store-one', { status: 'active' })).toHaveLength(1);
  });

  it('supersedes an approved atom with a new approved version', () => {
    const first = proposeMemoryAtom({
      storeId: 'sample-store-one',
      memoryType: 'order day',
      rawRule: 'Order Mon',
      normalizedInterpretation: 'Order Monday',
      source: 'owner',
      provenance: 'load-day',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(approveMemoryAtom(first.atom.id, 'Myke').ok).toBe(true);

    const next = supersedeMemoryAtom(
      first.atom.id,
      {
        storeId: 'sample-store-one',
        memoryType: 'order day',
        rawRule: 'Order Sun night',
        normalizedInterpretation: 'Order Sunday night for Monday delivery',
        source: 'owner correction',
        provenance: 'night proof',
      },
      'Myke',
    );
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.previous.status).toBe('superseded');
    expect(next.next.version).toBe(2);
    expect(listMemoryAtoms('sample-store-one', { status: 'active' })).toHaveLength(1);
  });

  it('wires Memory Curator to approve proposals only with an approver', () => {
    const idle = curateMemory(false, undefined, [
      {
        storeId: 'sample-store-one',
        memoryType: 'business-day cutoff',
        rawRule: 'Cutoff 3am',
        normalizedInterpretation: 'Business day ends 03:00 local',
        source: 'owner',
        provenance: 'load-day',
      },
    ]);
    expect(idle.status).toBe('idle');
    expect(idle.output.records).toEqual([]);

    const ran = curateMemory(true, 'Myke', [
      {
        storeId: 'sample-store-one',
        memoryType: 'business-day cutoff',
        rawRule: 'Cutoff 3am',
        normalizedInterpretation: 'Business day ends 03:00 local',
        source: 'owner',
        provenance: 'load-day',
      },
    ]);
    expect(ran.status).toBe('ran');
    expect(Array.isArray(ran.output.records) && ran.output.records.length).toBe(1);
  });
});
