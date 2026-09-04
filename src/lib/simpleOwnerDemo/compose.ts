import {
  OWNER_PRIME_COST_EVIDENCE,
  getFreeOperatorAnswer,
  resolveOwnerDeskAsk,
  type OwnerDeskTrayId,
  type PrimeCostEvidence,
} from '@/lib/freeOperatorDemo';
import type { SimpleOwnerAskAnswer, SimpleOwnerReadiness, SimpleOwnerUploadRecord, SourceTag } from './types';

const EMPTY_EVIDENCE: readonly PrimeCostEvidence[] = OWNER_PRIME_COST_EVIDENCE.map((row) => ({
  ...row,
  state: 'NEED',
  reason:
    row.id === 'schedule'
      ? 'Weekly schedule is missing until a schedule file lands for this seat.'
      : row.id === 'hourly'
        ? 'Hourly sales stay Missing Evidence until a POS hourly file lands for this seat.'
        : 'Time clock stays Missing Evidence until punches land for this seat.',
}));

export function readinessFromUploads(
  operatorId: string,
  uploads: readonly SimpleOwnerUploadRecord[],
  askCount = 0,
): SimpleOwnerReadiness {
  const kinds = new Set(uploads.map((row) => row.evidenceKind));
  const evidence = EMPTY_EVIDENCE.map((row) => {
    if (!kinds.has(row.id)) return { ...row };
    const hit = uploads.find((upload) => upload.evidenceKind === row.id);
    return {
      ...row,
      state: 'READY' as const,
      reason: `${hit?.filename ?? row.title} is present for this seat. Named is not a verified close.`,
    };
  });
  const sourceTags: SourceTag[] = uploads.flatMap((row) => row.sourceTags);
  if (sourceTags.length === 0) {
    sourceTags.push({ tag: 'unverified', source: 'simple-owner-demo:no-uploads' });
  }
  return {
    operatorId,
    evidence,
    readyCount: evidence.filter((row) => row.state === 'READY').length,
    uploadCount: uploads.length,
    askCount,
    sourceTags,
  };
}

export function composeAskAnswer(input: {
  question: string;
  tray: OwnerDeskTrayId;
  readiness: SimpleOwnerReadiness;
  uploads: readonly SimpleOwnerUploadRecord[];
}): SimpleOwnerAskAnswer {
  const routed = resolveOwnerDeskAsk(input.question, input.tray);
  const slug = routed.ok ? routed.slug : 'unrouted';
  const sample = routed.ok ? getFreeOperatorAnswer(routed.slug) : null;
  const ready = input.readiness.evidence.filter((row) => row.state === 'READY').map((row) => row.short);
  const missing = input.readiness.evidence.filter((row) => row.state === 'NEED').map((row) => row.short);
  const sourceTags: SourceTag[] = [
    ...input.readiness.sourceTags,
    { tag: 'unverified', source: `simple-owner-ask:${slug}` },
  ];

  const evidenceFact =
    input.uploads.length === 0
      ? 'No files are on this seat yet. Prime Cost Coach stays NEED until schedule, hourly, and time clock land.'
      : `This seat has ${input.uploads.length} source-tagged upload(s). Ready: ${ready.join(', ') || 'none'}. Still NEED: ${missing.join(', ') || 'none'}.`;

  const persistFact = `Question and answer are stored for operator_id ${input.readiness.operatorId}. Files go to object storage with the same seat key.`;

  const facts = [
    evidenceFact,
    persistFact,
    sample?.facts[0] ?? 'This desk answers FOH, BOH, schedule, vendor, or merchant. It does not invent a close.',
    'No dollar is verified from an upload or a typed guess. Missing Evidence stays open.',
  ];

  return {
    slug,
    headline: sample?.headline ?? 'Ask is stored. I will not invent a close from an empty seat.',
    facts,
    coachTomorrow:
      sample?.coachTomorrow ??
      'Add the matching report for the same store and business date. I will rank the next move after the file lands.',
    needs: missing.length
      ? `Still NEED: ${missing.join(', ')}. ${sample?.needs ?? 'Name the report. Do not invent the percentage.'}`
      : (sample?.needs ?? 'Keep the same-day Z with hourly and punches. Do not invent the percentage.'),
    tags: sourceTags.map((tag) => `${tag.tag}:${tag.source}`),
    sourceTags,
    inventedClose: false,
    sampleDollars: 'none-verified',
    verifiedClose: false,
  };
}
