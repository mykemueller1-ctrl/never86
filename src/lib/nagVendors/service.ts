import { findFreeOperatorPrivacyHits } from '@/lib/freeOperatorDemo';
import { safeObjectFilename } from '@/lib/simpleOwnerDemo/classify';
import type {
  NagVendorCategory,
  NagVendorObjectStore,
  NagVendorPhotoRecord,
  NagVendorRecord,
  NagVendorRepository,
} from './types';
import { NAG_VENDOR_PHOTO_MAX_BYTES } from './types';

const CATEGORIES: readonly NagVendorCategory[] = ['food', 'liquor'];

function isCategory(value: string): value is NagVendorCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

function buildVendorPhotoObjectKey(operatorId: string, vendorId: string, filename: string, now: Date): string {
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const id = crypto.randomUUID();
  const seat = operatorId.replace(/[^a-zA-Z0-9._:-]+/g, '-');
  const vendor = vendorId.replace(/[^a-zA-Z0-9._:-]+/g, '-');
  return `nag-vendors/${seat}/${vendor}/${yyyy}/${mm}/${id}-${safeObjectFilename(filename)}`;
}

export type NagVendorServiceError = { ok: false; status: number; error: string; code: string };

export type NagVendorService = {
  createVendor(input: {
    operatorId: string;
    name: string;
    category: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    notes?: string;
  }): Promise<{ ok: true; vendor: NagVendorRecord } | NagVendorServiceError>;
  listVendors(operatorId: string): Promise<NagVendorRecord[]>;
  addPhoto(input: {
    operatorId: string;
    vendorId: string;
    filename: string;
    contentType: string;
    bytes: Uint8Array;
  }): Promise<{ ok: true; photo: NagVendorPhotoRecord } | NagVendorServiceError>;
  listPhotos(input: {
    operatorId: string;
    vendorId: string;
  }): Promise<{ ok: true; vendor: NagVendorRecord; photos: NagVendorPhotoRecord[] } | NagVendorServiceError>;
};

export function createNagVendorService(deps: {
  repo: NagVendorRepository;
  objects: NagVendorObjectStore;
  now?: () => Date;
}): NagVendorService {
  const now = deps.now ?? (() => new Date());

  return {
    async createVendor({ operatorId, name, category, contactName, contactPhone, contactEmail, notes }) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return { ok: false, status: 400, error: 'Name the vendor.', code: 'name_required' };
      }
      if (!isCategory(category)) {
        return {
          ok: false,
          status: 400,
          error: "Category must be 'food' or 'liquor'.",
          code: 'category_invalid',
        };
      }
      const vendor: NagVendorRecord = {
        id: crypto.randomUUID(),
        operatorId,
        name: trimmedName,
        category,
        contactName: contactName?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        notes: notes?.trim() || null,
        createdAt: now().toISOString(),
      };
      await deps.repo.insertVendor(vendor);
      return { ok: true, vendor };
    },

    async listVendors(operatorId) {
      return deps.repo.listVendors(operatorId);
    },

    async addPhoto({ operatorId, vendorId, filename, contentType, bytes }) {
      const vendor = await deps.repo.getVendor(operatorId, vendorId);
      if (!vendor) {
        return { ok: false, status: 404, error: 'Vendor not found.', code: 'vendor_not_found' };
      }
      if (!filename.trim()) {
        return { ok: false, status: 400, error: 'Name the photo.', code: 'filename_required' };
      }
      if (findFreeOperatorPrivacyHits(filename).length > 0) {
        return {
          ok: false,
          status: 400,
          error: 'Do not upload private staff, PIN, or live-dollar filenames here.',
          code: 'privacy_blocked',
        };
      }
      if (bytes.byteLength === 0) {
        return { ok: false, status: 400, error: 'Photo is empty.', code: 'empty_file' };
      }
      if (bytes.byteLength > NAG_VENDOR_PHOTO_MAX_BYTES) {
        return { ok: false, status: 413, error: 'Photo is over the 8 MB cap.', code: 'too_large' };
      }

      const createdAt = now();
      const objectKey = buildVendorPhotoObjectKey(operatorId, vendorId, filename, createdAt);
      const stored = await deps.objects.put({
        operatorId,
        objectKey,
        bytes,
        contentType: contentType || 'application/octet-stream',
      });

      const photo: NagVendorPhotoRecord = {
        id: crypto.randomUUID(),
        operatorId,
        vendorId,
        filename: filename.trim(),
        contentType: contentType || 'application/octet-stream',
        byteLength: bytes.byteLength,
        objectKey: stored.objectKey,
        storageBackend: stored.storageBackend,
        sourceTags: [{ tag: 'unverified', source: `owner-upload:vendor-photo:${vendor.category}` }],
        createdAt: createdAt.toISOString(),
      };
      await deps.repo.insertPhoto(photo);
      return { ok: true, photo };
    },

    async listPhotos({ operatorId, vendorId }) {
      const vendor = await deps.repo.getVendor(operatorId, vendorId);
      if (!vendor) {
        return { ok: false, status: 404, error: 'Vendor not found.', code: 'vendor_not_found' };
      }
      const photos = await deps.repo.listPhotos(operatorId, vendorId);
      return { ok: true, vendor, photos };
    },
  };
}
