/**
 * Supervisor — route one intent to one specialist. Never compute dollars.
 */

import { getOrchestrationSeat, isSpecialistId, listSpecialistSeats } from './registry';
import { ORCHESTRATION_VERSION, type RouteFailure, type RouteReceipt, type SpecialistId } from './types';

export type SupervisorInput = {
  operatorId: number;
  text: string;
  houseCodeVerified?: boolean;
};

const INTENT_RULES: Array<{ id: SpecialistId; pattern: RegExp }> = [
  { id: 'memory', pattern: /\b(remember|store rule|tribal|memory atom|mapping)\b/i },
  { id: 'labor', pattern: /\b(labor|payroll|overtime|\bot\b|clock[- ]?in|timesheet|schedule vs|ghost shift)\b/i },
  { id: 'voids', pattern: /\b(void|comp|discount after|promo stack|leak detector)\b/i },
  { id: 'vendor', pattern: /\b(vendor|invoice|sku|price drift|sysco|pfg|pour|beverage|recipe|uom|count)\b/i },
  { id: 'action-shift', pattern: /\b(yesterday|action shift|night proof|one action|close|eod|z[- ]?report)\b/i },
];

export function classifyIntent(text: string): SpecialistId | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (isSpecialistId(trimmed)) return trimmed;
  for (const rule of INTENT_RULES) {
    if (rule.pattern.test(trimmed)) return rule.id;
  }
  return null;
}

export function routeIntent(input: SupervisorInput): RouteReceipt | RouteFailure {
  const operatorId = Number(input.operatorId);
  if (!Number.isInteger(operatorId) || operatorId <= 0) {
    return {
      ok: false,
      error: 'operator_id_required',
      hint: 'Open /portal with a house code. Public MCP stays read-only and tenant-less.',
    };
  }
  if (input.houseCodeVerified !== true) {
    return {
      ok: false,
      error: 'house_code_required',
      hint: 'Stranger and CTAP seat 1 use /onboard email. House-code /portal stays fail-closed until a hash is issued.',
    };
  }

  const specialistId = classifyIntent(input.text);
  if (!specialistId) {
    return {
      ok: false,
      error: 'unknown_intent',
      hint: `Name one specialist: ${listSpecialistSeats()
        .map((seat) => seat.id)
        .join(', ')}. Supervisor will not guess dollars.`,
    };
  }

  const seat = getOrchestrationSeat(specialistId);
  if (!seat || seat.role !== 'specialist') {
    return {
      ok: false,
      error: 'unknown_intent',
      hint: 'Specialist seat missing from the v1 registry.',
    };
  }

  return {
    ok: true,
    orchestrationVersion: ORCHESTRATION_VERSION,
    operatorId,
    specialistId,
    job: seat.job,
    reason: `Supervisor routed to ${seat.id}. One job. No dollars computed.`,
    publicTools: seat.publicTools,
    never: seat.never,
    computedDollars: false,
    portalLogin: false,
  };
}
