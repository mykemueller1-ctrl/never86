import slateJson from '../../config/youtube-desk-slate-2026-09-03.json';
import { buildHunterAuditUrl } from './hunterUtm';
import { YOUTUBE_DESK_TASK_ID, type YoutubeSeatId } from './youtubeDeskSwarm';
import type { HarnessState } from './grokShareableSwarm';

export const YOUTUBE_DESK_SLATE_PATH = 'config/youtube-desk-slate-2026-09-03.json';
export const YOUTUBE_DESK_SLATE_DOC = 'docs/company/grok-bots/batches/2026-09-03-youtube-slate.md';

export type YoutubeSlateVideo = {
  n: number;
  seatId: YoutubeSeatId | string;
  kind: string;
  title: string;
  sourceKind: 'published-answers';
  sourceUrl: string;
  durationSeconds?: number;
  format?: string;
  onePageRule?: boolean;
  pinnedComment: 'AUDIT';
  utmContent: string;
  auditUrl: string;
  approve: 'Y' | 'N';
};

export type YoutubeDeskSlate = {
  taskId: string;
  slateId: string;
  weekOf: string;
  status: HarnessState;
  owner: string;
  nextOwner: string;
  publishGate: {
    mode: 'drafts-only';
    autoUploadYoutube: false;
    approver: string;
    requiredApproval: string;
  };
  privateFileDoor: 'owner-1';
  huntWindow: {
    hours: number;
    from: string;
    to: string;
    verifiedKeeps: number;
    note: string;
  };
  drops: { url: string; reason: string }[];
  videos: YoutubeSlateVideo[];
};

export function getYoutubeDeskSlate(): YoutubeDeskSlate {
  return slateJson as YoutubeDeskSlate;
}

export function listSlateVideos(): YoutubeSlateVideo[] {
  return getYoutubeDeskSlate().videos;
}

export function expectedAuditUrl(utmContent: string): string {
  return buildHunterAuditUrl({
    source: 'youtube',
    medium: 'organic',
    contentId: utmContent,
  });
}

export function youtubeSlateSummary() {
  const slate = getYoutubeDeskSlate();
  return {
    taskId: slate.taskId,
    slateId: slate.slateId,
    videoCount: slate.videos.length,
    draftsOnly: slate.publishGate.mode === 'drafts-only' && slate.videos.every((video) => video.approve === 'N'),
    autoUploadYoutube: slate.publishGate.autoUploadYoutube,
    owner1Door: slate.privateFileDoor === 'owner-1',
    verifiedHuntKeeps: slate.huntWindow.verifiedKeeps,
    nextOwner: slate.nextOwner,
    overallStatus: slate.status,
  };
}

export function assertSlateUsesPublishedAnswers(slate: YoutubeDeskSlate = getYoutubeDeskSlate()): string[] {
  return slate.videos
    .filter((video) => !video.sourceUrl.startsWith('https://www.never86.ai/answers/'))
    .map((video) => video.sourceUrl);
}

export { YOUTUBE_DESK_TASK_ID };
