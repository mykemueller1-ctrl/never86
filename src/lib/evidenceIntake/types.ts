export const EVIDENCE_STATES = [
  'Verified',
  'Reconciled',
  'Partial',
  'Estimated',
  'Unverified',
  'Missing Evidence',
] as const;

export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const PERIOD_STATUSES = ['Open', 'Closed', 'Partial'] as const;
export type PeriodStatus = (typeof PERIOD_STATUSES)[number];

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export const INTAKE_KINDS = [
  'invoice',
  'pos-close',
  'marketplace-statement',
  'photo-receipt',
  'unclassified',
] as const;

export type IntakeKind = (typeof INTAKE_KINDS)[number];

export const QUALITY_FLAGS = [
  'crop',
  'deskew',
  'glare',
  'blur',
  'rotation',
  'unreadable',
] as const;

export type QualityFlag = (typeof QUALITY_FLAGS)[number];

export const EXTRACTION_PATHS = ['native-pdf', 'ocr-fallback', 'unavailable'] as const;
export type ExtractionPath = (typeof EXTRACTION_PATHS)[number];

export const PAGE_STATUSES = ['accepted', 'rejected'] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

export const DOCUMENT_STATUSES = ['captured', 'duplicate', 'rejected', 'partial'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const BBOX_UNITS = ['pdf-pt', 'px', 'normalized'] as const;
export type BboxUnit = (typeof BBOX_UNITS)[number];

export type DecimalString = string;

export type BoundingBox = {
  x: DecimalString;
  y: DecimalString;
  width: DecimalString;
  height: DecimalString;
  unit: BboxUnit;
};

export type TextBlock = {
  text: string;
  confidence: DecimalString;
  lineIndex: number;
  boundingBox: BoundingBox | null;
};

export type ExtractedPage = {
  pageIndex: number;
  width: DecimalString | null;
  height: DecimalString | null;
  rotationDegrees: number;
  blocks: TextBlock[];
  errors: string[];
};

export type TypedValue =
  | { kind: 'null'; value: null }
  | { kind: 'text'; value: string }
  | { kind: 'integer'; value: string }
  | { kind: 'decimal'; value: DecimalString }
  | { kind: 'money'; value: DecimalString }
  | { kind: 'date'; value: string }
  | { kind: 'boolean'; value: boolean };

export type PageQualityObservation = {
  pageIndex: number;
  blurScore?: number;
  glareScore?: number;
  rotationDegrees?: number;
  deskewDegrees?: number;
  cropRatio?: number;
};

export type IntakePageInput = {
  pageIndex: number;
  bytes: Uint8Array;
  mimeType: string;
  filename?: string;
  quality?: PageQualityObservation;
};

export type ReportingPeriodInput = {
  timezone: string | null;
  businessDayCutoff: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  expectedBusinessDays: number | null;
  observedBusinessDays: number | null;
  moneyBasis: string | null;
};

export type EvidenceIntakeInput = {
  tenantId: string;
  storeId: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  pages?: IntakePageInput[];
  reportingPeriod?: ReportingPeriodInput;
  pageQuality?: PageQualityObservation[];
  requiredFieldKeys?: string[];
};

export type ExistingDocumentPointer = {
  documentId: string;
  contentSha256: string;
};

export type OcrPageRequest = {
  bytes: Uint8Array;
  mimeType: SupportedMimeType;
  pageIndex: number;
};

export type NativePdfExtractor = {
  extract(input: { bytes: Uint8Array }): Promise<ExtractedPage[]>;
};

export type OcrFallback = {
  extractPage(input: OcrPageRequest): Promise<ExtractedPage>;
};

export type ExtractedField = {
  fieldKey: string;
  rawValue: string | null;
  typedValue: TypedValue;
  typedMoney: DecimalString | null;
  confidence: DecimalString;
  pageIndex: number;
  lineIndex: number | null;
  boundingBox: BoundingBox | null;
  evidenceState: EvidenceState;
  errors: string[];
  injectionSuspected: boolean;
};

export type DocumentPage = {
  pageIndex: number;
  width: DecimalString | null;
  height: DecimalString | null;
  rotationDegrees: number;
  extractedText: string;
  blocks: TextBlock[];
  extractionPath: ExtractionPath;
  qualityFlags: QualityFlag[];
  status: PageStatus;
  errors: string[];
  injectionSuspected: boolean;
};

export type IntakeDocument = {
  tenantId: string;
  storeId: string;
  filename: string;
  mimeType: SupportedMimeType | 'unsupported';
  contentSha256: string;
  rawObjectPointer: string;
  intakeKind: IntakeKind;
  evidenceState: EvidenceState;
  duplicateOfDocumentId: string | null;
  shouldInsertDocument: boolean;
  injectionSuspected: boolean;
  status: DocumentStatus;
  timezone: string | null;
  businessDayCutoff: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  moneyBasis: string | null;
  errors: string[];
};

export type AgentRunRecord = {
  tenantId: string;
  storeId: string;
  agentName: 'intake-classifier' | 'quality-gate' | 'source-collector';
  status: 'succeeded' | 'partial' | 'failed';
  inputHash: string;
  outputSummary: Record<string, unknown>;
};

export type AuditLogRecord = {
  tenantId: string;
  storeId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
};

export type PeriodEvaluation = {
  status: PeriodStatus;
  evidenceState: EvidenceState;
  timezone: string | null;
  businessDayCutoff: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  moneyBasis: string | null;
  errors: string[];
};

export type EvidenceIntakeResult = {
  document: IntakeDocument;
  pages: DocumentPage[];
  fields: ExtractedField[];
  agentRuns: AgentRunRecord[];
  auditLog: AuditLogRecord[];
  period: PeriodEvaluation | null;
};

export const EVIDENCE_INTAKE_RLS_BLOCKER = [
  'The Neon Drizzle client (src/db/index.ts) uses @neondatabase/serverless HTTP: each query is a new request, so SET LOCAL app.tenant_id cannot stick.',
  'Operator isolation today is an HMAC cookie (operatorSession) with operatorId, never a Postgres session GUC or JWT claim on the Neon role.',
  'Existing current_operator_id() RLS is a Supabase authenticated-JWT policy. Enabling or FORCEing RLS on these Neon tables without a per-transaction tenant GUC would either be owner-bypass (fake isolation) or deny every app query.',
].join(' ');
