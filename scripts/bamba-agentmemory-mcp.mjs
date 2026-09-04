#!/usr/bin/env node
/**
 * Local stdio MCP for Bamba Graphiti / agentmemory.
 * Tenant-isolated to bamba. No live Zep write. No foreign-tenant facts.
 */
import { createInterface } from 'node:readline';

const TENANT = process.env.AGENTMEMORY_TENANT || process.env.ZEP_GRAPHITI_GROUP_ID || 'bamba';
const FOREIGN = /\b(ctap|c-tap|community\s*tap|community\s*pizza|new\s*american\s*grill|grill\s*cash|sample\s*store\s*one)\b/i;

const facts = [
  {
    factId: 'aug12-system-cy-sales',
    subject: 'bamba-system',
    predicate: 'cy_sales',
    object: '125273.41',
    validFrom: '2026-08-12T00:00:00-04:00',
    validUntil: '2026-08-13T00:00:00-04:00',
  },
  {
    factId: 'aug12-landmark-highest-void-rate',
    subject: 'Landmark',
    predicate: 'highest_daily_void_rate',
    object: 'true',
    validFrom: '2026-08-12T00:00:00-04:00',
    validUntil: '2026-08-13T00:00:00-04:00',
  },
];

function reply(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

function fail(id, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message } })}\n`);
}

function assertTenant(value) {
  if ((value || TENANT) !== 'bamba') {
    throw new Error(`Lane C isolation: refused tenant "${value}". Bamba graph only.`);
  }
}

const tools = [
  { name: 'remember_fact', description: 'Write one Bamba Graphiti fact with a validity window.' },
  { name: 'recall_facts', description: 'Recall live Bamba facts at a timestamp.' },
  { name: 'list_validity_windows', description: 'List validity windows for the Bamba graph.' },
];

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  const { id, method, params } = msg;
  try {
    if (method === 'initialize') {
      reply(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'bamba-agentmemory', version: '1.0.0' },
        capabilities: { tools: {} },
      });
      return;
    }
    if (method === 'tools/list') {
      reply(id, { tools: tools.map((tool) => ({ ...tool, inputSchema: { type: 'object' } })) });
      return;
    }
    if (method === 'tools/call') {
      const name = params?.name;
      const args = params?.arguments || {};
      assertTenant(args.tenantId || TENANT);
      const blob = JSON.stringify(args);
      if (FOREIGN.test(blob)) throw new Error('Lane C isolation: foreign tenant token refused.');
      if (name === 'remember_fact') {
        reply(id, { content: [{ type: 'text', text: JSON.stringify({ ok: true, stored: args.factId || 'fact' }) }] });
        return;
      }
      if (name === 'recall_facts') {
        reply(id, { content: [{ type: 'text', text: JSON.stringify({ ok: true, facts }) }] });
        return;
      }
      if (name === 'list_validity_windows') {
        reply(id, {
          content: [{ type: 'text', text: JSON.stringify(facts.map((f) => ({ factId: f.factId, validFrom: f.validFrom, validUntil: f.validUntil }))) }],
        });
        return;
      }
      throw new Error(`Unknown tool ${name}`);
    }
    if (method === 'notifications/initialized' || method === 'ping') return;
    reply(id, {});
  } catch (error) {
    fail(id, error instanceof Error ? error.message : 'agentmemory failed');
  }
});
