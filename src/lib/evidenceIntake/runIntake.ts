import { classifyIntakeKind, defaultRequiredFields, detectMime } from './classify';
import { rollupEvidenceState, evidenceStateForField } from './evidenceState';
import { contentBytes, sha256Hex, rawObjectPointer, dedupeKey } from './hash';
import { scanInjection } from './injection';
import { formatConfidence, parseInteger, parseMoney } from './money';
import { hasNativePdfExtractor, hasOcrFallback, pageHasUsableText, selectExtractionPath } from './ocr';
import { evaluateReportingPeriod } from './period';
import { qualityFlagsFor } from './quality';
import type {
  AgentRunRecord,
  AuditLogRecord,
  DocumentPage,
  DocumentStatus,
  EvidenceIntakeInput,
  EvidenceIntakeResult,
  ExistingDocumentPointer,
  ExtractedField,
  ExtractedPage,
  IntakeDocument,
  IntakePageInput,
  NativePdfExtractor,
  OcrFallback,
  PageQualityObservation,
  SupportedMimeType,
  TextBlock,
  TypedValue,
} from './types';

const FIELD_TOKEN = /\b([A-Za-z][A-Za-z0-9_]*)\s*[:=]\s*(\S+)/g;
const EXTRACTOR_ERRORS = new Set([
  'native_pdf_extractor_failed',
  'ocr_fallback_failed',
  'native_pdf_extractor_unavailable',
  'ocr_fallback_unavailable',
  'native_text_missing_ocr_unavailable',
  'invalid_page_index',
  'duplicate_page_index',
  'negative_page_index',
]);

function typeField(fieldKey: string, raw: string): { typed: TypedValue; money: string | null; error: string | null } {
  const moneyKeys = /total|sales|amount|payout|cost|fee|price/i;
  if (moneyKeys.test(fieldKey)) {
    const parsed = parseMoney(raw);
    if (!parsed.ok) return { typed: { kind: 'text', value: raw }, money: null, error: parsed.error };
    return { typed: { kind: 'money', value: parsed.value }, money: parsed.value, error: null };
  }
  if (/date/i.test(fieldKey)) return { typed: { kind: 'date', value: raw.trim() }, money: null, error: null };
  if (/count|qty|quantity/i.test(fieldKey)) {
    const parsed = parseInteger(raw);
    if (!parsed.ok) return { typed: { kind: 'text', value: raw }, money: null, error: parsed.error };
    return { typed: { kind: 'integer', value: parsed.value }, money: null, error: null };
  }
  return { typed: { kind: 'text', value: raw }, money: null, error: null };
}

function blockText(blocks: TextBlock[]): string {
  return [...blocks].sort((a, b) => a.lineIndex - b.lineIndex).map((b) => b.text).join('\n');
}

function emptyPage(pageIndex: number, rotationDegrees: number, errors: string[]): ExtractedPage {
  return {
    pageIndex,
    width: null,
    height: null,
    rotationDegrees,
    blocks: [],
    errors,
  };
}

function toPage(
  extracted: ExtractedPage,
  path: DocumentPage['extractionPath'],
  observation: PageQualityObservation | undefined,
  extraErrors: string[],
  forceReject = false,
): DocumentPage {
  const text = blockText(extracted.blocks);
  const quality = qualityFlagsFor(observation, text);
  const errors = [...new Set([...extracted.errors, ...extraErrors, ...quality.errors])];
  const injection = scanInjection(text);
  return {
    pageIndex: extracted.pageIndex,
    width: extracted.width,
    height: extracted.height,
    rotationDegrees: extracted.rotationDegrees,
    extractedText: text,
    blocks: extracted.blocks,
    extractionPath: path,
    qualityFlags: quality.flags,
    status: forceReject || quality.reject ? 'rejected' : 'accepted',
    errors,
    injectionSuspected: injection.suspected,
  };
}

