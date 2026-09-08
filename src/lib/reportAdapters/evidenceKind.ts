import type { EvidenceKind } from '@/lib/simpleOwnerDemo/types';
import type { ReportAdapterHit } from './types';

/** Map a registered POS+family onto the seat folder kind. Desk compose stays family-driven. */
export function evidenceKindForReport(hit: ReportAdapterHit): EvidenceKind {
  switch (hit.family) {
    case 'sales-summary':
    case 'z-summary':
      return 'z';
    case 'labor-breakdown':
    case 'time-entries':
      return 'timeclock';
    case 'item-selection':
    case 'void-promo':
      return 'void';
    case 'hourly':
      return 'hourly';
    case 'invoice':
    case 'catalog':
    case 'order-email':
    case 'monday-batch':
      return 'invoice';
    case 'charge-slip':
      return 'invoice-truck';
    default:
      return 'other';
  }
}
