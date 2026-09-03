import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertNoEmbeddedSecrets } from './youtubeDeskSwarm';
import {
  YOUTUBE_DESK_SLATE_DOC,
  YOUTUBE_DESK_SLATE_PATH,
  YOUTUBE_DESK_TASK_ID,
  assertSlateUsesPublishedAnswers,
  expectedAuditUrl,
  getYoutubeDeskSlate,
  listSlateVideos,
  youtubeSlateSummary,
} from './youtubeDeskSlate';

const REPO_ROOT = path.resolve(__dirname, '../..');

describe('youtube desk first weekly slate', () => {
  it('holds exactly three draft-only videos from published /answers', () => {
    const slate = getYoutubeDeskSlate();
    expect(slate.taskId).toBe(YOUTUBE_DESK_TASK_ID);
    expect(listSlateVideos()).toHaveLength(3);
    expect(slate.videos.map((video) => video.n)).toEqual([1, 2, 3]);
    expect(slate.videos.every((video) => video.approve === 'N')).toBe(true);
    expect(slate.videos.every((video) => video.pinnedComment === 'AUDIT')).toBe(true);
    expect(assertSlateUsesPublishedAnswers()).toEqual([]);
    expect(slate.privateFileDoor).toBe('owner-1');
    expect(slate.publishGate.autoUploadYoutube).toBe(false);
    expect(slate.publishGate.mode).toBe('drafts-only');
  });

  it('keeps Hunt honest when the 72h window has zero verified keeps', () => {
    const slate = getYoutubeDeskSlate();
    expect(slate.huntWindow.hours).toBe(72);
    expect(slate.huntWindow.verifiedKeeps).toBe(0);
    expect(slate.drops.length).toBeGreaterThan(0);
    const hunt = slate.videos[0];
    expect(hunt.kind).toBe('hunt-informed-short');
    expect(hunt.sourceUrl).toContain('/answers/calculate-true-third-party-delivery-cost');
    expect(hunt.durationSeconds).toBeGreaterThanOrEqual(30);
    expect(hunt.durationSeconds).toBeLessThanOrEqual(45);
  });

  it('wires Script Cutter and Answer Film to one published page each', () => {
    const [, cutter, film] = listSlateVideos();
    expect(cutter.sourceUrl).toBe('https://www.never86.ai/answers/audit-doordash-fees-without-portal-login');
    expect(cutter.durationSeconds).toBeGreaterThanOrEqual(30);
    expect(cutter.durationSeconds).toBeLessThanOrEqual(45);
    expect(film.sourceUrl).toBe('https://www.never86.ai/answers/what-never86d-does');
    expect(film.onePageRule).toBe(true);
    expect(film.format).toBe('talking-head');
  });

  it('matches organic YouTube UTM URLs and commits no secrets', () => {
    const raw = readFileSync(path.join(REPO_ROOT, YOUTUBE_DESK_SLATE_PATH), 'utf8');
    expect(assertNoEmbeddedSecrets(JSON.parse(raw))).toEqual([]);
    expect(existsSync(path.join(REPO_ROOT, YOUTUBE_DESK_SLATE_DOC))).toBe(true);
    for (const video of listSlateVideos()) {
      expect(video.auditUrl).toBe(expectedAuditUrl(video.utmContent));
    }
    const summary = youtubeSlateSummary();
    expect(summary.draftsOnly).toBe(true);
    expect(summary.autoUploadYoutube).toBe(false);
    expect(summary.verifiedHuntKeeps).toBe(0);
    expect(summary.nextOwner.toLowerCase()).toContain('myke');
  });
});
