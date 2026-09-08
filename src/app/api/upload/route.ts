import { NextRequest, NextResponse } from 'next/server';
import { collectUploadFiles } from '@/lib/ownerDeskPapers';
import { getSimpleOwnerDemoService, isServiceError } from '@/lib/simpleOwnerDemo/runtime';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId, restaurantName) => {
    const service = getSimpleOwnerDemoService();
    if (isServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }

    const form = await req.formData().catch(() => null);
    const files = form ? collectUploadFiles(form) : [];
    if (files.length === 0) {
      return jsonError(400, 'Attach a file as form field `file`.', 'file_required');
    }

    const folderRaw = form?.get('folder');
    const folder = typeof folderRaw === 'string' ? folderRaw : undefined;
    const uploads: Array<Record<string, unknown>> = [];
    const errors: Array<{ filename: string; error: string; code: string }> = [];
    let readiness = await service.readiness(operatorId, restaurantName);

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await service.upload({
        operatorId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        bytes,
        folder,
        restaurantName,
      });
      if (!result.ok) {
        errors.push({ filename: file.name, error: result.error, code: result.code });
        continue;
      }
      uploads.push(result.upload);
      readiness = result.readiness;
    }

    if (uploads.length === 0) {
      const first = errors[0];
      return jsonError(400, first?.error ?? 'Upload did not persist.', first?.code ?? 'file_required');
    }

    const last = uploads[uploads.length - 1] as {
      storageBackend?: string;
      objectKey?: string;
      evidenceKind?: string;
      sourceTags?: unknown;
    };

    return NextResponse.json({
      success: true,
      operatorId,
      persisted: true,
      receivedCount: uploads.length,
      failedCount: errors.length,
      storageBackend: last.storageBackend,
      objectKey: last.objectKey,
      evidenceKind: last.evidenceKind,
      sourceTags: last.sourceTags,
      upload: last,
      uploads,
      errors: errors.length ? errors : undefined,
      readiness,
    });
  });
}
