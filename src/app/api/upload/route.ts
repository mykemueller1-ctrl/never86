import { NextRequest, NextResponse } from 'next/server';
import { getSimpleOwnerDemoService, isServiceError } from '@/lib/simpleOwnerDemo/runtime';
import { jsonError, withSimpleOwnerTenant } from '@/lib/simpleOwnerDemo/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withSimpleOwnerTenant(req, async (operatorId) => {
    const service = getSimpleOwnerDemoService();
    if (isServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) {
      return jsonError(400, 'Attach a file as form field `file`.', 'file_required');
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await service.upload({
      operatorId,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      bytes,
    });
    if (!result.ok) {
      return jsonError(result.status, result.error, result.code);
    }

    return NextResponse.json({
      success: true,
      operatorId,
      persisted: true,
      storageBackend: result.upload.storageBackend,
      objectKey: result.upload.objectKey,
      evidenceKind: result.upload.evidenceKind,
      sourceTags: result.upload.sourceTags,
      upload: result.upload,
      readiness: result.readiness,
    });
  });
}
