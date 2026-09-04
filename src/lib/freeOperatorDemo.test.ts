import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POST as staffLoginPost } from '../app/api/staff/login/route';
import { BANNED_PHRASES } from './operatorVoice';
import {
  BASE_WHAT_I_KNOW,
  FREE_OPERATOR_ANSWERS,
  FREE_OPERATOR_CHIPS,
  FREE_OPERATOR_MOUTH,
  OWNER_DESK_TRAY,
  OWNER_PRIME_COST_EVIDENCE,
  OWNER_SEAT_EOD,
  PUBLIC_PREVIEW_COPY,
  SAMPLE_LABEL,
  evaluateDemoVendorCadence,
  findFreeOperatorPrivacyHits,
  freeOperatorCorpus,
  getFreeOperatorAnswer,
  nameLocalEvidence,
  resolveFreeOperatorAsk,
  resolveOwnerDeskAsk,
} from './freeOperatorDemo';

const ROOT = join(process.cwd());
const CTAP_STAFF = /karlee|sturtz|ashley|holding|kenzy/i;
const LIVE_Z = /\$1,000\.00|\$1,070\.00|\$12\.00|Late Deliverys/;

describe('free operator demo pack', () => {
  it('keeps the phone mouth and the five chips', () => {
    expect([...FREE_OPERATOR_MOUTH]).toEqual(['talk', 'type', 'photo', 'file']);
    expect(FREE_OPERATOR_CHIPS.map((chip) => chip.label)).toEqual([
      'Front of house',
      'Back of house',
      'Schedule',
      'Vendor',
      'Merchant',
    ]);
  });

  it('keeps WHAT I KNOW cards NEED or READY and never invents a close', () => {
    expect(BASE_WHAT_I_KNOW.every((card) => card.state === 'NEED' || card.state === 'READY')).toBe(true);
    expect(BASE_WHAT_I_KNOW.filter((card) => card.state === 'READY').map((card) => card.id)).toEqual(['mouth']);
    expect(BASE_WHAT_I_KNOW.find((card) => card.id === 'z-close')?.state).toBe('NEED');

    const named = nameLocalEvidence(BASE_WHAT_I_KNOW, 'photo', 'invoice.jpg');
    expect(named.find((card) => card.id === 'z-close')?.state).toBe('NEED');
    expect(named.find((card) => card.id === 'z-close')?.reason).toMatch(/not a verified close/i);
    expect(named.find((card) => card.id === 'mouth')?.state).toBe('READY');
  });

  it('answers chips in headline + facts + coach tomorrow + NEEDS voice', () => {
    for (const chip of FREE_OPERATOR_CHIPS) {
      const fromChip = resolveFreeOperatorAsk('', chip.id);
      expect(fromChip.ok).toBe(true);
      if (!fromChip.ok) continue;
      expect(fromChip.inventedClose).toBe(false);
      const answer = getFreeOperatorAnswer(fromChip.slug);
      expect(answer, chip.id).toBeTruthy();
      expect(answer?.headline.length).toBeGreaterThan(12);
      expect(answer?.facts.length).toBeGreaterThanOrEqual(3);
      expect(answer?.coachTomorrow.length).toBeGreaterThan(12);
      expect(answer?.needs.length).toBeGreaterThan(12);
      expect(answer?.sampleLabel).toBe(SAMPLE_LABEL);
      expect(answer?.sampleDollars).toBe('none-verified');
      expect(answer?.verifiedClose).toBe(false);
    }
  });

  it('routes typed asks and refuses an invented close', () => {
    expect(resolveFreeOperatorAsk('voids on the floor').ok).toBe(true);
    expect(resolveFreeOperatorAsk('invoice and food cost').ok).toBe(true);
    expect(resolveFreeOperatorAsk('schedule hours').ok).toBe(true);
    expect(resolveFreeOperatorAsk('vendor cadence').ok).toBe(true);
    expect(resolveFreeOperatorAsk('merchant account').ok).toBe(true);
    expect(resolveFreeOperatorAsk('card processing').ok).toBe(true);

    const empty = resolveFreeOperatorAsk('   ');
    expect(empty.ok).toBe(false);
    if (!empty.ok) {
      expect(empty.inventedClose).toBe(false);
      expect(empty.needs).toMatch(/Merchant/);
    }

    const other = resolveFreeOperatorAsk('what is the weather');
    expect(other.ok).toBe(false);
    if (!other.ok) expect(other.reason).toMatch(/does not invent a close/i);

    const typedBeatsChip = resolveFreeOperatorAsk('vendor cadence', 'foh');
    expect(typedBeatsChip.ok).toBe(true);
    if (typedBeatsChip.ok) {
      expect(typedBeatsChip.chipId).toBe('vendor');
      expect(typedBeatsChip.slug).toBe('vendor-silence');
    }

    const merchantBeatsFoh = resolveFreeOperatorAsk('merchant account', 'foh');
    expect(merchantBeatsFoh.ok).toBe(true);
    if (merchantBeatsFoh.ok) {
      expect(merchantBeatsFoh.chipId).toBe('merchant');
      expect(merchantBeatsFoh.slug).toBe('merchant-account');
    }
  });

  it('routes Owner desk asks for labor and beer margin without inventing a close', () => {
    const labor = resolveOwnerDeskAsk('Why did labor feel wrong?', 'labor');
    expect(labor.ok).toBe(true);
    if (labor.ok) {
      expect(labor.slug).toBe('schedule-labor');
      expect(labor.inventedClose).toBe(false);
    }

    const beer = resolveOwnerDeskAsk('What happened to beer margin?', 'beer');
    expect(beer.ok).toBe(true);
    if (beer.ok) {
      expect(beer.slug).toBe('vendor-silence');
      expect(beer.inventedClose).toBe(false);
    }

    const emptyAction = resolveOwnerDeskAsk('   ', 'action');
    expect(emptyAction.ok).toBe(false);
    if (!emptyAction.ok) expect(emptyAction.inventedClose).toBe(false);

    const emptyLabor = resolveOwnerDeskAsk('', 'labor');
    expect(emptyLabor.ok).toBe(true);
    if (emptyLabor.ok) expect(emptyLabor.slug).toBe('schedule-labor');
  });

  it('keeps Prime Cost Coach evidence NEED or READY only', () => {
    expect(OWNER_PRIME_COST_EVIDENCE).toHaveLength(3);
    expect(OWNER_PRIME_COST_EVIDENCE.every((row) => row.state === 'NEED' || row.state === 'READY')).toBe(true);
    expect(OWNER_PRIME_COST_EVIDENCE.filter((row) => row.state === 'READY').map((row) => row.id)).toEqual(['schedule']);
    expect(OWNER_DESK_TRAY.map((row) => row.id)).toEqual(['action', 'food', 'labor', 'pop', 'beer', 'liquor']);
  });

  it('labels every sample dollar fictional and never claims verified money', () => {
    const corpus = freeOperatorCorpus();
    expect(corpus).toMatch(/FICTIONAL \/ sample-not-verified/);
    expect(corpus).toMatch(/\$0 verified/);
    for (const answer of FREE_OPERATOR_ANSWERS) {
      const blob = JSON.stringify(answer);
      expect(blob).toContain(SAMPLE_LABEL);
      expect(blob).not.toMatch(LIVE_Z);
      expect(answer.sampleDollars).toBe('none-verified');
    }
  });

  it('keeps vendor silence advisory for 14 days and Missing Evidence without cadence', () => {
    const missing = evaluateDemoVendorCadence({});
    expect(missing.status).toBe('missing-evidence');
    expect(missing.inventsDollars).toBe(false);
    expect(missing.missedTruck).toBe(false);
    expect(missing.message).toMatch(/Missing Evidence/);
    expect(missing.message).toMatch(/not a missed truck/i);
    expect(missing.message).not.toMatch(/is a missed truck/i);

    const advisory = evaluateDemoVendorCadence({ cadenceDays: 7, programAgeDays: 6, quietDays: 9 });
    expect(advisory.status).toBe('advisory');
    expect(advisory.inventsDollars).toBe(false);
    expect(advisory.missedTruck).toBe(false);

    const review = evaluateDemoVendorCadence({ cadenceDays: 7, programAgeDays: 21, quietDays: 9 });
    expect(review.status).toBe('review');
    expect(review.dollarClaim).toBe('none');
  });

  it('keeps Forward-EOD on the owner seat and files on this phone', () => {
    expect(OWNER_SEAT_EOD.surface).toBe('owner-seat');
    expect(OWNER_SEAT_EOD.notThisDemo).toBe(true);
    expect(OWNER_SEAT_EOD.copy).toMatch(/close\+\{seat\}@inbound\.never86\.ai/);
    expect(OWNER_SEAT_EOD.copy).toMatch(/not this public preview/i);
    expect(PUBLIC_PREVIEW_COPY).toMatch(/Preview only/i);
    expect(PUBLIC_PREVIEW_COPY).toMatch(/private restaurant data/i);
    expect(PUBLIC_PREVIEW_COPY).toMatch(/Production V2/i);
  });

  it('keeps CTap staff names, pars, and live Z dollars out of public demo copy', () => {
    const corpus = freeOperatorCorpus();
    expect(findFreeOperatorPrivacyHits(FREE_OPERATOR_ANSWERS)).toEqual([]);
    expect(findFreeOperatorPrivacyHits(BASE_WHAT_I_KNOW)).toEqual([]);
    expect(findFreeOperatorPrivacyHits(OWNER_PRIME_COST_EVIDENCE)).toEqual([]);
    expect(corpus).not.toMatch(CTAP_STAFF);
    expect(corpus).not.toMatch(LIVE_Z);
    expect(corpus).not.toMatch(/\bPIN\b/);
    expect(corpus.toLowerCase()).not.toMatch(/\bpars?\b/);
    expect(corpus.toLowerCase()).not.toMatch(/community tap/);
  });

  it('does not sound like a suite dashboard', () => {
    const corpus = freeOperatorCorpus().toLowerCase();
    expect(corpus).not.toMatch(/dashboard/);
    for (const phrase of ['AI-powered', 'game-changer', 'guaranteed recovery'] as const) {
      expect(corpus).not.toContain(phrase.toLowerCase());
    }
    expect(BANNED_PHRASES).toContain('AI-powered');
  });
});

