import { scanInjection, type IntakeDocument } from './closeIntake';
import { parsePdqNativeText, type PdqReportFamily } from './pdqEodParse';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type DocumentParseRecord = {
  family: PdqReportFamily;
  businessDate: string;
  rejected: boolean;
  rejectedReason: string | null;
};

function emptyParse(parsed: ReturnType<typeof parsePdqNativeText>): boolean {
  if (parsed.family === 'unknown') return true;
  if (parsed.family === 'z-summary') {
    return (
      parsed.netSales.value == null
      && parsed.mix.food.value == null
      && parsed.mix.beer.value == null
      && parsed.mix.liquor.value == null
      && parsed.mix.pop.value == null
    );
  }
  if (parsed.family === 'hourly') return parsed.rows.length === 0;
  if (parsed.family === 'void-promo') {
    return parsed.voids.value == null && parsed.promotions.value == null;
  }
  return true;
}

/**
 * Per-document parse evidence for the unattended gate.
 * Filename family detection is not enough: require a real parse, an ISO
 * business date from that document, and extracted fields. Same-day
 * re-uploads still collapse in unattendedRoutineGate via distinct dates.
 */
export function describeDocumentParse(doc: IntakeDocument): DocumentParseRecord {
  const parsed = parsePdqNativeText(doc.text, doc.filename || '');
  if (parsed.family === 'unknown') {
    return {
      family: 'unknown',
      businessDate: '',
      rejected: true,
      rejectedReason: 'unknown-family',
    };
  }

  const businessDate = parsed.businessDate || '';
  if (!ISO_DATE.test(businessDate)) {
    return {
      family: parsed.family,
      businessDate,
      rejected: true,
      rejectedReason: 'missing-business-date',
    };
  }

  if (emptyParse(parsed)) {
    return {
      family: parsed.family,
      businessDate,
      rejected: true,
      rejectedReason: 'empty-parse',
    };
  }

  if (scanInjection(doc.text)) {
    return {
      family: parsed.family,
      businessDate,
      rejected: true,
      rejectedReason: 'injection',
    };
  }

  return {
    family: parsed.family,
    businessDate,
    rejected: false,
    rejectedReason: null,
  };
}
