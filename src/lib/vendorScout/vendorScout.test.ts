import { describe, expect, it } from 'vitest';
import { photoEvidenceStatus, vendorInput, vendorPhotoIntake } from './types';

describe('vendorScout', () => {
  it('accepts a minimal food vendor', () => {
    const result = vendorInput.safeParse({
      operatorId: 'op-1',
      name: 'Local Produce Co.',
      category: 'produce',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a liquor vendor with delivery days', () => {
    const result = vendorInput.safeParse({
      operatorId: 'op-1',
      name: 'Regional Beverage Distributors',
      category: 'liquor',
      deliveryDays: ['Tuesday', 'Friday'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown vendor category', () => {
    const result = vendorInput.safeParse({
      operatorId: 'op-1',
      name: 'Mystery Supplier',
      category: 'gadgets',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid photo intake record', () => {
    const result = vendorPhotoIntake.safeParse({
      vendorId: 'v-1',
      operatorId: 'op-1',
      photoType: 'invoice',
      fileUrl: 'https://example.com/photo.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a photo intake missing a fileUrl', () => {
    const result = vendorPhotoIntake.safeParse({
      vendorId: 'v-1',
      operatorId: 'op-1',
      photoType: 'invoice',
      fileUrl: '',
    });
    expect(result.success).toBe(false);
  });

  it('marks an unread photo as Open, not a fact', () => {
    expect(photoEvidenceStatus({ ocrText: undefined })).toBe('open');
    expect(photoEvidenceStatus({ ocrText: '' })).toBe('open');
  });

  it('marks an OCR-read photo as Estimated, not Verified', () => {
    expect(photoEvidenceStatus({ ocrText: 'Sysco invoice #123' })).toBe('estimated');
  });
});