export function validatePhotoPageIndexes(pages: IntakePageInput[]): string | null {
  const seen = new Set<number>();
  for (const page of pages) {
    if (!Number.isInteger(page.pageIndex) || page.pageIndex < 0) return 'negative_page_index';
    if (seen.has(page.pageIndex)) return 'duplicate_page_index';
    seen.add(page.pageIndex);
  }
  return null;
}

function extractFieldsFromBlocks(
  pageIndex: number,
  blocks: TextBlock[],
  pageRejected: boolean,
  injectionSuspected: boolean,
): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const ordered = [...blocks].sort((a, b) => a.lineIndex - b.lineIndex);
  for (const block of ordered) {
    const scanner = new RegExp(FIELD_TOKEN.source, 'g');
    let match: RegExpExecArray | null;
    const confidence = formatConfidence(block.confidence);
    while ((match = scanner.exec(block.text))) {
      const fieldKey = match[1];
      const rawValue = match[2].trim();
      const typed = typeField(fieldKey, rawValue);
      fields.push({
        fieldKey,
        rawValue,
        typedValue: typed.typed,
        typedMoney: typed.money,
        confidence: confidence.ok ? confidence.value : '0.0000',
        pageIndex,
        lineIndex: block.lineIndex,
        boundingBox: block.boundingBox,
        evidenceState: evidenceStateForField({
          rawValue,
          parseError: typed.error ?? (confidence.ok ? null : confidence.error),
          injectionSuspected,
          pageRejected,
        }),
        errors: [
          ...(typed.error ? [typed.error] : []),
          ...(confidence.ok ? [] : [confidence.error]),
        ],
        injectionSuspected,
      });
    }
  }
  return fields;
}

function orderedPhotoPages(input: EvidenceIntakeInput): IntakePageInput[] {
  if (input.pages && input.pages.length > 0) {
    return [...input.pages].sort((a, b) => a.pageIndex - b.pageIndex);
  }
  return [{
    pageIndex: 0,
    bytes: input.bytes,
    mimeType: input.mimeType,
    filename: input.filename,
  }];
}

async function tryNativeExtract(
  nativePdf: NativePdfExtractor,
  bytes: Uint8Array,
): Promise<{ pages: ExtractedPage[]; failed: boolean }> {
  try {
    return { pages: await nativePdf.extract({ bytes }), failed: false };
  } catch {
    return { pages: [], failed: true };
  }
}

async function tryOcrExtract(
  ocr: OcrFallback,
  bytes: Uint8Array,
  mimeType: SupportedMimeType,
  pageIndex: number,
): Promise<{ page: ExtractedPage; failed: boolean }> {
  try {
    return { page: await ocr.extractPage({ bytes, mimeType, pageIndex }), failed: false };
  } catch {
    return { page: emptyPage(pageIndex, 0, ['ocr_fallback_failed']), failed: true };
  }
}

