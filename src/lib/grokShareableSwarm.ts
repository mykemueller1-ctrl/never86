import catalogJson from '../../config/grok-shareable-swarm.json';

export const GROK_SHAREABLE_SWARM_PATH = 'config/grok-shareable-swarm.json';

export const HARNESS_STATES = [
  'drafted',
  'staged',
  'tested',
  'committed',
  'pushed',
  'merged',
  'deployed',
  'live-verified',
  'needs-human-click',
] as const;

export type HarnessState = (typeof HARNESS_STATES)[number];

export type ShareableBot = {
  id: string;
  name: string;
  creator: string;
  description: string;
  shareUrl: string;
  detailUrl: string;
  matchTags: string[];
  never86Lane: string;
  mapsToRole: string;
  whyUseful: string;
  harnessStatus: HarnessState;
};

export type SwarmSeat = {
  seatId: string;
  title: string;
  borrowedFrom: string[];
  mapsToRole: string;
  queue: string;
  allowedTools: string[];
  stopCondition: string;
  harnessStatus: HarnessState;
};

export type SwarmConnector = {
  id: string;
  surface: string;
  url: string;
  auth: string;
  secretEnv: string[] | null;
  setup: string;
  status: HarnessState;
};

export type FirstPartySeat = {
  id: string;
  name: string;
  templatePath: string;
  mapsToRole: string;
  harnessStatus: HarnessState;
};

export type YoutubeDeskPointer = {
  taskId: string;
  config: string;
  status: HarnessState;
  installPublicBotdirectoryBots: false;
};

export type GrokShareableSwarm = {
  taskId: string;
  researchedAt: string;
  status: HarnessState;
  owner: string;
  nextOwner: string;
  eightySixMatches: {
    found: boolean;
    nameOrDescriptionHits: number;
    note: string;
    falsePositives: string[];
  };
  catalogCounts: Record<string, number>;
  sources: { id: string; url: string; kind: string }[];
  recommended: ShareableBot[];
  firstParty?: FirstPartySeat[];
  youtubeDesk?: YoutubeDeskPointer;
  team: SwarmSeat[];
  connectors: SwarmConnector[];
  workflows: {
    id: string;
    title: string;
    schedule: string;
    ownerSeat: string;
    promptRef: string;
    status: HarnessState;
  }[];
};

const SECRET_LIKE =
  /(sk-ant-[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9]{16,}|xai-[A-Za-z0-9]{16,}|re_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|postgres:\/\/[^:\s]+:[^@\s]+@|mongodb(\+srv)?:\/\/[^:\s]+:[^@\s]+@|BEGIN (RSA |OPENSSH )?PRIVATE KEY)/;

export function getGrokShareableSwarm(): GrokShareableSwarm {
  return catalogJson as GrokShareableSwarm;
}

export function listRecommendedBots(): ShareableBot[] {
  return getGrokShareableSwarm().recommended;
}

export function findEightySixMatches(): GrokShareableSwarm['eightySixMatches'] {
  return getGrokShareableSwarm().eightySixMatches;
}

export function listSwarmTeam(): SwarmSeat[] {
  return getGrokShareableSwarm().team;
}

export function listSwarmConnectors(): SwarmConnector[] {
  return getGrokShareableSwarm().connectors;
}

export function botsMatching(tag: string): ShareableBot[] {
  const needle = tag.toLowerCase();
  return listRecommendedBots().filter((bot) =>
    bot.matchTags.some((item) => item.toLowerCase() === needle),
  );
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

export function harnessSummary(): {
  taskId: string;
  researchedAt: string;
  recommendedCount: number;
  teamSeats: number;
  eightySixBotsFound: boolean;
  swarmOrTeamOrApiBots: number;
  connectorStatuses: Record<string, HarnessState>;
  overallStatus: HarnessState;
  nextOwner: string;
} {
  const pack = getGrokShareableSwarm();
  const swarmOrTeamOrApiBots = pack.recommended.filter((bot) =>
    bot.matchTags.some((tag) => ['swarm', 'team', 'api', 'orchestrator', 'cursor'].includes(tag)),
  ).length;
  return {
    taskId: pack.taskId,
    researchedAt: pack.researchedAt,
    recommendedCount: pack.recommended.length,
    teamSeats: pack.team.length,
    eightySixBotsFound: pack.eightySixMatches.found,
    swarmOrTeamOrApiBots,
    connectorStatuses: Object.fromEntries(pack.connectors.map((item) => [item.id, item.status])),
    overallStatus: pack.status,
    nextOwner: pack.nextOwner,
  };
}
