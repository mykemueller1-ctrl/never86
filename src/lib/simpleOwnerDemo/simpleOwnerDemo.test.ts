import { afterEach, describe, expect, it } from 'vitest';
import { findFreeOperatorPrivacyHits } from '@/lib/freeOperatorDemo';
import { buildObjectKey, classifyUpload } from './classify';
import { composeAskAnswer, readinessFromUploads } from './compose';
import { createMemoryObjectStore, signR2Put } from './objectStore';
import { createMemoryRepository } from './repository';
import { createSimpleOwnerDemoService } from './service';
import { signDemoTenant, verifyDemoTenant } from './tenant';

function service() {
  const repo = createMemoryRepository();
  const objects = createMemoryObjectStore();
  return {
    repo,
    objects,
    svc: createSimpleOwnerDemoService({ repo, objects, now: () => new Date('2026-09-04T12:00:00.000Z') }),
  };
}

describe('simple owner demo classify + object keys', () => {
  it('tags hourly, timeclock, and schedule uploads as unverified source-tagged evidence', () => {
    expect(classifyUpload('Hourly_Sales_Report.pdf').kind).toBe('hourly');
    expect(classifyUpload('time-clock.csv').kind).toBe('timeclock');
    expect(classifyUpload('weekly-schedule.xlsx').kind).toBe('schedule');
    expect(classifyUpload('ZReport_Summary.pdf').kind).toBe('z');
    expect(classifyUpload('mystery.bin').kind).toBe('other');
    expect(classifyUpload('Hourly_Sales_Report.pdf').sourceTags[0]).toEqual({
      tag: 'unverified',
      source: 'operator-upload:hourly',
    });
  });

  it('scopes object keys by operator_id', () => {
    const key = buildObjectKey('demo:seat-one', 'Hourly Sales.csv', new Date('2026-09-04T00:00:00Z'));
    expect(key).toMatch(/^simple-owner\/demo:seat-one\/2026\/09\//);
    expect(key).toMatch(/Hourly-Sales\.csv$/);
  });
});

describe('simple owner demo readiness', () => {
  it('starts NEED and flips READY only when that evidence kind is stored', () => {
    const empty = readinessFromUploads('demo:a', []);
    expect(empty.readyCount).toBe(0);
    expect(empty.evidence.every((row) => row.state === 'NEED')).toBe(true);

    const hourly = readinessFromUploads('demo:a', [
      {
        id: 'u1',
        operatorId: 'demo:a',
        filename: 'Hourly_Sales_Report.pdf',
        contentType: 'application/pdf',
        byteLength: 12,
        evidenceKind: 'hourly',
        sourceTags: [{ tag: 'unverified', source: 'operator-upload:hourly' }],
        objectKey: 'simple-owner/demo:a/x',
        storageBackend: 'memory',
        createdAt: '2026-09-04T12:00:00.000Z',
      },
    ]);
    expect(hourly.readyCount).toBe(1);
    expect(hourly.evidence.find((row) => row.id === 'hourly')?.state).toBe('READY');
    expect(hourly.evidence.find((row) => row.id === 'schedule')?.state).toBe('NEED');
  });
});

describe('simple owner demo service persist', () => {
  it('stores an upload in the object store and D1-equivalent repo scoped by operator_id', async () => {
    const { svc, repo, objects } = service();
    const result = await svc.upload({
      operatorId: 'demo:alpha',
      filename: 'Hourly_Sales_Report.pdf',
      contentType: 'application/pdf',
      bytes: new TextEncoder().encode('%PDF-hourly'),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.upload.operatorId).toBe('demo:alpha');
    expect(result.upload.storageBackend).toBe('memory');
    expect(result.upload.sourceTags[0]?.source).toBe('operator-upload:hourly');
    expect(objects.objects.has(result.upload.objectKey)).toBe(true);
    expect(repo.uploads).toHaveLength(1);
    expect(result.readiness.readyCount).toBe(1);
    expect(result.readiness.evidence.find((row) => row.id === 'hourly')?.state).toBe('READY');
  });

  it('does not leak uploads across operator_id values', async () => {
    const { svc } = service();
    await svc.upload({
      operatorId: 'demo:alpha',
      filename: 'time-clock.csv',
      contentType: 'text/csv',
      bytes: new TextEncoder().encode('punch'),
    });
    const other = await svc.readiness('demo:beta');
    expect(other.uploadCount).toBe(0);
    expect(other.readyCount).toBe(0);
  });

  it('persists a real ask instead of returning a hardcoded local string', async () => {
    const { svc, repo } = service();
    await svc.upload({
      operatorId: 'demo:alpha',
      filename: 'weekly-schedule.pdf',
      contentType: 'application/pdf',
      bytes: new TextEncoder().encode('sched'),
    });
    const asked = await svc.ask({
      operatorId: 'demo:alpha',
      question: 'Why did labor feel wrong last night?',
      tray: 'labor',
      mouth: 'type',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.inventedClose).toBe(false);
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.facts.some((fact) => fact.includes('demo:alpha'))).toBe(true);
    expect(asked.answer.facts.join(' ')).toMatch(/Ready: Schedule/);
    expect(asked.record.question).toBe('Why did labor feel wrong last night?');
    expect(repo.asks).toHaveLength(1);
    expect(asked.readiness.askCount).toBe(1);
    expect(findFreeOperatorPrivacyHits(asked.answer)).toEqual([]);
  });

  it('refuses empty asks, oversized files, and private payloads', async () => {
    const { svc, repo } = service();
    const empty = await svc.ask({ operatorId: 'demo:alpha', question: '   ' });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.code).toBe('empty_ask');

    const privateAsk = await svc.ask({ operatorId: 'demo:alpha', question: 'What is Kenzy PIN 1234?' });
    expect(privateAsk.ok).toBe(false);
    if (!privateAsk.ok) expect(privateAsk.code).toBe('privacy_blocked');
    expect(repo.asks).toHaveLength(0);

    const huge = await svc.upload({
      operatorId: 'demo:alpha',
      filename: 'Hourly_Sales_Report.pdf',
      contentType: 'application/pdf',
      bytes: new Uint8Array(8 * 1024 * 1024 + 1),
    });
    expect(huge.ok).toBe(false);
    if (!huge.ok) expect(huge.code).toBe('too_large');
  });
});

describe('simple owner demo tenant cookie', () => {
  it('signs and verifies a demo operator_id and rejects a seat spoof', async () => {
    const now = 1_700_000_000_000;
    const token = await signDemoTenant('demo:abc', now);
    expect(token).toBeTypeOf('string');
    expect(await verifyDemoTenant(token!, now)).toBe('demo:abc');
    expect(await verifyDemoTenant(token!, now + 40 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});

describe('R2 put signer', () => {
  it('emits SigV4 headers without embedding the secret', () => {
    const headers = signR2Put({
      config: {
        accountId: 'acct',
        accessKeyId: 'AKIAEXAMPLE',
        secretAccessKey: 'super-secret-do-not-leak',
        bucket: 'never86-demo',
      },
      host: 'acct.r2.cloudflarestorage.com',
      objectKey: 'simple-owner/demo:a/file.pdf',
      bytes: new TextEncoder().encode('pdf'),
      contentType: 'application/pdf',
      now: new Date('2026-09-04T12:00:00.000Z'),
    });
    expect(headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE\//);
    expect(headers.Authorization).not.toContain('super-secret-do-not-leak');
    expect(headers['x-amz-content-sha256']).toHaveLength(64);
    expect(JSON.stringify(headers)).not.toMatch(/super-secret/);
  });
});

describe('compose never invents a close', () => {
  it('keeps sample dollars unverified even when all three reports are named', () => {
    const readiness = readinessFromUploads('seat:7', [
      fakeUpload('seat:7', 'schedule', 'schedule.pdf'),
      fakeUpload('seat:7', 'hourly', 'Hourly_Sales_Report.pdf'),
      fakeUpload('seat:7', 'timeclock', 'time-clock.csv'),
    ]);
    const answer = composeAskAnswer({
      question: 'Show me labor percent',
      tray: 'labor',
      readiness,
      uploads: [],
    });
    expect(answer.verifiedClose).toBe(false);
    expect(answer.sampleDollars).toBe('none-verified');
    expect(answer.inventedClose).toBe(false);
    expect(answer.headline.toLowerCase()).not.toMatch(/%\s*\d/);
  });
});

function fakeUpload(
  operatorId: string,
  evidenceKind: 'schedule' | 'hourly' | 'timeclock',
  filename: string,
) {
  return {
    id: filename,
    operatorId,
    filename,
    contentType: 'application/pdf',
    byteLength: 4,
    evidenceKind,
    sourceTags: [{ tag: 'unverified' as const, source: `operator-upload:${evidenceKind}` }],
    objectKey: `simple-owner/${operatorId}/${filename}`,
    storageBackend: 'memory' as const,
    createdAt: '2026-09-04T12:00:00.000Z',
  };
}

afterEach(() => {
  delete process.env.SIMPLE_OWNER_DEMO_SECRET;
});
