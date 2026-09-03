import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRoleById } from './companyOrg';
import { HARNESS_STATES, getGrokShareableSwarm } from './grokShareableSwarm';
import { XAI_API_KEY_NAME, XAI_MODEL_DEFAULT, xaiModel } from './keysAccess';
import {
  YOUTUBE_DESK_SWARM_PATH,
  YOUTUBE_DESK_TASK_ID,
  YOUTUBE_SEAT_IDS,
  YOUTUBE_XAI_BASE,
  YOUTUBE_XAI_MODEL_DEFAULT,
  assertNoEmbeddedSecrets,
  getPrivateFileDoor,
  getYoutubeDeskSwarm,
  getYoutubePublishGate,
  listYoutubeSeats,
  youtubeDeskSummary,
} from './youtubeDeskSwarm';

const REPO_ROOT = path.resolve(__dirname, '../..');

describe('youtube desk swarm', () => {
  it('maps four first-party draft-only seats and Owner-1 as the private-file door', () => {
    const pack = getYoutubeDeskSwarm();
    expect(pack.taskId).toBe(YOUTUBE_DESK_TASK_ID);
    expect(listYoutubeSeats().map((seat) => seat.seatId)).toEqual([...YOUTUBE_SEAT_IDS]);
    expect(pack.installPublicBotdirectoryBots).toBe(false);
    expect(pack.seats.every((seat) => seat.kind === 'first-party')).toBe(true);
    expect(pack.seats.every((seat) => seat.borrowedFrom.length === 0)).toBe(true);
    expect(pack.seats.every((seat) => seat.publishAllowed === false)).toBe(true);
    expect(pack.seats.every((seat) => HARNESS_STATES.includes(seat.harnessStatus))).toBe(true);

    const door = getPrivateFileDoor();
    expect(door.seatId).toBe('owner-1');
    expect(door.youtubeSeatsMayOpenPrivateFiles).toBe(false);
    expect(door.rule.toLowerCase()).toContain('owner-1');
  });

  it('keeps a drafts-only publish gate with no auto-upload', () => {
    const gate = getYoutubePublishGate();
    expect(gate.mode).toBe('drafts-only');
    expect(gate.autoUploadYoutube).toBe(false);
    expect(gate.autoPost).toBe(false);
    expect(gate.autoInstallPublicBots).toBe(false);
    expect(gate.approver.toLowerCase()).toBe('myke');
    expect(gate.requiredApproval).toBe('social_post');
  });

  it('scores YouTube Hunt on a 72h ICP window and weekly slate of three', () => {
    const pack = getYoutubeDeskSwarm();
    expect(pack.icp.windowHours).toBe(72);
    expect(pack.icp.keepScore).toBe(60);
    expect(pack.icp.rubric.reduce((sum, row) => sum + row.points, 0)).toBeGreaterThanOrEqual(60);

    const hunt = pack.seats.find((seat) => seat.seatId === 'n86-youtube-hunt');
    const cutter = pack.seats.find((seat) => seat.seatId === 'n86-youtube-script-cutter');
    const film = pack.seats.find((seat) => seat.seatId === 'n86-youtube-answer-film');
    const producer = pack.seats.find((seat) => seat.seatId === 'n86-youtube-channel-producer');

    expect(hunt?.queue.toLowerCase()).toContain('72');
    expect(cutter?.durationSeconds).toEqual({ min: 30, max: 45 });
    expect(film?.onePageRule).toBe(true);
    expect(film?.format).toBe('talking-head');
    expect(producer?.weeklySlateSize).toBe(3);
    expect(producer?.pinnedComment).toBe('AUDIT');
    expect(pack.cta.url).toBe('https://www.never86.ai/audit');
    expect(pack.cta.utm.source).toBe('youtube');
  });

  it('maps every YouTube seat onto a company org social role', () => {
    for (const seat of listYoutubeSeats()) {
      const role = getRoleById(seat.mapsToRole ?? '');
      expect(role, seat.mapsToRole).toBeDefined();
      expect(role?.departmentId).toBe('social');
      expect(role?.reportsTo).toBe('social-head');
      expect(role?.approvalRequired).toContain('social_post');
      expect(role?.prohibited).toEqual(
        expect.arrayContaining(['auto-uploading to YouTube', 'opening private CTAP or customer files']),
      );
    }
  });

  it('keeps xAI as XAI_API_KEY + grok-4.6 on api.x.ai — never embedded secrets', () => {
    const pack = getYoutubeDeskSwarm();
    const raw = readFileSync(path.join(REPO_ROOT, YOUTUBE_DESK_SWARM_PATH), 'utf8');
    expect(assertNoEmbeddedSecrets(JSON.parse(raw))).toEqual([]);
    expect(pack.xai.secretEnv).toEqual([XAI_API_KEY_NAME]);
    expect(pack.xai.baseUrl).toBe(YOUTUBE_XAI_BASE);
    expect(pack.xai.modelDefault).toBe(YOUTUBE_XAI_MODEL_DEFAULT);
    expect(YOUTUBE_XAI_MODEL_DEFAULT).toBe(XAI_MODEL_DEFAULT);
    expect(xaiModel({})).toBe('grok-4.6');
    expect(pack.desktopPaste.recipes).toHaveLength(4);
    expect(pack.desktopPaste.rule.toLowerCase()).toContain('do not add a public');
  });

  it('summarizes without claiming live desk adds or uploads', () => {
    const summary = youtubeDeskSummary();
    expect(summary.taskId).toBe(YOUTUBE_DESK_TASK_ID);
    expect(summary.seatCount).toBe(4);
    expect(summary.draftsOnly).toBe(true);
    expect(summary.autoUploadYoutube).toBe(false);
    expect(summary.installPublicBots).toBe(false);
    expect(summary.owner1IsPrivateFileDoor).toBe(true);
    expect(summary.overallStatus).toBe('drafted');
    expect(summary.nextOwner.toLowerCase()).toContain('myke');
  });

  it('records #179 merged and points at the first drafted slate', () => {
    const pack = getYoutubeDeskSwarm();
    expect(pack.gitState).toBe('merged');
    expect(pack.mergePr).toBe(179);
    expect(pack.mcpOrgLiveVerified).toBe('2.1.0');
    expect(pack.firstSlate?.config).toBe('config/youtube-desk-slate-2026-09-03.json');
    expect(pack.firstSlate?.status).toBe('drafted');
  });

  it('is pointed from the shareable swarm map without borrowing public botdirectory ids', () => {
    const shareable = getGrokShareableSwarm();
    expect(shareable.youtubeDesk?.config).toBe(YOUTUBE_DESK_SWARM_PATH);
    expect(shareable.youtubeDesk?.status).toBe('drafted');
    const firstPartyIds = new Set((shareable.firstParty ?? []).map((item) => item.id));
    for (const id of YOUTUBE_SEAT_IDS) {
      expect(firstPartyIds.has(id), id).toBe(true);
    }
    const recommendedIds = new Set(shareable.recommended.map((bot) => bot.id));
    for (const id of YOUTUBE_SEAT_IDS) {
      expect(recommendedIds.has(id)).toBe(false);
    }
  });
});
