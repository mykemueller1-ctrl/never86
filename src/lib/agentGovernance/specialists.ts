/**
 * Specialist packs — one agent · one job.
 * Canonical seats live in src/lib/orchestration. This file is the MCP-facing view.
 */

import {
  getOrchestrationSeat,
  listSpecialistSeats,
  specialistBriefPrompt as orchestrationBrief,
  type OrchestrationSeat,
} from '../orchestration';

export type SpecialistId = 'labor' | 'vendor' | 'voids' | 'action-shift' | 'memory' | 'supervisor';

export type SpecialistPack = {
  id: SpecialistId;
  name: string;
  job: string;
  seats: readonly string[];
  ownsStages: readonly string[];
  logicDomains: readonly string[];
  publicTools: readonly string[];
  promptUri: string;
  resourceUri: string;
  never: readonly string[];
  evidenceNotes: readonly string[];
};

export const SPECIALIST_NEVER = [
  'auto-mail',
  'auto-post',
  'portal-login',
  'theft-allegation',
  'guaranteed-recovery',
  'forked-business-logic',
] as const;

function toPack(seat: OrchestrationSeat): SpecialistPack {
  return {
    id: seat.id as SpecialistId,
    name: seat.name,
    job: seat.job,
    seats: [seat.id],
    ownsStages: seat.ownsStages,
    logicDomains: seat.logicDomains,
    publicTools: seat.publicTools,
    promptUri: seat.promptUri,
    resourceUri: seat.resourceUri,
    never: seat.never,
    evidenceNotes: seat.evidenceNotes,
  };
}

export const SPECIALIST_PACKS: readonly SpecialistPack[] = listSpecialistSeats().map(toPack);

export function listSpecialists(): SpecialistPack[] {
  return SPECIALIST_PACKS.map((pack) => ({ ...pack }));
}

export function getSpecialist(id: string): SpecialistPack | null {
  const seat = getOrchestrationSeat(id);
  if (!seat) return null;
  return toPack(seat);
}

export function specialistBriefPrompt(id: string): string | null {
  return orchestrationBrief(id);
}
