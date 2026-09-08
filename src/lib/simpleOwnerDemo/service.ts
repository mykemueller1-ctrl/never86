import { findFreeOperatorPrivacyHits, type OwnerDeskTrayId } from '@/lib/freeOperatorDemo';
import {
  flagInvoiceDuplicates,
  invoiceIdentityFromTags,
  invoiceIdentityKey,
  normalizeInvoiceNumber,
  normalizeVendorKey,
  parseLabeledInvoiceTotalCents,
  vendorTotalKey,
} from '@/lib/invoiceIdentity';
import { decodeInvoiceSource, looksLikeVendorInvoice, parseVendorInvoice } from '@/lib/vendorInvoiceParse';
import { detectReport } from '@/lib/reportAdapters';
import { packFromSourceTag, toastSourceTags } from '@/lib/toastParse';
import { buildObjectKey, classifyUpload } from './classify';
import { composeAskAnswer, readinessFromUploads } from './compose';
import type {
  AskMouth,
  SimpleOwnerAskAnswer,
  SimpleOwnerAskRecord,
  SimpleOwnerObjectStore,
  SimpleOwnerReadiness,
  SimpleOwnerRepository,
  SimpleOwnerUploadRecord,
  SourceTag,
} from './types';
import { SIMPLE_OWNER_MAX_BYTES } from './types';

async function hydrateToastUploads(
  uploads: SimpleOwnerUploadRecord[],
  objects: SimpleOwnerObjectStore,
): Promise<SimpleOwnerUploadRecord[]> {
  if (!objects.get) return uploads;
  return Promise.all(
    uploads.map(async (upload) => {
      if (!detectReport(upload.filename)) return upload;
      if (upload.sourceTags.some((tag) => packFromSourceTag(tag))) return upload;
      const blob = await objects.get?.({ operatorId: upload.operatorId, objectKey: upload.objectKey });
      if (!blob) return upload;
      return {
        ...upload,
        sourceTags: [...upload.sourceTags, ...toastSourceTags(upload.filename, blob.bytes)],
      };
    }),
  );
}

function invoiceIdentityTags(
  filename: string,
  contentType: string,
  bytes: Uint8Array,
  existing: readonly SimpleOwnerUploadRecord[],
): SourceTag[] {
  const textish =
    /text|csv|pdf/i.test(contentType) || /\.(csv|txt|pdf)$/i.test(filename);
  if (!textish) return [];
  let text = '';
  try {
    text = decodeInvoiceSource(bytes, filename);
  } catch {
    return [];
  }
  if (!looksLikeVendorInvoice(text, filename)) return [];

  const parsed = parseVendorInvoice(text, filename);
  const invoiceNumber = normalizeInvoiceNumber(parsed.invoiceNumber);
  const totalCents = parseLabeledInvoiceTotalCents(text);
  const vendorKey = normalizeVendorKey(parsed.vendor);
  const tags: SourceTag[] = [];
  if (invoiceIdentityKey(invoiceNumber)) {
    tags.push({ tag: 'unverified', source: `invoice-id:${invoiceNumber}` });
  }
  if (vendorKey && vendorTotalKey(parsed.vendor, totalCents)) {
    tags.push({ tag: 'unverified', source: `invoice-vendor-total:${vendorKey}:${totalCents}` });
  }
  if (tags.length === 0) return [];

  const prior = existing.map((row) => ({
    id: row.id,
    filename: row.filename,
    ...invoiceIdentityFromTags(row.sourceTags),
  }));
  const hits = flagInvoiceDuplicates([
    ...prior,
    { id: 'incoming', filename, invoiceNumber, vendor: parsed.vendor, totalCents },
  ]);
  for (const hit of hits) {
    tags.push({ tag: 'unverified', source: `invoice-dup-flag:${hit.flag}` });
  }
  return tags;
}