async function extractPdfPages(
  input: EvidenceIntakeInput,
  mimeType: SupportedMimeType,
  deps: { nativePdf?: NativePdfExtractor; ocr?: OcrFallback },
): Promise<DocumentPage[]> {
  const nativePdf = deps.nativePdf;
  const nativeAvailable = hasNativePdfExtractor(nativePdf);
  const ocrAvailable = hasOcrFallback(deps.ocr);
  let nativePages: ExtractedPage[] = [];
  let nativeFailed = false;
  if (nativeAvailable) {
    const result = await tryNativeExtract(nativePdf, input.bytes);
    nativePages = result.pages;
    nativeFailed = result.failed;
  }

  const pageIndexes = nativePages.length > 0
    ? nativePages.map((p) => p.pageIndex).sort((a, b) => a - b)
    : [0];

  const pages: DocumentPage[] = [];
  for (const pageIndex of pageIndexes) {
    const native = nativePages.find((p) => p.pageIndex === pageIndex);
    const observation = input.pageQuality?.find((q) => q.pageIndex === pageIndex)
      ?? input.pages?.find((p) => p.pageIndex === pageIndex)?.quality;
    const nativeTextPresent = !nativeFailed && pageHasUsableText(native?.blocks ?? []);
    const path = selectExtractionPath({
      mimeType,
      nativeExtractorAvailable: nativeAvailable && !nativeFailed,
      nativeTextPresent,
      ocrAvailable,
    });

    const extraErrors: string[] = [];
    if (nativeFailed) extraErrors.push('native_pdf_extractor_failed');
    if (!nativeAvailable) extraErrors.push('native_pdf_extractor_unavailable');

    let extracted: ExtractedPage = native ?? emptyPage(
      pageIndex,
      observation?.rotationDegrees ?? 0,
      nativeAvailable && !nativeFailed ? [] : extraErrors,
    );

    if (path === 'ocr-fallback' && deps.ocr) {
      const ocrResult = await tryOcrExtract(deps.ocr, input.bytes, mimeType, pageIndex);
      extracted = ocrResult.page;
      if (ocrResult.failed) extraErrors.push('ocr_fallback_failed');
      extraErrors.push(...extracted.errors);
    } else if (path === 'unavailable') {
      extraErrors.push(nativeAvailable && !nativeFailed ? 'native_text_missing_ocr_unavailable' : 'ocr_fallback_unavailable');
    }

    pages.push(toPage(extracted, path, observation, extraErrors));
  }
  return pages;
}

async function extractImagePages(
  input: EvidenceIntakeInput,
  deps: { ocr?: OcrFallback },
): Promise<DocumentPage[]> {
  if (input.pages && input.pages.length > 0) {
    const invalid = validatePhotoPageIndexes(input.pages);
    if (invalid) {
      return [toPage(emptyPage(0, 0, [invalid]), 'unavailable', undefined, [invalid], true)];
    }
  }

  const ocrAvailable = hasOcrFallback(deps.ocr);
  const sourcePages = orderedPhotoPages(input);
  const pages: DocumentPage[] = [];

  for (const source of sourcePages) {
    const mimeType = detectMime(source.bytes, source.mimeType, source.filename ?? input.filename);
    const observation = source.quality
      ?? input.pageQuality?.find((q) => q.pageIndex === source.pageIndex);
    const path = selectExtractionPath({
      mimeType,
      nativeExtractorAvailable: false,
      nativeTextPresent: false,
      ocrAvailable,
    });
    const extraErrors: string[] = [];
    if (mimeType === 'unsupported') extraErrors.push('unsupported_mime');

    let extracted = emptyPage(source.pageIndex, observation?.rotationDegrees ?? 0, []);

    if (path === 'ocr-fallback' && deps.ocr && mimeType !== 'unsupported') {
      const ocrResult = await tryOcrExtract(deps.ocr, source.bytes, mimeType, source.pageIndex);
      extracted = ocrResult.page;
      if (ocrResult.failed) extraErrors.push('ocr_fallback_failed');
      extraErrors.push(...extracted.errors);
    } else if (mimeType !== 'unsupported') {
      extraErrors.push('ocr_fallback_unavailable');
    }

    pages.push(toPage(extracted, path, observation, extraErrors, mimeType === 'unsupported'));
  }
  return pages;
}

function documentAuditEvent(status: DocumentStatus): 'document.captured' | 'document.partial' | 'document.rejected' | 'document.duplicate' {
  if (status === 'duplicate') return 'document.duplicate';
  if (status === 'partial') return 'document.partial';
  if (status === 'rejected') return 'document.rejected';
  return 'document.captured';
}

