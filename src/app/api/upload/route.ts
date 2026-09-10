import { NextRequest, NextResponse } from 'next/server';
import { readBoundedBody, RequestTooLarge } from '@/lib/boundedRequest';
import { SIMPLE_OWNER_MAX_BYTES } from '@/lib/simpleOwnerDemo/types';
import { collectUploadFiles, MAX_PAPERS_PER_DROP } from '@/lib/ownerDeskPapers';
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

    let form: FormData | null = null;
    try {
      const bytes = await readBoundedBody(req, 24 * 1024 * 1024);
      form = await new Response(bytes as BodyInit, { headers: { 'content-type': req.headers.get('content-type') ?? '' } }).formData();
    } catch (error) {
      if (error instanceof RequestTooLarge) return jsonError(413, 'Send a smaller batch: up to 12 files and 24 MB total.', 'batch_too_large');
    }
    const files = form ? collectUploadFiles(form) : [];
    if (files.length === 0) {
      return jsonError(400, 'Attach a file as form field `file`.', 'file_required');
    }
    if (files.length > MAX_PAPERS_PER_DROP) return jsonError(413, 'Send up to 12 files at a time.', 'too_many_files');
    if (files.some(file => file.size > SIMPLE_OWNER_MAX_BYTES)) {
      return jsonError(413, 'Each file must be 8 MB or smaller. Split the larger file and try again.', 'too_large');
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
