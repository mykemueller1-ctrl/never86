#!/usr/bin/env npx tsx
import { runSampleCommandCenterSwarm } from '../src/lib/commandCenterSwarm';

const report = runSampleCommandCenterSwarm();
const top = report.actionShift?.morningActions[0];

process.stdout.write(`${JSON.stringify({
  outcome: 'drafted-and-runnable',
  store: report.store,
  freeAgentsRan: report.freeAgents.filter((a) => a.status === 'ran').length,
  portalLogins: report.portalLogins,
  sendsDelivered: report.sendsDelivered,
  actionShift: top
    ? { id: top.id, title: top.title, owner: top.owner, dollarsObserved: top.dollarsObserved }
    : null,
  pendingApprovals: report.pendingApprovals.map((p) => p.status),
}, null, 2)}\n`);
