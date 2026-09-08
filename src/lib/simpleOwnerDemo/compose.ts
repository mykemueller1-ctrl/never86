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
  looksLikeDay1BartenderAsk,
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
import {
  ctapSeatHasToastContaminant,
  isCtapSeat1Id,
  toastMayAnswerSeat,
} from '@/lib/ctapPosLock';
import { CTAP_TOAST_CONTAMINANT_SOURCE } from '@/lib/reportAdapters/sourceTags';
import { restaurantNameHintFromOperatorId } from '@/lib/seatIsolation';
import {
  answerLastWeekPrime,
  answerWeekSalesLoop,
  collectLastWeekPrime,
  routeLastWeekPrimeQuestion,
  routeWeekSalesQuestion,
} from '@/lib/lastWeekPrimeCost';
import { OPERATOR_PERSIST_FACT } from '@/lib/ownerDeskPapers';
import { answerVendorSpineQuestion } from '@/lib/ctapVendorSpine';
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
  restaurantName?: string | null,
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
    lastWeekPrime: collectLastWeekPrime(
      operatorId,
      uploads,
      restaurantName ?? restaurantNameHintFromOperatorId(operatorId),
    ),
  };
}

function persistFactFor(_operatorId?: string): string {
  return OPERATOR_PERSIST_FACT;
}

function isHiddenParseTag(tag: SourceTag, hideToastCopy = false): boolean {
  return (
    isToastParseDisplayTag(tag)
    || isPdqParseDisplayTag(tag)
    || tag.source.startsWith('hyvee-parse:v1:')
    || tag.source === CTAP_TOAST_CONTAMINANT_SOURCE
    || /toast-contaminant/i.test(tag.source)
    || (hideToastCopy && /toast/i.test(`${tag.tag}:${tag.source}`))
  );
}

function contaminantLockTag(uploads: readonly SimpleOwnerUploadRecord[]): SourceTag | null {
  if (!ctapSeatHasToastContaminant(uploads)) return null;
  return { tag: 'unverified', source: CTAP_TOAST_CONTAMINANT_SOURCE };
}

