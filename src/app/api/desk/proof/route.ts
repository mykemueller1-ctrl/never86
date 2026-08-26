import { NextResponse } from 'next/server';
import { z } from 'zod';
import { applyNightProof, PROOF_KINDS } from '@/lib/deskClose';
import { readOperatorSession } from '@/lib/readOperatorSession';
import { findFreeSeatOperator, isFreeSeatOperatorId } from '@/lib/operatorActivation';
import { loadLatestClose, recordProof } from '@/lib/seatCloseStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  actionId: z.string().min(1),
  outcome: z.enum([
    'acknowledged',
    'done-awaiting-proof',
    'verified',
    'not-done',
    'data-missing',
    'fix-failed',
  ]),
  proofKind: z.string().optional(),
  proofNote: z.string().max(2000).optional(),
  closeId: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await readOperatorSession();
  if (!session || !isFreeSeatOperatorId(session.operatorId)) {
    return NextResponse.json({ success: false, error: 'Sign in to your free seat first.' }, { status: 401 });
  }

  const data = bodySchema.parse(await req.json().catch(() => ({})));
  const operator = await findFreeSeatOperator(session.operatorId).catch(() => null);
  const saved = operator?.locationId
    ? await loadLatestClose(operator.operatorId, operator.locationId).catch(() => null)
    : null;
  const action = saved?.desk.actionShift?.morningActions.find(
    (a) => a.id === data.actionId || a.instanceKey === data.actionId,
  );
  if (!action) {
    return NextResponse.json({ success: false, error: 'That action is not on tonight\'s desk.' }, { status: 404 });
  }

  const applied = applyNightProof({
    action,
    outcome: data.outcome,
    proofKind: data.proofKind,
    proofNote: data.proofNote,
  });
  if (!applied.ok) {
    return NextResponse.json({ success: false, error: applied.error }, { status: 400 });
  }

  const closeId = data.closeId ?? saved?.closeId;
  const persisted = closeId
    ? await recordProof({
      operatorId: session.operatorId,
      closeId,
      actionId: data.actionId,
      outcome: applied.state,
      proofKind: data.proofKind && PROOF_KINDS.includes(data.proofKind as typeof PROOF_KINDS[number])
        ? data.proofKind
        : 'other-source',
      proofNote: data.proofNote,
    }).catch(() => false)
    : false;

  return NextResponse.json({
    success: true,
    state: applied.state,
    persisted,
    proof: action.proof,
  });
}
