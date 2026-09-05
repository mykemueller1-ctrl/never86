import type { TagLevel } from '@/lib/sourceTags';
import type { OwnerDeskTrayId, PrimeCostEvidence } from '@/lib/freeOperatorDemo';
import type { DailyCompareChip, LaborRoleCard, OperatorV2FolderState } from '@/lib/operatorV2';

export const SIMPLE_OWNER_DEMO_ID = 'simple-owner-demo-v1';
export const SIMPLE_OWNER_COOKIE = 'n86_simple_owner';
export const SIMPLE_OWNER_MAX_BYTES = 8 * 1024 * 1024;

export type EvidenceKind =
  | 'schedule'
  | 'hourly'
  | 'timeclock'
  | 'labor-cards'
  | 'menu'
  | 'order-guide'
  | 'z'
  | 'void'
  | 'invoice'
  | 'other';

export type AskMouth = 'talk' | 'type' | 'photo' | 'file';

export type SourceTag = {
  tag: TagLevel;
  source: string;
};

export type SimpleOwnerUploadRecord = {
  id: string;
  operatorId: string;
  filename: string;
  contentType: string;
  byteLength: number;
  evidenceKind: EvidenceKind;
  sourceTags: SourceTag[];
  objectKey: string;
  storageBackend: 'r2' | 'neon-object-fallback' | 'memory';
  createdAt: string;
};

export type SimpleOwnerAskRecord = {
  id: string;
  operatorId: string;
  question: string;
  tray: OwnerDeskTrayId;
  mouth: AskMouth;
  slug: string | null;
  headline: string;
  facts: string[];
  coachTomorrow: string;
  needs: string;
  sourceTags: SourceTag[];
  inventedClose: false;
  sampleDollars: 'none-verified';
  verifiedClose: false;
  createdAt: string;
};

export type SimpleOwnerReadiness = {
  operatorId: string;
  evidence: PrimeCostEvidence[];
  folders: OperatorV2FolderState[];
  laborCards: LaborRoleCard[];
  dailyCompare: DailyCompareChip[];
  readyCount: number;
  uploadCount: number;
  askCount: number;
  sourceTags: SourceTag[];
};

export type SimpleOwnerAskAnswer = {
  slug: string;
  headline: string;
  facts: string[];
  coachTomorrow: string;
  needs: string;
  tags: string[];
  sourceTags: SourceTag[];
  inventedClose: false;
  sampleDollars: 'none-verified';
  verifiedClose: false;
};

export type ObjectPutResult = {
  objectKey: string;
  storageBackend: SimpleOwnerUploadRecord['storageBackend'];
};

export type SimpleOwnerObjectStore = {
  put(input: {
    operatorId: string;
    objectKey: string;
    bytes: Uint8Array;
    contentType: string;
  }): Promise<ObjectPutResult>;
};

export type SimpleOwnerRepository = {
  insertUpload(row: SimpleOwnerUploadRecord): Promise<SimpleOwnerUploadRecord>;
  listUploads(operatorId: string): Promise<SimpleOwnerUploadRecord[]>;
  insertAsk(row: SimpleOwnerAskRecord): Promise<SimpleOwnerAskRecord>;
  listAsks(operatorId: string): Promise<SimpleOwnerAskRecord[]>;
  countAsks(operatorId: string): Promise<number>;
};
