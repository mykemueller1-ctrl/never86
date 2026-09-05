import type { TagLevel } from '@/lib/sourceTags';

export type NagVendorCategory = 'food' | 'liquor';

export type NagVendorSourceTag = {
  tag: TagLevel;
  source: string;
};

export const NAG_VENDOR_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

export type NagVendorRecord = {
  id: string;
  operatorId: string;
  name: string;
  category: NagVendorCategory;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
};

export type NagVendorPhotoRecord = {
  id: string;
  operatorId: string;
  vendorId: string;
  filename: string;
  contentType: string;
  byteLength: number;
  objectKey: string;
  storageBackend: 'r2' | 'neon-object-fallback' | 'memory';
  sourceTags: NagVendorSourceTag[];
  createdAt: string;
};

export type NagVendorObjectStore = {
  put(input: {
    operatorId: string;
    objectKey: string;
    bytes: Uint8Array;
    contentType: string;
  }): Promise<{ objectKey: string; storageBackend: NagVendorPhotoRecord['storageBackend'] }>;
};

export type NagVendorRepository = {
  insertVendor(row: NagVendorRecord): Promise<NagVendorRecord>;
  listVendors(operatorId: string): Promise<NagVendorRecord[]>;
  getVendor(operatorId: string, vendorId: string): Promise<NagVendorRecord | null>;
  insertPhoto(row: NagVendorPhotoRecord): Promise<NagVendorPhotoRecord>;
  listPhotos(operatorId: string, vendorId: string): Promise<NagVendorPhotoRecord[]>;
};