export type SimpleOwnerDemoService = {
  upload(input: {
    operatorId: string;
    filename: string;
    contentType: string;
    bytes: Uint8Array;
    folder?: string;
  }): Promise<
    | { ok: true; upload: SimpleOwnerUploadRecord; readiness: SimpleOwnerReadiness }
    | { ok: false; status: number; error: string; code: string }
  >;
  ask(input: {
    operatorId: string;
    question: string;
    tray?: OwnerDeskTrayId;
    mouth?: AskMouth;
  }): Promise<
    | {
        ok: true;
        answer: SimpleOwnerAskAnswer;
        record: SimpleOwnerAskRecord;
        readiness: SimpleOwnerReadiness;
      }
    | { ok: false; status: number; error: string; code: string }
  >;
  readiness(operatorId: string): Promise<SimpleOwnerReadiness>;
};

export function createSimpleOwnerDemoService(deps: {
  repo: SimpleOwnerRepository;
  objects: SimpleOwnerObjectStore;
  now?: () => Date;
}): SimpleOwnerDemoService {
  const now = deps.now ?? (() => new Date());

  async function snapshot(operatorId: string): Promise<SimpleOwnerReadiness> {
    const [uploads, askCount] = await Promise.all([
      deps.repo.listUploads(operatorId),
      deps.repo.countAsks(operatorId),
    ]);
    return readinessFromUploads(operatorId, uploads, askCount);
  }

  return {
    async upload({ operatorId, filename, contentType, bytes, folder }) {
      if (!filename.trim()) {
        return { ok: false, status: 400, error: 'Name the file.', code: 'filename_required' };
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
        return { ok: false, status: 400, error: 'File is empty.', code: 'empty_file' };
      }
      if (bytes.byteLength > SIMPLE_OWNER_MAX_BYTES) {
        return { ok: false, status: 413, error: 'File is over the 8 MB seat cap.', code: 'too_large' };
      }

      const createdAt = now();
      const classified = classifyUpload(filename, contentType, folder);
      const existing = await deps.repo.listUploads(operatorId);
      const identityTags = invoiceIdentityTags(filename, contentType, bytes, existing);
      const toastTags = toastSourceTags(filename, bytes);
      const objectKey = buildObjectKey(operatorId, filename, createdAt);
      const stored = await deps.objects.put({
        operatorId,
        objectKey,
        bytes,
        contentType: contentType || 'application/octet-stream',
      });

      const upload: SimpleOwnerUploadRecord = {
        id: crypto.randomUUID(),
        operatorId,
        filename: filename.trim(),
        contentType: contentType || 'application/octet-stream',
        byteLength: bytes.byteLength,
        evidenceKind: classified.kind,
        sourceTags: [...classified.sourceTags, ...identityTags, ...toastTags],
        objectKey: stored.objectKey,
        storageBackend: stored.storageBackend,
        createdAt: createdAt.toISOString(),
      };
      await deps.repo.insertUpload(upload);
      return { ok: true, upload, readiness: await snapshot(operatorId) };
    },

    async ask({ operatorId, question, tray = 'action', mouth = 'type' }) {
      const trimmed = question.trim();
      if (!trimmed) {
        return {
          ok: false,
          status: 400,
          error: 'Ask is empty. The mouth is ready. The close is not.',
          code: 'empty_ask',
        };
      }
      if (findFreeOperatorPrivacyHits(trimmed).length > 0) {
        return {
          ok: false,
          status: 400,
          error: 'Do not paste private staff names, PINs, or live dollars here.',
          code: 'privacy_blocked',
        };
      }

      const uploads = await hydrateToastUploads(
        await deps.repo.listUploads(operatorId),
        deps.objects,
      );
      const readiness = readinessFromUploads(operatorId, uploads);
      const answer = composeAskAnswer({ question: trimmed, tray, readiness, uploads });
      const record: SimpleOwnerAskRecord = {
        id: crypto.randomUUID(),
        operatorId,
        question: trimmed,
        tray,
        mouth,
        slug: answer.slug,
        headline: answer.headline,
        facts: [...answer.facts],
        coachTomorrow: answer.coachTomorrow,
        needs: answer.needs,
        sourceTags: answer.sourceTags,
        inventedClose: false,
        sampleDollars: answer.sampleDollars,
        verifiedClose: answer.verifiedClose,
        createdAt: now().toISOString(),
      };
      await deps.repo.insertAsk(record);
      return {
        ok: true,
        answer,
        record,
        readiness: await snapshot(operatorId),
      };
    },

    async readiness(operatorId) {
      return snapshot(operatorId);
    },
  };
}
