import {
  OWNER_PRIME_COST_EVIDENCE,
  getFreeOperatorAnswer,
  resolveOwnerDeskAsk,
  type OwnerDeskTrayId,
  type PrimeCostEvidence,
} from '@/lib/freeOperatorDemo';
import {
  DAY1_OPEN_ASK,
  DAY1_SUBLINE,
  day1HookCoach,
  firstPhotoWinLine,
  looksLikeDay1VendorAsk,
} from '@/lib/day1Coach';
import {
  dailyCompareFromEvidence,
  filledPlateIds,
  projectFoldersFromKinds,
  spawnLaborRoleCards,
} from '@/lib/operatorV2';
import { vendorBabysitLine } from '@/lib/vendorCadenceConfig';
import {
  answerToastDeskQuestion,
  collectToastFacts,
  isToastParseDisplayTag,
  routeToastDeskQuestion,
} from '@/lib/toastParse';
import {
  answerPdqDeskQuestion,
  collectPdqFacts,
  isPdqParseDisplayTag,
  routePdqDeskQuestion,
} from '@/lib/pdqDesk';
import {
  answerHyveeDeskQuestion,
  collectHyveeFacts,
  routeHyveeDeskQuestion,
} from '@/lib/hyveeWineParse';
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
  const folders = projectFoldersFromKinds(kinds);
  const scheduleReady = kinds.has('schedule');
  const laborCardsReady = kinds.has('labor-cards');
  const clockReady = kinds.has('timeclock');
  return {
    operatorId,
    evidence,
    folders,
    laborCards: spawnLaborRoleCards({ scheduleReady, laborCardsReady, clockReady }),
    dailyCompare: dailyCompareFromEvidence({ scheduleReady, clockReady }),
    readyCount: evidence.filter((row) => row.state === 'READY').length,
    uploadCount: uploads.length,
    askCount,
    sourceTags,
  };
}

function persistFactFor(operatorId: string): string {
  return `Question and answer are stored for operator_id ${operatorId}. Files go to object storage with the same seat key.`;
}

function isHiddenParseTag(tag: SourceTag): boolean {
  return isToastParseDisplayTag(tag) || isPdqParseDisplayTag(tag) || tag.source.startsWith('hyvee-parse:v1:');
}

