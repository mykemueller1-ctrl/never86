import { approvalInbox } from '@/lib/oneSeatClaim';
import { gateOneSeatClaim, getOneSeatMemoryStore, oneSeatBlocked, oneSeatOk } from '@/lib/oneSeatClaimHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const gate = gateOneSeatClaim();
  if (!gate.ready) return oneSeatBlocked(gate.error);
  const inbox = approvalInbox(getOneSeatMemoryStore()).map((claim) => ({
    id: claim.id,
    status: claim.status,
    provider: claim.provider,
    requestedAt: claim.requestedAt,
    identityId: claim.identityId,
  }));
  return oneSeatOk({ inbox, hasTenantAccess: false });
}
