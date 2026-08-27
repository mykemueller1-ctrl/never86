'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  applyManagerStepProof,
  buildSyntheticManagerBoard,
  type ManagerBoard,
  type ManagerChecklistRun,
  type ManagerException,
} from '@/lib/actionShiftManagerBoard';
import { PROOF_KINDS, type ProofOutcome } from '@/lib/deskClose';

const inputClass = 'mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white';

function stampClass(status: string): string {
  if (status === 'verified') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  if (status === 'escalated' || status === 'overdue_unverified' || status === 'fix_failed' || status === 'not_done') {
    return 'border-red-400/40 bg-red-400/10 text-red-100';
  }
  if (status === 'exception' || status === 'data_missing' || status === 'done_awaiting_proof' || status === 'submitted') {
    return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  }
  return 'border-white/15 bg-white/5 text-white/70';
}

function Stamp({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${stampClass(status)}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function RunCard({
  run,
  onProve,
}: {
  run: ManagerChecklistRun;
  onProve: (runId: string, stepId: string, outcome: ProofOutcome | 'escalated', proofKind?: string, proofNote?: string) => string | null;
}) {
  const [proofKind, setProofKind] = useState<string>(run.steps[0]?.acceptedProofKinds[0] ?? 'exception-log');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">
            {run.stationKey.replaceAll('_', ' ')} · {run.roleKey.replaceAll('_', ' ')} · {run.phase}
          </p>
          <h3 className="mt-1 font-semibold text-white">{run.ownerLabel}</h3>
          <p className="mt-1 text-xs text-white/45">Due {run.dueAt} · owner {run.ownerSeatId}</p>
        </div>
        <Stamp status={run.status} />
      </div>
      <ul className="mt-4 space-y-3">
        {run.steps.map((step) => (
          <li key={step.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm text-white/80">{step.instruction}</p>
              <Stamp status={step.status} />
            </div>
            <p className="mt-2 text-xs text-white/40">
              Proof: {step.acceptedProofKinds.join(', ')} · escalate to manager seat after {step.escalationMinutes} min
            </p>
            {step.proofNote ? <p className="mt-2 text-xs text-amber-100/80">{step.proofNote}</p> : null}
            {step.status === 'verified' ? null : (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:border-white/35"
                  onClick={() => setError(onProve(run.id, step.id, 'acknowledged'))}
                >
                  Acknowledge
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-amber-300/40 px-3 py-1.5 text-xs text-amber-100 hover:border-amber-200"
                  onClick={() => setError(onProve(run.id, step.id, 'done-awaiting-proof', proofKind, note))}
                >
                  Done, awaiting proof
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-950"
                  onClick={() => setError(onProve(run.id, step.id, 'verified', proofKind, note))}
                >
                  Attach proof
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-100"
                  onClick={() => setError(onProve(run.id, step.id, 'data-missing'))}
                >
                  Missing evidence
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-100"
                  onClick={() => setError(onProve(run.id, step.id, 'escalated'))}
                >
                  Escalate
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs uppercase tracking-wider text-white/50">
          Proof object
          <select value={proofKind} onChange={(event) => setProofKind(event.target.value)} className={inputClass}>
            {PROOF_KINDS.map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
            <option value="verbal">verbal (must not close)</option>
          </select>
        </label>
        <label className="block text-xs uppercase tracking-wider text-white/50">
          Proof note
          <input value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} placeholder="Source object, not a name or PIN" />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-red-200" role="alert">{error}</p> : null}
    </article>
  );
}

function ExceptionList({ exceptions }: { exceptions: ManagerException[] }) {
  if (exceptions.length === 0) {
    return <p className="text-sm text-white/55">No open exceptions on this synthetic board.</p>;
  }
  return (
    <ul className="space-y-2">
      {exceptions.map((item) => (
        <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">
          <div>
            <p className="text-sm text-red-50">{item.instruction}</p>
            <p className="mt-1 text-xs text-white/45">
              {item.stationKey.replaceAll('_', ' ')} · owner {item.ownerSeatId} · escalate to {item.escalateToSeatId}
            </p>
          </div>
          <Stamp status={item.reason} />
        </li>
      ))}
    </ul>
  );
}

export default function ActionShiftManagerDesk({ signedInOperatorId }: { signedInOperatorId?: number }) {
  const [board, setBoard] = useState<ManagerBoard>(() => buildSyntheticManagerBoard());
  const summary = board.summary;
  const cards = useMemo(() => ([
    ['Assigned', summary.assigned],
    ['In motion', summary.inProgress],
    ['Awaiting proof', summary.awaitingProof],
    ['Verified', summary.verified],
    ['Exceptions', summary.exceptions],
    ['Escalations', summary.escalations],
  ] as const), [summary]);

  function onProve(
    runId: string,
    stepId: string,
    outcome: ProofOutcome | 'escalated',
    proofKind?: string,
    proofNote?: string,
  ): string | null {
    const result = applyManagerStepProof({
      board,
      runId,
      stepId,
      actor: {
        seatId: board.managerSeat.id,
        operatorId: board.tenant.operatorId,
        locationId: board.tenant.locationId,
        kind: 'manager',
      },
      outcome,
      proofKind,
      proofNote,
    });
    if (!result.ok) return result.error;
    setBoard(result.board);
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
        <p className="text-sm font-semibold text-amber-200">Manager seat · synthetic operating board</p>
        <p className="mt-1 text-sm leading-relaxed text-white/65">
          One manager login. Station checklists are owned here; there are no staff-wide credentials, PINs, or live roster names.
          Proof stays in this browser. Database activation is a separate gate.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Tenant boundary</p>
          <h2 className="mt-2 font-serif text-3xl text-white">{board.tenant.locationLabel}</h2>
          <p className="mt-2 text-sm text-white/60">{board.tenant.boundary}</p>
          <p className="mt-3 font-mono text-xs text-white/40">
            fixture operator {board.tenant.operatorId} / location {board.tenant.locationId}
            {signedInOperatorId != null ? ` · signed-in operator ${signedInOperatorId} is not mixed into this fixture` : ''}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Seat model</p>
          <p className="mt-2 text-lg text-white">Manager-first</p>
          <p className="mt-1 text-sm text-white/55">Staff logins: {board.staffLogins.replaceAll('-', ' ')}</p>
          <p className="mt-1 text-sm text-white/55">Persistence: {board.persistence.replaceAll('-', ' ')}</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-3xl text-white">{value}</p>
            <p className="text-xs uppercase tracking-wider text-white/45">{label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-white">Evidence contracts · no invented store totals</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {board.evidenceContracts.map((contract) => (
            <div key={contract.family} className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-200">{contract.family}</p>
              <p className="mt-2 text-sm text-white/70">{contract.required}</p>
              <p className="mt-2 text-xs text-white/45">Does not prove: {contract.doesNotProve}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-white">Checklist ownership</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">Station</th>
                <th className="px-4 py-3">Role pack</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Phase</th>
                <th className="px-4 py-3">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {board.runs.map((run) => (
                <tr key={run.id}>
                  <td className="px-4 py-3 capitalize text-white">{run.stationKey.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3 text-white/70">{run.roleKey.replaceAll('_', ' ')}</td>
                  <td className="px-4 py-3 text-white/70">{run.ownerLabel}</td>
                  <td className="px-4 py-3 text-white/70">{run.phase}</td>
                  <td className="px-4 py-3"><Stamp status={run.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
        <h2 className="font-semibold text-red-50">Exceptions · escalate to the manager seat</h2>
        <p className="mt-1 text-sm text-white/55">A verbal yes does not close a required step. Overdue unverified work comes here.</p>
        <div className="mt-4"><ExceptionList exceptions={board.exceptions} /></div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-white">Completion and proof</h2>
        {board.runs.map((run) => (
          <RunCard key={run.id} run={run} onProve={onProve} />
        ))}
      </section>

      <p className="text-xs leading-relaxed text-white/40">
        Live store names, PINs, and schedules are not in this fixture. If a real opener/closer roster is required to assign a person, that source still has to be supplied privately.{' '}
        <Link href="/dashboard/setup" className="text-amber-200 underline underline-offset-4">Workforce setup</Link>
        {' · '}
        <Link href="/action-shift" className="text-amber-200 underline underline-offset-4">Action Shift desk</Link>
      </p>
    </div>
  );
}