describe('free operator demo pages stay off Neon and staff login', () => {
  it('does not import the db or DATABASE_URL on the public phone surface', () => {
    const page = readFileSync(join(ROOT, 'src/app/operator/page.tsx'), 'utf8');
    const answer = readFileSync(join(ROOT, 'src/app/operator/answers/[slug]/page.tsx'), 'utf8');
    const ui = readFileSync(join(ROOT, 'src/components/FreeOperatorPhone.tsx'), 'utf8');
    const card = readFileSync(join(ROOT, 'src/components/FreeOperatorAnswerCard.tsx'), 'utf8');
    const lib = readFileSync(join(ROOT, 'src/lib/freeOperatorDemo.ts'), 'utf8');
    for (const blob of [page, answer, ui, card, lib]) {
      expect(blob).not.toMatch(/from ['"]@\/db['"]/);
      expect(blob).not.toMatch(/DATABASE_URL/);
    }
    expect(ui).toContain('FreeOperatorAnswerCard');
    expect(ui).toContain('owner-desk');
    expect(ui).toContain('Prime Cost Coach');
    expect(ui).not.toMatch(/router\.push/);
    expect(ui).toMatch(/goAsk\(ask\)/);
    expect(ui).toMatch(/Demo restaurant/);
    expect(ui).not.toMatch(/Community Tap/);
    expect(answer).toMatch(/robots:\s*\{\s*index:\s*false/);
    expect(card).toContain('Coach this tomorrow');
    expect(card).toContain('Needs');

    const sitemap = readFileSync(join(ROOT, 'src/app/sitemap.ts'), 'utf8');
    const robots = readFileSync(join(ROOT, 'src/lib/seoAeo.ts'), 'utf8');
    expect(sitemap).toContain("`${BASE}/operator`");
    expect(sitemap).not.toMatch(/operator\/answers/);
    expect(robots).toContain("'/operator/answers/'");
  });

  it('leaves staff login fail-closed', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.STAFF_SEAT_LOGIN_ENABLED;
    const res = await staffLoginPost();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.issuance).toBe('blocked');
    expect(body.mailSent).toBe(false);
  });
});
