import { NextRequest, NextResponse } from 'next/server';
import {
  PAPERS_REQUIRED_SECRET_NAMES,
  evaluatePapersInboxEnablement,
  outlookV2Plan,
  papersEnvChecklist,
  papersGoogleRedirect,
  papersIntakeCopy,
  papersFileFirstWhenInboxOff,
  papersSeatHonesty,
  foldersWithReceived,
} from '@/lib/papersInbox';
import {
  hydratePapersConnection,
  papersConnectionFor,
  papersDurableStore,
  listDirectPapers,
  papersFoldersFor,
  papersInvoicesFor,
} from '@/lib/papersInboxHttp';
import { withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';
import { getSimpleOwnerDemoService, isServiceError } from '@/lib/simpleOwnerDemo/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const gate = evaluatePapersInboxEnablement();
    const copy = papersIntakeCopy();
    await hydratePapersConnection(operatorId);
    const connection = papersConnectionFor(operatorId);
    const invoices = papersInvoicesFor(operatorId);
    const intake = await listDirectPapers(operatorId);
    const folders = papersFoldersFor(operatorId);
    const connected = Boolean(connection.gmail || connection.drive);
    const fileFirst = papersFileFirstWhenInboxOff(connection);
    let ownerPapers: Array<{ filename: string; evidenceKind: string }> = [];
    try {
      const service = getSimpleOwnerDemoService();
      if (!isServiceError(service)) {
        const readiness = await service.readiness(operatorId);
        ownerPapers = readiness.papers ?? [];
      }
    } catch {
      ownerPapers = [];
    }
    const landed = [
      ...intake.map((paper) => ({ folder: paper.folder, filename: paper.filename })),
      ...ownerPapers,
    ];
    const shownFolders = fileFirst.inboxOff
      ? foldersWithReceived(fileFirst.folders, landed)
      : foldersWithReceived(
        folders.map((folder) => (
          folder.status === 'missing' ? { ...folder, honesty: 'Missing' as const } : folder
        )),
        landed,
      );
    return NextResponse.json({
      success: true,
      intakeOrder: ['gmail', 'photo', 'chat'],
      fileFirst: fileFirst.inboxOff,
      lead: fileFirst.lead,
      googleFirst: true,
      ready: gate.ready,
      honesty: papersSeatHonesty({
        ready: gate.ready,
        connected,
        invoiceCount: invoices.filter((row) => row.honesty !== 'Missing').length,
      }),
      missingSecrets: gate.missingSecrets,
      requiredEnv: [...PAPERS_REQUIRED_SECRET_NAMES],
      redirectUri: papersGoogleRedirect(),
      envChecklist: papersEnvChecklist(),
      error: gate.error,
      durable: papersDurableStore(),
      connection,
      folders: shownFolders,
      intake: intake.map((paper) => ({
        id: paper.id,
        kind: paper.kind,
        filename: paper.filename,
        folder: paper.folder,
        honesty: paper.honesty,
        note: paper.note,
        text: paper.text,
      })),
      copy,
      outlook: outlookV2Plan(),
    });
  });
}
