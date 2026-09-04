import { findFreeOperatorPrivacyHits, type OwnerDeskTrayId } from '@/lib/freeOperatorDemo';
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
} from './types';
import { SIMPLE_OWNER_MAX_BYTES } from './types';

export type SimpleOwnerDemoService = {
  upload(input: {
    operatorId: string;
    filename: string;
    contentType: string;
    bytes: Uint8Array;
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
    async upload({ operatorId, filename, contentType, bytes }) {
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
      const classified = classifyUpload(filename, contentType);
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
        sourceTags: classified.sourceTags,
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

      const uploads = await deps.repo.listUploads(operatorId);
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
        sampleDollars: 'none-verified',
        verifiedClose: false,
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
