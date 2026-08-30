#!/usr/bin/env node
/**
 * Live keys / MCP connectivity probe. Presence, HTTP status, and counts only.
 * Never prints secret values. Does not write CRM, send mail, or change production.
 *
 *   node scripts/probe-keys-access.mjs
 */
import {
  KEYS_ACCESS_CATALOG,
  catalogPresence,
  keysAccessSummary,
  probeOrchestratorUnauthenticated,
  probePublicMcp,
  probeXaiModels,
} from '../src/lib/keysAccess.ts';

const presence = catalogPresence();
const [publicMcp, orchestrator, xai] = await Promise.all([
  probePublicMcp(),
  probeOrchestratorUnauthenticated(),
  probeXaiModels(),
]);

const report = {
  taskId: 'keys-access-env-v1',
  summary: keysAccessSummary(presence),
  presence: presence.map(({ name, present, nonempty, length }) => ({ name, present, nonempty, length })),
  catalogNames: KEYS_ACCESS_CATALOG.map((item) => item.name),
  probes: {
    publicMcp,
    orchestratorUnauthenticated: orchestrator,
    xaiModels: xai,
  },
  honest: {
    xaiModelApi: xai.status,
    publicOperatorMcp: publicMcp.status,
    privateFactoryMcp: orchestrator.status,
    productionEnvChanged: false,
    secretsPrinted: false,
  },
};

console.log(JSON.stringify(report, null, 2));

const publicOk = publicMcp.status === 'live-verified';
const factoryOk = orchestrator.status === 'fail-closed';
if (!publicOk || !factoryOk) {
  process.exitCode = 1;
}
