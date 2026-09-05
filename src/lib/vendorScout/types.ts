import { z } from 'zod';

// Vendor Scout: the food & liquor vendor directory + photo intake contract.
//
// A vendor row is a directory entry — who to call, what they deliver, on what
// days. It is not a live-priced catalog. Price drift on an operator's own
// invoices is `src/lib/vendorDriftCsv.ts`'s job, not this one. Vendor Scout's
// job is: know the vendor, capture the paper (photo/invoice/price sheet), and
// hand a dated, source-tagged record to the Food/Liquor/Beer prime-cost desks.

export const VENDOR_CATEGORIES = ['food', 'liquor', 'beer', 'wine', 'produce', 'other'] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const VENDOR_PHOTO_TYPES = ['invoice', 'price-sheet', 'delivery', 'label', 'storefront', 'other'] as const;
export type VendorPhotoType = (typeof VENDOR_PHOTO_TYPES)[number];

export const vendorInput = z.object({
  operatorId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(VENDOR_CATEGORIES),
  accountNumber: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  deliveryDays: z.array(z.string()).max(7).default([]),
  notes: z.string().optional(),
});
export type VendorInput = z.infer<typeof vendorInput>;

export const vendorPhotoIntake = z.object({
  vendorId: z.string().min(1),
  operatorId: z.string().min(1),
  photoType: z.enum(VENDOR_PHOTO_TYPES),
  fileUrl: z.string().min(1),
  capturedAt: z.string().datetime().optional(),
  uploadedBy: z.string().optional(),
  ocrText: z.string().optional(),
});
export type VendorPhotoIntake = z.infer<typeof vendorPhotoIntake>;

/**
 * A photo is evidence, not a fact. Never call a photo's OCR text `verified`
 * until a human confirms it — a blurry invoice photo is Estimated at best
 * until then, and no photo at all is Open. Missing Evidence is not $0.
 */
export function photoEvidenceStatus(intake: Pick<VendorPhotoIntake, 'ocrText'>): 'estimated' | 'open' {
  return intake.ocrText && intake.ocrText.trim().length > 0 ? 'estimated' : 'open';
}