export async function runEvidenceIntake(
  input: EvidenceIntakeInput,
  deps: {
    nativePdf?: NativePdfExtractor;
    ocr?: OcrFallback;
    existing?: ExistingDocumentPointer[];
  } = {},
): Promise<EvidenceIntakeResult> {
  const mimeType = detectMime(input.bytes, input.mimeType, input.filename);
  const photoIndexError = input.pages && input.pages.length > 0 && mimeType !== 'application/pdf'
    ? validatePhotoPageIndexes(input.pages)
    : null;
  const digestBytes = photoIndexError ? input.bytes : contentBytes(input);
  const contentSha256 = sha256Hex(digestBytes);
  const pointer = rawObjectPointer(input.tenantId, input.storeId, contentSha256);
  const key = dedupeKey(input.tenantId, input.storeId, contentSha256);
  const duplicate = (deps.existing ?? []).find(
    (row) => dedupeKey(input.tenantId, input.storeId, row.contentSha256) === key,
  );

  const pages = mimeType === 'application/pdf'
    ? await extractPdfPages(input, mimeType, deps)
    : await extractImagePages(input, deps);

  const kind = classifyIntakeKind({
    mimeType,
    filename: input.filename,
    nativeText: pages.map((p) => p.extractedText).join('\n'),
  });
  const required = input.requiredFieldKeys ?? defaultRequiredFields(kind);

  const fields: ExtractedField[] = [];
  for (const page of pages) {
    const extracted = extractFieldsFromBlocks(
      page.pageIndex,
      page.blocks,
      page.status === 'rejected',
      page.injectionSuspected,
    );
    if (page.status === 'rejected') {
      for (const field of extracted) field.errors.push('page_rejected');
    }
    fields.push(...extracted);
  }

  const present = new Set(fields.filter((f) => f.rawValue).map((f) => f.fieldKey));
  for (const keyName of required) {
    if (!present.has(keyName)) {
      fields.push({
        fieldKey: keyName,
        rawValue: null,
        typedValue: { kind: 'null', value: null },
        typedMoney: null,
        confidence: '0.0000',
        pageIndex: pages[0]?.pageIndex ?? 0,
        lineIndex: null,
        boundingBox: null,
        evidenceState: 'Missing Evidence',
        errors: ['missing_required_field'],
        injectionSuspected: pages.some((p) => p.injectionSuspected),
      });
    }
  }

  const injectionSuspected = pages.some((p) => p.injectionSuspected) || fields.some((f) => f.injectionSuspected);
  const rejectedPages = pages.filter((p) => p.status === 'rejected').length;
  const acceptedPages = pages.filter((p) => p.status === 'accepted').length;
  const missingRequired = fields.filter((f) => f.errors.includes('missing_required_field')).length;
  const fieldErrors = fields.filter((f) => f.errors.length > 0).length;
  const extractorErrors = pages.reduce(
    (count, page) => count + page.errors.filter((error) => EXTRACTOR_ERRORS.has(error)).length,
    0,
  );
  const usableEvidence = acceptedPages > 0 || fields.some((f) => Boolean(f.rawValue));
  const period = input.reportingPeriod ? evaluateReportingPeriod(input.reportingPeriod) : null;

  let status: DocumentStatus;
  if (duplicate) status = 'duplicate';
  else if (mimeType === 'unsupported' || !usableEvidence) status = 'rejected';
  else if (fieldErrors > 0 || extractorErrors > 0 || missingRequired > 0 || rejectedPages > 0) status = 'partial';
  else status = 'captured';

  const document: IntakeDocument = {
    tenantId: input.tenantId,
    storeId: input.storeId,
    filename: input.filename,
    mimeType,
    contentSha256,
    rawObjectPointer: pointer,
    intakeKind: kind,
    evidenceState: rollupEvidenceState({
      duplicate: Boolean(duplicate),
      unsupported: mimeType === 'unsupported',
      injectionSuspected,
      usableEvidence,
      fieldErrors,
      extractorErrors,
      rejectedPages,
      missingRequired,
    }),
    duplicateOfDocumentId: duplicate?.documentId ?? null,
    shouldInsertDocument: !duplicate,
    injectionSuspected,
    status,
    timezone: input.reportingPeriod?.timezone ?? null,
    businessDayCutoff: input.reportingPeriod?.businessDayCutoff ?? null,
    periodStart: input.reportingPeriod?.periodStart ?? null,
    periodEnd: input.reportingPeriod?.periodEnd ?? null,
    moneyBasis: input.reportingPeriod?.moneyBasis ?? null,
    errors: [
      ...(duplicate ? ['duplicate_content_hash'] : []),
      ...(mimeType === 'unsupported' ? ['unsupported_mime'] : []),
      ...pages.flatMap((p) => p.errors.map((e) => `page_${p.pageIndex}:${e}`)),
      ...fields.flatMap((f) => f.errors.map((e) => `field_${f.fieldKey}:${e}`)),
    ],
  };

  const agentRuns: AgentRunRecord[] = [
    {
      tenantId: input.tenantId,
      storeId: input.storeId,
      agentName: 'source-collector',
      status: document.status === 'rejected' ? 'failed' : document.status === 'partial' || document.status === 'duplicate' ? 'partial' : 'succeeded',
      inputHash: contentSha256,
      outputSummary: { status: document.status, mimeType, pages: pages.length, shouldInsertDocument: document.shouldInsertDocument },
    },
    {
      tenantId: input.tenantId,
      storeId: input.storeId,
      agentName: 'intake-classifier',
      status: 'succeeded',
      inputHash: contentSha256,
      outputSummary: { intakeKind: kind, extractionPaths: pages.map((p) => p.extractionPath) },
    },
    {
      tenantId: input.tenantId,
      storeId: input.storeId,
      agentName: 'quality-gate',
      status: rejectedPages > 0 ? 'partial' : 'succeeded',
      inputHash: contentSha256,
      outputSummary: { rejectedPages, flags: pages.flatMap((p) => p.qualityFlags) },
    },
  ];

  const auditLog: AuditLogRecord[] = [
    {
      tenantId: input.tenantId,
      storeId: input.storeId,
      eventType: documentAuditEvent(document.status),
      entityType: 'document',
      entityId: duplicate?.documentId ?? contentSha256,
      payload: {
        pointer,
        filename: input.filename,
        mimeType,
        shouldInsertDocument: document.shouldInsertDocument,
        duplicateOfDocumentId: document.duplicateOfDocumentId,
      },
    },
  ];
  for (const page of pages) {
    if (page.status === 'rejected') {
      auditLog.push({
        tenantId: input.tenantId,
        storeId: input.storeId,
        eventType: 'page.rejected',
        entityType: 'document_page',
        entityId: `${contentSha256}:${page.pageIndex}`,
        payload: { errors: page.errors, qualityFlags: page.qualityFlags },
      });
    }
    if (page.injectionSuspected) {
      auditLog.push({
        tenantId: input.tenantId,
        storeId: input.storeId,
        eventType: 'injection.flagged',
        entityType: 'document_page',
        entityId: `${contentSha256}:${page.pageIndex}`,
        payload: { instruction: 'ignored', textUsedAs: 'data-only' },
      });
    }
  }
  if (!duplicate) {
    for (const field of fields) {
      auditLog.push({
        tenantId: input.tenantId,
        storeId: input.storeId,
        eventType: 'field.extracted',
        entityType: 'extracted_field',
        entityId: `${contentSha256}:${field.fieldKey}:${field.pageIndex}`,
        payload: { rawValue: field.rawValue, errors: field.errors, evidenceState: field.evidenceState },
      });
    }
  }

  return { document, pages, fields, agentRuns, auditLog, period };
}

export function appendOnlyAuditInsert(record: AuditLogRecord): AuditLogRecord {
  return {
    tenantId: record.tenantId,
    storeId: record.storeId,
    eventType: record.eventType,
    entityType: record.entityType,
    entityId: record.entityId,
    payload: record.payload,
  };
}