export function composeAskAnswer(input: {
  question: string;
  tray: OwnerDeskTrayId;
  readiness: SimpleOwnerReadiness;
  uploads: readonly SimpleOwnerUploadRecord[];
}): SimpleOwnerAskAnswer {
  const hyveeFacts = collectHyveeFacts(input.uploads);
  const hyveeKind = routeHyveeDeskQuestion(input.question);
  const hyveeAnswer =
    hyveeKind && (hyveeFacts.hasHyvee || hyveeKind !== 'glue')
      ? answerHyveeDeskQuestion(input.question, hyveeFacts)
      : null;
  if (hyveeAnswer) {
    const sourceTags: SourceTag[] = [
      ...hyveeAnswer.sourceTags,
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag)),
      { tag: hyveeAnswer.verifiedClose ? 'verified' : 'unverified', source: `simple-owner-ask:${hyveeAnswer.slug}` },
    ];
    return {
      slug: hyveeAnswer.slug,
      headline: hyveeAnswer.headline,
      facts: [...hyveeAnswer.facts, persistFactFor(input.readiness.operatorId)],
      coachTomorrow: hyveeAnswer.coachTomorrow,
      needs: hyveeAnswer.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: hyveeAnswer.sampleDollars,
      verifiedClose: hyveeAnswer.verifiedClose,
    };
  }

  const pdqFacts = collectPdqFacts(input.uploads);
  const pdqKind = routePdqDeskQuestion(input.question);
  const clearlyPdq = /pdq|z ?report|large pizza|void_promo|void promo|hourly_sales|spec instruction|neg menu|menu category|uknown/.test(
    input.question.toLowerCase(),
  );
  const pdqAnswer =
    pdqKind && (pdqFacts.hasPdq || clearlyPdq)
      ? answerPdqDeskQuestion(input.question, pdqFacts)
      : null;
  if (pdqAnswer) {
    const sourceTags: SourceTag[] = [
      ...pdqAnswer.sourceTags,
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag)),
      { tag: pdqAnswer.verifiedClose ? 'verified' : 'unverified', source: `simple-owner-ask:${pdqAnswer.slug}` },
    ];
    return {
      slug: pdqAnswer.slug,
      headline: pdqAnswer.headline,
      facts: [...pdqAnswer.facts, persistFactFor(input.readiness.operatorId)],
      coachTomorrow: pdqAnswer.coachTomorrow,
      needs: pdqAnswer.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: pdqAnswer.sampleDollars,
      verifiedClose: pdqAnswer.verifiedClose,
    };
  }

  const toastFacts = collectToastFacts(input.uploads);
  const toastKind = routeToastDeskQuestion(input.question);
  const toastAnswer =
    toastKind && (toastFacts.hasToast || toastKind === 'payables')
      ? answerToastDeskQuestion(input.question, toastFacts)
      : null;
  if (toastAnswer) {
    const sourceTags: SourceTag[] = [
      ...toastAnswer.sourceTags,
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag)),
      { tag: toastAnswer.verifiedClose ? 'verified' : 'unverified', source: `simple-owner-ask:${toastAnswer.slug}` },
    ];
    return {
      slug: toastAnswer.slug,
      headline: toastAnswer.headline,
      facts: [...toastAnswer.facts, persistFactFor(input.readiness.operatorId)],
      coachTomorrow: toastAnswer.coachTomorrow,
      needs: toastAnswer.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: toastAnswer.sampleDollars,
      verifiedClose: toastAnswer.verifiedClose,
    };
  }

  const routed = resolveOwnerDeskAsk(input.question, input.tray);
  const slug = routed.ok ? routed.slug : 'unrouted';
  const sample = routed.ok ? getFreeOperatorAnswer(routed.slug) : null;
  const ready = input.readiness.evidence.filter((row) => row.state === 'READY').map((row) => row.short);
  const missing = input.readiness.evidence.filter((row) => row.state === 'NEED').map((row) => row.short);
  const sourceTags: SourceTag[] = [
    ...input.readiness.sourceTags.filter((tag) => !isHiddenParseTag(tag)),
    { tag: 'unverified', source: `simple-owner-ask:${slug}` },
  ];

  const folderReady = (input.readiness.folders ?? []).filter((row) => row.state === 'READY').map((row) => row.label);
  const folderNeed = (input.readiness.folders ?? []).filter((row) => row.state === 'NEED').map((row) => row.label);
  const laborAsk =
    input.tray === 'labor' ||
    /\blabor\b|\broles?\b|\bearly leave\b|\blate leave\b|\bdrift\b|\bschedule\b|\bposted in\b/.test(
      input.question.toLowerCase(),
    );

  const evidenceFact =
    input.uploads.length === 0
      ? `${DAY1_OPEN_ASK} ${DAY1_SUBLINE} Missing stays Missing. Invoice paper when they choose it.`
      : `This seat has ${input.uploads.length} source-tagged upload(s). Ready: ${ready.join(', ') || 'none'}. Still NEED: ${missing.join(', ') || 'none'}.`;

  const filled = filledPlateIds(input.readiness.folders ?? []);
  const hook = day1HookCoach(filled);
  const lastReady = (input.readiness.folders ?? []).filter((row) => row.state === 'READY').at(-1);
  const folderFact =
    filled.size === 0
      ? `Day-1 open: ${DAY1_OPEN_ASK} ${DAY1_SUBLINE}`
      : `Ready: ${folderReady.join(', ')}. Still Missing: ${folderNeed.join(', ') || 'none'}. Next snap: ${hook.ask}`;

  const laborFact = laborAsk
    ? 'Labor cards name roles (FOH, Line, Dish, Run). Daily compare to the clock flags early leave, late leave, and labor drift. Punch ≠ schedule. No invented overtime.'
    : 'This desk answers FOH, BOH, schedule, vendor, or merchant. It does not invent a close.';

  const persistFact = `Question and answer are stored for operator_id ${input.readiness.operatorId}. Files go to object storage with the same seat key.`;
  const vendorFact = looksLikeDay1VendorAsk(input.question) ? vendorBabysitLine({ question: input.question }) : null;

  const facts = [
    evidenceFact,
    folderFact,
    persistFact,
    sample?.facts[0] ?? laborFact,
    laborAsk ? laborFact : 'No dollar is verified from an upload or a typed guess. Missing Evidence stays open.',
    ...(vendorFact ? [vendorFact] : []),
  ];

  return {
    slug,
    headline:
      lastReady && filled.size > 0
        ? firstPhotoWinLine(lastReady.id)
        : (sample?.headline ?? 'Ask is stored. I will not invent a close from an empty seat.'),
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
