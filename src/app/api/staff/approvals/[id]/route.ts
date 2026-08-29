import { handleDecision, oneSeatBlocked, oneSeatOk } from '@/lib/oneSeatClaimHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({}));
  const decision = body?.decision;
  if (decision !== 'approve' && decision !== 'reject' && decision !== 'revoke' && decision !== 'reset') {
    return oneSeatBlocked('Decision must be approve, reject, revoke, or reset.', 400);
  }
  const { id } = await context.params;
  const result = handleDecision({
    claimId: id,
    approver: body?.approver,
    decision,
  });
  if (!result.ok) return oneSeatBlocked(result.error ?? 'Decision failed.', 403);
  return oneSeatOk({
    claimId: result.claim?.id,
    status: result.claim?.status,
    hasTenantAccess: result.session?.hasTenantAccess === true,
    seatKey: result.session && 'seatKey' in result.session ? result.session.seatKey : null,
  });
}
