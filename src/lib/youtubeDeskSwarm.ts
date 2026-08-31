import catalogJson from '../../config/youtube-desk-swarm.json';
import { HARNESS_STATES, type HarnessState } from './grokShareableSwarm';

export const YOUTUBE_DESK_SWARM_PATH = 'config/youtube-desk-swarm.json';
export const YOUTUBE_DESK_TASK_ID = 'youtube-desk-swarm-v1';
export const YOUTUBE_XAI_MODEL_DEFAULT = 'grok-4.6';
export const YOUTUBE_XAI_BASE = 'https://api.x.ai/v1';

export const YOUTUBE_SEAT_IDS = [
  'n86-youtube-hunt',
  'n86-youtube-script-cutter',
  'n86-youtube-answer-film',
  'n86-youtube-channel-producer',
] as const;

export type YoutubeSeatId = (typeof YOUTUBE_SEAT_IDS)[number];

export type YoutubeIcpRow = {
  signal: string;
  points: number;
};

export type YoutubeDeskSeat = {
  seatId: YoutubeSeatId | 'owner-1' | string;
  title: string;
  mapsToRole?: string;
  kind?: 'first-party';
  borrowedFrom: string[];
  templatePath?: string;
  queue: string;
  allowedTools?: string[];
  sources?: string[];
  stopCondition: string;
  publishAllowed: boolean;
  harnessStatus: HarnessState;
  durationSeconds?: { min: number; max: number };
  format?: string;
  onePageRule?: boolean;
  weeklySlateSize?: number;
  captionRequired?: boolean;
  pinnedComment?: string;
  utmRequired?: boolean;
};

export type YoutubePublishGate = {
  mode: 'drafts-only';
  autoUploadYoutube: false;
  autoPost: false;
  autoInstallPublicBots: false;
  approver: string;
  requiredApproval: string;
  stopCondition: string;
};

export type YoutubeDeskSwarm = {
  taskId: string;
  researchedAt: string;
  status: HarnessState;
  owner: string;
  nextOwner: string;
  desk: 'youtube';
  reportsTo: string;
  installPublicBotdirectoryBots: false;
  xai: {
    secretEnv: string[];
    baseUrl: string;
    modelDefault: string;
    modelEnv: string;
    note: string;
  };
  privateFileDoor: {
    seatId: 'owner-1';
    title: string;
    holder: string;
    rule: string;
    youtubeSeatsMayOpenPrivateFiles: false;
  };
  publishGate: YoutubePublishGate;
  icp: {
    windowHours: number;
    keepScore: number;
    maxDraftsPerRun: number;
    rubric: YoutubeIcpRow[];
    drop: string[];
  };
  cta: {
    url: string;
    pinnedComment: string;
    utm: {
      source: string;
      medium: string;
      campaign: string;
      contentPattern: string;
    };
  };
  seats: YoutubeDeskSeat[];
  connectors: {
    id: string;
    surface: string;
    url: string;
    auth: string;
    secretEnv: string[] | null;
    setup: string;
    status: HarnessState;
    modelDefault?: string;
  }[];
  workflows: {
    id: string;
    title: string;
    schedule: string;
    ownerSeat: string;
    promptRef: string;
    status: HarnessState;
  }[];
  desktopPaste: {
    doc: string;
    recipes: string[];
    rule: string;
  };
};

const SECRET_LIKE =
  /(sk-ant-[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9]{16,}|xai-[A-Za-z0-9]{16,}|re_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|postgres:\/\/[^:\s]+:[^@\s]+@|mongodb(\+srv)?:\/\/[^:\s]+:[^@\s]+@|BEGIN (RSA |OPENSSH )?PRIVATE KEY)/;

export function getYoutubeDeskSwarm(): YoutubeDeskSwarm {
  return catalogJson as YoutubeDeskSwarm;
}

export function listYoutubeSeats(): YoutubeDeskSeat[] {
  return getYoutubeDeskSwarm().seats;
}

export function getYoutubePublishGate(): YoutubePublishGate {
  return getYoutubeDeskSwarm().publishGate;
}

export function getPrivateFileDoor() {
  return getYoutubeDeskSwarm().privateFileDoor;
}

export function assertNoEmbeddedSecrets(value: unknown, path = 'root'): string[] {
  const leaks: string[] = [];
  if (typeof value === 'string') {
    if (SECRET_LIKE.test(value)) leaks.push(path);
    return leaks;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      leaks.push(...assertNoEmbeddedSecrets(item, `${path}[${index}]`));
    });
    return leaks;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      leaks.push(...assertNoEmbeddedSecrets(child, `${path}.${key}`));
    }
  }
  return leaks;
}

export function youtubeDeskSummary(): {
  taskId: string;
  seatCount: number;
  seatIds: string[];
  draftsOnly: boolean;
  autoUploadYoutube: boolean;
  installPublicBots: boolean;
  owner1IsPrivateFileDoor: boolean;
  xaiSecretEnv: string[];
  modelDefault: string;
  overallStatus: HarnessState;
  nextOwner: string;
} {
  const pack = getYoutubeDeskSwarm();
  return {
    taskId: pack.taskId,
    seatCount: pack.seats.length,
    seatIds: pack.seats.map((seat) => seat.seatId),
    draftsOnly: pack.publishGate.mode === 'drafts-only' && pack.seats.every((seat) => seat.publishAllowed === false),
    autoUploadYoutube: pack.publishGate.autoUploadYoutube,
    installPublicBots: pack.installPublicBotdirectoryBots,
    owner1IsPrivateFileDoor: pack.privateFileDoor.seatId === 'owner-1' && pack.privateFileDoor.youtubeSeatsMayOpenPrivateFiles === false,
    xaiSecretEnv: pack.xai.secretEnv,
    modelDefault: pack.xai.modelDefault,
    overallStatus: pack.status,
    nextOwner: pack.nextOwner,
  };
}

export function isHarnessState(value: string): value is HarnessState {
  return (HARNESS_STATES as readonly string[]).includes(value);
}
