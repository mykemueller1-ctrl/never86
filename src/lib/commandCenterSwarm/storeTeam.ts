import { buildActionShift, type ActionShiftInput, type ActionShiftResult } from '../actionShift';
import {
  approveMemoryAtom,
  proposeMemoryAtom,
  type ProposeMemoryAtomInput,
} from '../agentGovernance/storeMemory';
import { NEVER86_OPERATOR_SYSTEM } from '../operatorSystem';
import type { AgentRunRecord, FileDefense, StoreSpecialistOutput } from './types';

const TEAM = NEVER86_OPERATOR_SYSTEM.agents.storeTeam;

function specialist(
  id: StoreSpecialistOutput['id'],
  status: StoreSpecialistOutput['status'],
  summary: string,
  output: Record<string, unknown>,
): StoreSpecialistOutput {
  const spec = TEAM.find((member) => {
    const map: Record<StoreSpecialistOutput['id'], string> = {
      'store-chief-of-staff': 'Store Chief of Staff',
      'source-collector': 'Source Collector',
      'margin-analyst': 'Margin Analyst',
      'operator-coach': 'Operator Coach',
      'proof-verifier': 'Proof Verifier',
      'memory-curator': 'Memory Curator',
    };
    return member.name === map[id];
  });
  return {
    id,
    name: spec?.name ?? id,
    job: spec?.job ?? '',
    status,
    summary,
    output,
  };
}

export function collectSources(files: FileDefense[]): StoreSpecialistOutput {
  const present = files.filter((f) => f.allowed && !f.empty);
  const missing = files.filter((f) => f.empty || !f.allowed);
  return specialist(
    'source-collector',
    present.length ? 'ran' : 'missing-evidence',
    `${present.length} permitted file(s). ${missing.length} missing or blocked. Mailbox state unchanged. No portal login.`,
    {
      present: present.map((f) => f.filename),
      missing: missing.map((f) => ({ file: f.filename, label: f.label })),
      mailboxChanged: false,
      portalLogin: false,
    },
  );
}

export function analyzeMargins(agentRuns: AgentRunRecord[]): StoreSpecialistOutput {
  const ran = agentRuns.filter((a) => a.status === 'ran' || a.status === 'injection-review');
  return specialist(
    'margin-analyst',
    ran.length ? 'ran' : 'missing-evidence',
    `Ran ${ran.length} deterministic CSV worker(s) with store-approved formulas only.`,
    {
      agentsRan: ran.map((a) => a.slug),
      llmUsedForMath: false,
    },
  );
}

export function coachFromShift(shift: ActionShiftResult | null): StoreSpecialistOutput {
  const top = shift?.morningActions[0];
  const concepts: Record<string, string> = {
    'cash-proof': 'POS expected cash is not a bank receipt. Match the deposit slip before booking a shortage.',
    'labor-window': 'A labor dollar total is wages. Fix one clock window, not the whole week, and only against the operator target.',
    'payout-proof': 'A payout needs a receipt and a ledger code. It is not a leak by itself.',
    'delivery-clock': 'Late-ticket sales are exposed revenue, not proven lost sales.',
    'approval-proof': 'Discounts, promos, and voids can overlap. They are not added together and not automatically theft.',
    'close-packet': 'No flag from typed inputs does not prove the shift was clean. Save the same-scope packet.',
  };
  const concept = top ? concepts[top.id] ?? top.claimBoundary : 'No Action Shift yet. Teach nothing from a missing close.';
  return specialist(
    'operator-coach',
    top ? 'ran' : 'idle',
    concept,
    {
      taughtConcept: concept,
      tribalQuestion: top
        ? 'What proof will tonight create that this move happened?'
        : 'Where do yesterday\'s close files actually land?',
      questionsAsked: 1,
    },
  );
}

export function verifyProof(shift: ActionShiftResult | null): StoreSpecialistOutput {
  return specialist(
    'proof-verifier',
    shift ? 'ran' : 'idle',
    shift
      ? `${shift.nightCloseCheck.length} night check(s). A verbal yes does not close the action.`
      : 'No Action Shift to prove.',
    {
      verbalYesCloses: false,
      nightCloseCheck: shift?.nightCloseCheck ?? [],
      missingEvidence: shift?.missingEvidence ?? [],
      openUntilProof: true,
    },
  );
}

export function curateMemory(
  approved: boolean,
  approver?: string,
  proposals: ProposeMemoryAtomInput[] = [],
): StoreSpecialistOutput {
  const who = approver?.trim();
  if (!approved || !who) {
    return specialist(
      'memory-curator',
      'idle',
      'No store memory written. A model guess is not memory. Human approval is required.',
      {
        records: [],
        pendingApprovals:
          proposals.length > 0
            ? proposals.map((row) => `Pending: ${row.memoryType} — ${row.rawRule.slice(0, 80)}`)
            : ['No tribal rule proposed on this first sample run.'],
      },
    );
  }

  const records: Array<Record<string, unknown>> = [];
  const errors: string[] = [];
  for (const proposal of proposals) {
    const proposed = proposeMemoryAtom(proposal);
    if (!proposed.ok) {
      errors.push(`${proposal.memoryType}: ${proposed.error}`);
      continue;
    }
    const approvedAtom = approveMemoryAtom(proposed.atom.id, who);
    if (!approvedAtom.ok) {
      errors.push(`${proposal.memoryType}: ${approvedAtom.error}`);
      continue;
    }
    records.push({
      id: approvedAtom.atom.id,
      scope: 'store',
      storeId: approvedAtom.atom.storeId,
      memoryType: approvedAtom.atom.memoryType,
      approver: approvedAtom.atom.approver,
      version: approvedAtom.atom.version,
      supersededBy: approvedAtom.atom.supersededBy,
    });
  }

  return specialist(
    'memory-curator',
    records.length > 0 ? 'ran' : 'idle',
    records.length > 0
      ? `Versioned store rule(s) recorded by ${who}.`
      : 'Human approved the curator, but no allowed memory atom was written.',
    {
      records,
      pendingApprovals: errors,
    },
  );
}

export function chooseAction(close: ActionShiftInput): {
  specialist: StoreSpecialistOutput;
  shift: ActionShiftResult | null;
  error: string | null;
} {
  const built = buildActionShift(close);
  if (!built.ok) {
    return {
      specialist: specialist('store-chief-of-staff', 'blocked', built.error, { error: built.error }),
      shift: null,
      error: built.error,
    };
  }
  const top = built.result.morningActions[0];
  return {
    specialist: specialist(
      'store-chief-of-staff',
      'ran',
      `One next action: ${top.title}. ${built.result.morningActions.length} ranked move(s), never more than three.`,
      {
        chosenActionId: top.id,
        owner: top.owner,
        morningActionCount: built.result.morningActions.length,
        maxMorningActions: 3,
      },
    ),
    shift: built.result,
    error: null,
  };
}
