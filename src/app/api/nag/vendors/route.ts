import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getNagVendorService, isNagVendorServiceError } from '@/lib/nagVendors/runtime';
import { jsonError, withNagVendorTenant } from '@/lib/nagVendors/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  name: z.string().min(1),
  category: z.enum(['food', 'liquor']),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return withNagVendorTenant(req, async (operatorId) => {
    const service = getNagVendorService();
    if (isNagVendorServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }
    const vendors = await service.listVendors(operatorId);
    return NextResponse.json({ success: true, operatorId, vendors });
  });
}

export async function POST(req: NextRequest) {
  return withNagVendorTenant(req, async (operatorId) => {
    const service = getNagVendorService();
    if (isNagVendorServiceError(service)) {
      return jsonError(service.status, service.error, service.code);
    }

    let parsed: z.infer<typeof bodySchema>;
    try {
      parsed = bodySchema.parse(await req.json());
    } catch {
      return jsonError(400, 'Enter a vendor name and a food/liquor category.', 'invalid_body');
    }

    const result = await service.createVendor({ operatorId, ...parsed });
    if (!result.ok) {
      return jsonError(result.status, result.error, result.code);
    }
    return NextResponse.json({ success: true, operatorId, vendor: result.vendor });
  });
}
