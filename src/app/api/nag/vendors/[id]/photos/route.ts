import { NextRequest, NextResponse } from 'next/server';
import { getNagVendorService, isNagVendorServiceError } from '@/lib/nagVendors/runtime';
import { jsonError, withNagVendorTenant } from '@/lib/nagVendors/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withNagVendorTenant(req, async (operatorId) => {
    const service = getNagVendorService();
    if (isNagVendorServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }
    const result = await service.listPhotos({ operatorId, vendorId: id });
    if (!result.ok) {
      return jsonError(result.status, result.error, result.code);
    }
    return NextResponse.json({
      success: true,
      operatorId,
      vendor: result.vendor,
      photos: result.photos,
    });
  });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withNagVendorTenant(req, async (operatorId) => {
    const service = getNagVendorService();
    if (isNagVendorServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) {
      return jsonError(400, 'Attach a photo as form field `file`.', 'file_required');
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await service.addPhoto({
      operatorId,
      vendorId: id,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      bytes,
    });
    if (!result.ok) {
      return jsonError(result.status, result.error, result.code);
    }
    return NextResponse.json({ success: true, operatorId, photo: result.photo });
  });
}