export function composeAskAnswer(input: {
  question: string;
  tray: OwnerDeskTrayId;
  readiness: SimpleOwnerReadiness;
  uploads: readonly SimpleOwnerUploadRecord[];
  now?: Date;
  restaurantName?: string | null;
}): SimpleOwnerAskAnswer {
  const qLower = input.question.toLowerCase();
  const restaurantName =
    input.restaurantName ?? restaurantNameHintFromOperatorId(input.readiness.operatorId);
  const onCtapSeat1 = isCtapSeat1Id(input.readiness.operatorId, restaurantName);
  const nagToastOk = toastMayAnswerSeat(input.readiness.operatorId, restaurantName);
  const clearlyHyvee = /hy[\s-]*vee|winespirits|wine & spirits|yellow slip|customer charge|monday batch|monday check|one check/.test(
    qLower,
  );
  const clearlyPdq = /pdq|z ?report|large pizza|void_promo|void promo|hourly_sales|spec instruction|neg menu|menu category|uknown|food today|net sales yesterday|yesterday(?:'s)? (?:net )?sales/.test(
    qLower,
  );

  if (routeWeekSalesQuestion(input.question)) {
    const snapshot = collectLastWeekPrime(
      input.readiness.operatorId,
      input.uploads,
      restaurantName,
    );
    const sales = answerWeekSalesLoop(snapshot);
    const lock = onCtapSeat1 ? contaminantLockTag(input.uploads) : null;
    const sourceTags: SourceTag[] = [
      ...sales.sourceTags,
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)),
      ...(lock ? [lock] : []),
      { tag: sales.verifiedClose ? 'verified' : 'unverified', source: `simple-owner-ask:${sales.slug}` },
    ];
    return {
      slug: sales.slug,
      headline: sales.headline,
      facts: [...sales.facts, persistFactFor()],
      coachTomorrow: sales.coachTomorrow,
      needs: sales.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: sales.sampleDollars,
      verifiedClose: sales.verifiedClose,
    };
  }

  if (routeLastWeekPrimeQuestion(input.question)) {
    const snapshot = collectLastWeekPrime(
      input.readiness.operatorId,
      input.uploads,
      restaurantName,
    );
    const prime = answerLastWeekPrime(snapshot);
    const lock = onCtapSeat1 ? contaminantLockTag(input.uploads) : null;
    const sourceTags: SourceTag[] = [
      ...prime.sourceTags,
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)),
      ...(lock ? [lock] : []),
      { tag: prime.verifiedClose ? 'verified' : 'unverified', source: `simple-owner-ask:${prime.slug}` },
    ];
    return {
      slug: prime.slug,
      headline: prime.headline,
      facts: [...prime.facts, persistFactFor(input.readiness.operatorId)],
      coachTomorrow: prime.coachTomorrow,
      needs: prime.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: prime.sampleDollars,
      verifiedClose: prime.verifiedClose,
    };
  }

  const toastFacts = nagToastOk ? collectToastFacts(input.uploads) : null;
  const toastKind = toastFacts ? routeToastDeskQuestion(input.question) : null;
  const toastAnswer =
    toastFacts && toastKind && (toastFacts.hasToast || toastKind === 'payables' || toastFacts.packs.length > 0)
      ? answerToastDeskQuestion(input.question, toastFacts)
      : null;
  if (toastAnswer) {
    const sourceTags: SourceTag[] = [
      ...toastAnswer.sourceTags,
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)),
      { tag: toastAnswer.verifiedClose ? 'verified' : 'unverified', source: `simple-owner-ask:${toastAnswer.slug}` },
    ];
    return {
      slug: toastAnswer.slug,
      headline: toastAnswer.headline,
      facts: [...toastAnswer.facts, persistFactFor(input.readiness.operatorId)],
      coachTomorrow: toastAnswer.coachTomorrow,
      needs: toastAnswer.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: toastAnswer.sampleDollars,
      verifiedClose: toastAnswer.verifiedClose,
    };
  }

  // Wave 0: PDQ mornings on CTAP. NAG Toast already returned above.
  const pdqFacts = collectPdqFacts(input.uploads);
  const pdqKind = routePdqDeskQuestion(input.question);
  const takePdqMorning = Boolean(pdqKind) && (pdqFacts.hasPdq || clearlyPdq || onCtapSeat1)
    && (!clearlyHyvee || clearlyPdq);
  const pdqAnswer = takePdqMorning ? answerPdqDeskQuestion(input.question, pdqFacts, input.now ?? new Date()) : null;
  if (pdqAnswer) {
    const lock = onCtapSeat1 ? contaminantLockTag(input.uploads) : null;
    const sourceTags: SourceTag[] = [
      ...pdqAnswer.sourceTags,
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)),
      ...(lock ? [lock] : []),
      { tag: pdqAnswer.verifiedClose ? 'verified' : 'unverified', source: `simple-owner-ask:${pdqAnswer.slug}` },
    ];
    return {
      slug: pdqAnswer.slug,
      headline: pdqAnswer.headline,
      facts: [
        ...pdqAnswer.facts.filter((line) => !/toast|taco\s*bamb|new american grill|max grill/i.test(line)),
        persistFactFor(input.readiness.operatorId),
      ],
      coachTomorrow: pdqAnswer.coachTomorrow,
      needs: pdqAnswer.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: pdqAnswer.sampleDollars,
      verifiedClose: pdqAnswer.verifiedClose,
    };
  }

  const hyveeFacts = collectHyveeFacts(input.uploads);
  const hyveeKind = routeHyveeDeskQuestion(input.question);
  const hyveeAnswer =
    hyveeKind && (hyveeFacts.hasHyvee || clearlyHyvee)
      ? answerHyveeDeskQuestion(input.question, hyveeFacts)
      : null;
  if (hyveeAnswer) {
    const lock = onCtapSeat1 ? contaminantLockTag(input.uploads) : null;
    const sourceTags: SourceTag[] = [
      ...hyveeAnswer.sourceTags,
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)),
      ...(lock ? [lock] : []),
      { tag: hyveeAnswer.verifiedClose ? 'verified' : 'unverified', source: `simple-owner-ask:${hyveeAnswer.slug}` },
    ];
    return {
      slug: hyveeAnswer.slug,
      headline: hyveeAnswer.headline,
      facts: [...hyveeAnswer.facts, persistFactFor(input.readiness.operatorId)],
      coachTomorrow: hyveeAnswer.coachTomorrow,
      needs: hyveeAnswer.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: hyveeAnswer.sampleDollars,
      verifiedClose: hyveeAnswer.verifiedClose,
    };
  }

  const vendorSpine = answerVendorSpineQuestion(input.question);
  if (vendorSpine) {
    const lock = onCtapSeat1 ? contaminantLockTag(input.uploads) : null;
    const sourceTags: SourceTag[] = [
      { tag: 'unverified', source: `vendor-spine:${vendorSpine.vendorId}:hook` },
      ...input.uploads.flatMap((row) => row.sourceTags).filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)),
      ...(lock ? [lock] : []),
      { tag: 'unverified', source: `simple-owner-ask:${vendorSpine.slug}` },
    ];
    return {
      slug: vendorSpine.slug,
      headline: vendorSpine.headline,
      facts: [...vendorSpine.facts, persistFactFor(input.readiness.operatorId)],
      coachTomorrow: vendorSpine.coachTomorrow,
      needs: vendorSpine.needs,
      tags: sourceTags.filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)).map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: vendorSpine.sampleDollars,
      verifiedClose: vendorSpine.verifiedClose,
    };
  }

  const routed = resolveOwnerDeskAsk(input.question, input.tray);
  const slug = routed.ok ? routed.slug : 'unrouted';
  const sample = routed.ok ? getFreeOperatorAnswer(routed.slug) : null;
  const ready = input.readiness.evidence.filter((row) => row.state === 'READY').map((row) => row.short);
  const missing = input.readiness.evidence.filter((row) => row.state === 'NEED').map((row) => row.short);
  const lock = onCtapSeat1 ? contaminantLockTag(input.uploads) : null;
  const sourceTags: SourceTag[] = [
    ...input.readiness.sourceTags.filter((tag) => !isHiddenParseTag(tag, onCtapSeat1)),
    ...(lock ? [lock] : []),
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
    : 'This seat answers FOH, BOH, schedule, vendor, or merchant. It does not invent a close.';

  if (looksLikeDay1BartenderAsk(input.question) && /bartender|drawer/.test(qLower)) {
    return {
      slug: 'unrouted',
      headline: 'Missing — drawer / Z for that bartender seat.',
      facts: [
        'I will not name a thief. Missing paper stays Missing.',
        'Action Shift: snap the Z and the drawer tape for that night.',
        persistFactFor(),
      ],
      coachTomorrow: 'Add the Z and drawer tape. Then we rank one move.',
      needs: 'One night Z + drawer tape. No names as thieves.',
      tags: sourceTags.map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: 'none-verified',
      verifiedClose: false,
    };
  }

  if (/30\s*-?\s*60\s*-?\s*90|behind on the books|p&l surprise|p&l/.test(qLower)) {
    return {
      slug: routed.ok ? routed.slug : 'unrouted',
      headline: 'Missing — 30/60/90 or P&L paper.',
      facts: [
        'No AP aging or P&L is on this seat. I will not invent a balance.',
        'Action Shift: connect Gmail or add the aging / P&L file.',
        persistFactFor(),
      ],
      coachTomorrow: 'Add the aging or P&L. I will rank one move after that paper lands.',
      needs: 'One 30/60/90 aging or last P&L. Not a typed guess.',
      tags: sourceTags.map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: 'none-verified',
      verifiedClose: false,
    };
  }

  if (/too many hats|off your plate tonight/.test(qLower)) {
    return {
      slug: 'unrouted',
      headline: 'One thing off the plate tonight.',
      facts: [
        'Action Shift: last-week sales file or one invoice photo. Never86 can go get papers if Gmail is connected.',
        persistFactFor(),
      ],
      coachTomorrow: 'Pick one paper — week sales or a truck ticket. I will confirm it landed.',
      needs: 'One last-week sales file or one invoice photo.',
      tags: sourceTags.map((tag) => `${tag.tag}:${tag.source}`),
      sourceTags,
      inventedClose: false,
      sampleDollars: 'none-verified',
      verifiedClose: false,
    };
  }

  const persistFact = persistFactFor();
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
