'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/lib/track';
import { FreeOperatorAnswerCard } from '@/components/FreeOperatorAnswerCard';
import {
  OWNER_DESK_TRAY,
  OWNER_PRIME_COST_EVIDENCE,
  PUBLIC_PREVIEW_COPY,
  type FreeOperatorMouth,
  type OwnerDeskTrayId,
  type PrimeCostEvidence,
} from '@/lib/freeOperatorDemo';
import type { SimpleOwnerAskAnswer, SimpleOwnerReadiness } from '@/lib/simpleOwnerDemo/types';
import {
  LAST_WEEK_PRIME_LOAD_ASK,
  emptyLastWeekPrime,
  type LastWeekPrimeFamilyId,
  type LastWeekPrimeSnapshot,
} from '@/lib/lastWeekPrimeCost';
import { deskSeatLabel, deskSeatTitle } from '@/lib/seatIsolation';
import { PapersInboxConnect } from '@/components/PapersInboxConnect';
import {
  folderForLastWeekFamily,
  receivedPapersLine,
  receivingPapersLine,
} from '@/lib/ownerDeskPapers';
import { usd } from '@/lib/toastParse';
import {
  DAY1_FRONT_PICKS,
  DAY1_HELP_ENERGY,
  DAY1_HOOK_PLATE_ID,
  DAY1_IDENTITY_LINE,
  DAY1_INVOICE_PLATE_ID,
  DAY1_MISSING_SPINE,
  DAY1_OPEN_ASK,
  DAY1_PREVIEW_CONTRACT,
  DAY1_SUBLINE,
  day1CoachById,
  day1FrontNeedsPhoto,
  day1HookCoach,
  day1MissingSpineCopy,
  day1MissingSpineState,
  day1StoreTitle,
  firstPhotoWinLine,
  type Day1FrontPick,
  type Day1FrontPickId,
  type Day1MissingSpine,
} from '@/lib/day1Coach';
import {
  OPERATOR_V2_PLATES,
  dailyCompareFromEvidence,
  filledPlateIds,
  projectFoldersFromKinds,
  spawnLaborRoleCards,
  type DailyCompareChip,
  type LaborRoleCard,
  type OperatorV2FolderState,
  type OperatorV2Plate,
  type OperatorV2PlateId,
} from '@/lib/operatorV2';

type DeskView = 'home' | 'labor' | 'food' | 'bev';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function weekdayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
}

function emptyEvidence(): PrimeCostEvidence[] {
  return OWNER_PRIME_COST_EVIDENCE.map((row) => ({
    ...row,
    state: 'NEED',
    reason:
      row.id === 'schedule'
        ? 'Weekly schedule is missing until a schedule file lands for this seat.'
        : row.id === 'hourly'
          ? 'Hourly sales stay Missing Evidence until a POS hourly file lands for this seat.'
          : 'Time clock stays Missing Evidence until punches land for this seat.',
  }));
}

function emptyFolders(): OperatorV2FolderState[] {
  return projectFoldersFromKinds(new Set());
}

function emptyRoleCards(): LaborRoleCard[] {
  return spawnLaborRoleCards({ scheduleReady: false, laborCardsReady: false, clockReady: false });
}

function emptyDailyCompare(): DailyCompareChip[] {
  return dailyCompareFromEvidence({ scheduleReady: false, clockReady: false });
}

export function FreeOperatorPhone({
  initialRestaurantName = null,
  signedIn = false,
}: {
  initialRestaurantName?: string | null;
  signedIn?: boolean;
}) {
  const [ask, setAsk] = useState('');
  const [view, setView] = useState<DeskView>('home');
  const [tray, setTray] = useState<OwnerDeskTrayId>('action');
  const [, setEvidence] = useState<PrimeCostEvidence[]>(emptyEvidence);
  const [folders, setFolders] = useState<OperatorV2FolderState[]>(emptyFolders);
  const [roleCards, setRoleCards] = useState<LaborRoleCard[]>(emptyRoleCards);
  const [dailyCompare, setDailyCompare] = useState<DailyCompareChip[]>(emptyDailyCompare);
  const [lastWeekPrime, setLastWeekPrime] = useState<LastWeekPrimeSnapshot>(emptyLastWeekPrime);
  const [activeFolder, setActiveFolder] = useState<OperatorV2PlateId | null>(null);
  const [frontPath, setFrontPath] = useState<Day1FrontPickId | null>(null);
  const [paperPath, setPaperPath] = useState(false);
  const [storeName, setStoreName] = useState(() => {
    if (initialRestaurantName?.trim()) return deskSeatLabel(initialRestaurantName);
    if (signedIn) return '';
    return day1StoreTitle(null);
  });
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [winLine, setWinLine] = useState<string | null>(null);
  const [answer, setAnswer] = useState<SimpleOwnerAskAnswer | null>(null);
  const [localName, setLocalName] = useState<string | null>(null);
  const [askFocused, setAskFocused] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const filled = useMemo(() => filledPlateIds(folders), [folders]);
  const hook = useMemo(() => day1HookCoach(filled), [filled]);
  const firstScreen = filled.size === 0 && view === 'home' && !winLine;
  const needsPhoto = !firstScreen || paperPath || day1FrontNeedsPhoto(frontPath);
  const hookAsk = firstScreen
    ? DAY1_OPEN_ASK
    : (day1CoachById(activeFolder ?? hook.id)?.ask ?? hook.ask);

  function applyReadiness(next: SimpleOwnerReadiness | undefined) {
    if (!next?.evidence) return;
    setEvidence(next.evidence.map((row) => ({ ...row })));
    if (next.folders) setFolders(next.folders.map((row) => ({ ...row })));
    if (next.laborCards) setRoleCards(next.laborCards.map((row) => ({ ...row })));
    if (next.dailyCompare) setDailyCompare(next.dailyCompare.map((row) => ({ ...row })));
    if (next.lastWeekPrime) setLastWeekPrime(next.lastWeekPrime);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/operator/readiness', { method: 'GET' });
        const body = (await res.json()) as { success?: boolean; readiness?: SimpleOwnerReadiness; error?: string };
        if (cancelled) return;
        if (!res.ok || !body.success) {
          return;
        }
        applyReadiness(body.readiness);
      } catch {
        if (!cancelled) setFlash('Readiness could not load. Try again.');
      }
      try {
        const desk = await fetch('/api/desk', { method: 'GET' });
        const body = (await desk.json()) as { success?: boolean; restaurantName?: string | null };
        if (cancelled) return;
        const named = body.restaurantName?.trim();
        if (desk.ok && body.success && named) setStoreName(deskSeatLabel(named));
      } catch {
        /* signed-in NAG never falls back to Community Tap */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function goAsk(nextAsk: string, mouth: FreeOperatorMouth = 'type') {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: nextAsk, tray, mouth }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        answer?: SimpleOwnerAskAnswer;
        readiness?: SimpleOwnerReadiness;
      };
      if (!res.ok || !body.success || !body.answer) {
        setAnswer(null);
        setFlash(body.error ?? 'Ask did not persist.');
        trackEvent('operator_demo_ask_empty', { pagePath: '/operator', meta: { tray } });
        return;
      }
      setAnswer(body.answer);
      applyReadiness(body.readiness);
      trackEvent('operator_demo_ask', { pagePath: '/operator', meta: { slug: body.answer.slug, tray } });
      queueMicrotask(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      setAnswer(null);
      setFlash('Ask did not reach the seat. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function openPlate(plate: OperatorV2Plate, attach: 'photo' | 'file' | 'ask' = 'photo') {
    const coach = day1CoachById(plate.id);
    setActiveFolder(plate.id);
    setAsk(coach?.ask ?? plate.ask);
    onTray(plate.tray);
    const folder = folders.find((row) => row.id === plate.id);
    const needPhoto = !folder || folder.state === 'NEED';
    trackEvent('operator_v2_plate', { pagePath: '/operator', meta: { plate: plate.id, ocr: needPhoto, attach } });
    if (attach === 'file') {
      fileRef.current?.click();
      return;
    }
    if (attach === 'ask') return;
    photoRef.current?.click();
  }

  function onFrontPick(pick: Day1FrontPick) {
    setFrontPath(pick.id);
    setAsk(pick.followUp ?? pick.ask);
    if (pick.action === 'photo') setPaperPath(true);
    trackEvent('operator_day1_front_pick', { pagePath: '/operator', meta: { pick: pick.id, action: pick.action } });
    if (pick.action === 'photo') {
      setActiveFolder(DAY1_INVOICE_PLATE_ID);
      photoRef.current?.click();
      return;
    }
    void goAsk(pick.ask, 'type');
  }

  function onMissingSpine(row: Day1MissingSpine) {
    setPaperPath(true);
    setActiveFolder(row.plateId);
    setAsk(`Bring the paper for ${row.label}. One tap. Many photos.`);
    onTray(row.tray);
    trackEvent('operator_day1_missing_spine', { pagePath: '/operator', meta: { spine: row.id, tray: row.tray } });
    photoRef.current?.click();
  }

  function onLastWeekFamily(id: LastWeekPrimeFamilyId) {
    const folder = folderForLastWeekFamily(id);
    if (folder) setActiveFolder(folder);
    setAsk(id === 'week-sales' ? 'What were my sales last week?' : `Bring last-week ${id} paper.`);
    if (id === 'week-sales') {
      fileRef.current?.click();
      return;
    }
    photoRef.current?.click();
  }

  function onTray(next: OwnerDeskTrayId) {
    setTray(next);
    if (next === 'action') setView('home');
    if (next === 'labor') setView('labor');
    if (next === 'food') setView('food');
    if (next === 'pop' || next === 'beer' || next === 'liquor') setView('bev');
    trackEvent('operator_desk_tray', { pagePath: '/operator', meta: { tray: next } });
  }

  function onMouth(next: FreeOperatorMouth) {
    setFlash(null);
    if (next === 'photo') {
      photoRef.current?.click();
      return;
    }
    if (next === 'file') {
      fileRef.current?.click();
      return;
    }
    if (next === 'talk') startTalk();
  }

  function startTalk() {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as Window & {
            SpeechRecognition?: new () => SpeechRecognition;
            webkitSpeechRecognition?: new () => SpeechRecognition;
          }).SpeechRecognition ||
          (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
        : undefined;
    if (!SpeechRecognition) {
      setFlash('Talk is not available on this phone. Type it.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setListening(true);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const said = event.results[0]?.[0]?.transcript ?? '';
      setAsk(said);
      setListening(false);
      void goAsk(said, 'talk');
    };
    recognition.onerror = () => {
      setListening(false);
      setFlash('Talk missed that. Type it.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  async function onRemoteFiles(kind: 'photo' | 'file', list: FileList | null | undefined) {
    const files = Array.from(list ?? []).filter((file) => file && file.size > 0);
    if (files.length === 0) return;
    setBusy(true);
    setFlash(null);
    setReceipt(receivingPapersLine(files.length));
    try {
      const form = new FormData();
      for (const file of files) form.append('file', file);
      if (activeFolder) form.set('folder', activeFolder);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        receivedCount?: number;
        upload?: { filename: string; evidenceKind: string };
        uploads?: Array<{ filename: string; evidenceKind: string }>;
        readiness?: SimpleOwnerReadiness;
      };
      if (!res.ok || !body.success) {
        const miss = body.error ?? 'Upload did not persist.';
        setFlash(miss);
        setReceipt(miss);
        return;
      }
      const uploads = body.uploads?.length ? body.uploads : body.upload ? [body.upload] : [];
      const names = uploads.map((row) => row.filename).filter(Boolean);
      const landed = receivedPapersLine(names.length ? names : files.map((file) => file.name));
      setLocalName(names[names.length - 1] ?? files[files.length - 1]?.name ?? null);
      applyReadiness(body.readiness);
      const readyFolder = uploads[uploads.length - 1]?.evidenceKind ?? body.upload?.evidenceKind;
      const win = readyFolder ? firstPhotoWinLine(readyFolder) : null;
      setWinLine(win);
      setReceipt(landed);
      setFlash(landed);
      if (body.readiness?.folders) {
        const nextHook = day1HookCoach(filledPlateIds(body.readiness.folders));
        setActiveFolder(nextHook.id);
        setAsk(nextHook.ask);
      }
      trackEvent('operator_demo_local_file', {
        pagePath: '/operator',
        meta: { kind, named: true, win: Boolean(win), count: names.length || files.length },
      });
    } catch {
      const miss = 'Upload did not reach the seat. Try again.';
      setFlash(miss);
      setReceipt(miss);
    } finally {
      setBusy(false);
      if (photoRef.current) photoRef.current.value = '';
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className={`owner-desk ${filled.size === 0 ? 'is-first-win' : 'is-winning'}`}>
      <div className="owner-desk-watermark" aria-hidden>
        <img src="/brand/n86-mark.svg" alt="" className="owner-desk-watermark-mark" />
        <span className="owner-desk-watermark-word">Never86</span>
      </div>

      <header className="owner-desk-top">
        <div className="owner-desk-hello">
          <div>
            <p className="owner-desk-store" title={deskSeatTitle(storeName || initialRestaurantName)}>
              {storeName.trim() ? deskSeatLabel(storeName) : signedIn ? 'Owner seat' : deskSeatLabel(null)}
            </p>
            <p className="owner-desk-hello-store">{firstScreen ? weekdayLabel() : greeting()}</p>
          </div>
          {signedIn ? (
            <button
              type="button"
              className="owner-desk-avatar"
              aria-label="Jump to ask"
              onClick={() => document.getElementById('owner-desk-ask')?.focus()}
            >
              1
            </button>
          ) : (
            <Link href="/login" className="owner-desk-avatar" aria-label="Open owner seat">
              1
            </Link>
          )}
        </div>
      </header>

      <div className="owner-desk-stage">
        <aside className="owner-desk-missing-rail" aria-label="Missing honesty spine">
          <p className="owner-desk-missing-kicker">Missing</p>
          {DAY1_MISSING_SPINE.map((row) => {
            const copy = day1MissingSpineCopy(row.id, filled);
            const isMissing = day1MissingSpineState(row.id, filled) === 'missing';
            return (
              <button
                key={row.id}
                type="button"
                className={`owner-desk-missing-row ${isMissing ? 'is-missing' : 'is-paper'}`}
                onClick={() => onMissingSpine(row)}
              >
                <span className="owner-desk-missing-label">{row.label}</span>
                <span className="owner-desk-missing-state">{copy}</span>
              </button>
            );
          })}
        </aside>

        <div className="owner-desk-main">
      {view === 'home' ? (
        <section className="owner-desk-lom">
          <p className="owner-desk-kicker">Action Shift</p>
          <h1 className="owner-desk-ask-title">
            {lastWeekPrime.honesty === 'Missing' ? LAST_WEEK_PRIME_LOAD_ASK : lastWeekPrime.headline}
          </h1>
          {winLine ? (
            <div className="owner-desk-win" role="status">
              <p className="owner-desk-win-mark">Ready</p>
              <p className="owner-desk-win-line">{winLine}</p>
            </div>
          ) : (
            <p className="owner-desk-poetry">
              {lastWeekPrime.nextLoad} Invoice ≠ COGS. Band {lastWeekPrime.bandMin}–{lastWeekPrime.bandMax}%. Missing stays Missing.
            </p>
          )}
          <article className="owner-desk-lastweek" aria-label="Last-week prime">
            <p className="owner-desk-lastweek-kicker">{lastWeekPrime.honesty} · last-week prime</p>
            <ul className="owner-desk-lastweek-list">
              {lastWeekPrime.families.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`owner-desk-lastweek-row is-${row.honesty.toLowerCase()}`}
                    onClick={() => onLastWeekFamily(row.id)}
                  >
                    <span className="owner-desk-lastweek-label">{row.label}</span>
                    <span className="owner-desk-lastweek-honesty">{row.honesty}</span>
                    <span className="owner-desk-lastweek-amt">
                      {row.amount == null ? 'Missing' : usd(row.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
          <button
            type="button"
            className="owner-desk-snap-hero"
            disabled={busy}
            onClick={() => void goAsk(LAST_WEEK_PRIME_LOAD_ASK)}
          >
            {busy ? 'Loading…' : 'Load last-week COGS'}
          </button>
          <button
            type="button"
            className="owner-desk-file-quiet"
            disabled={busy}
            onClick={() => onMouth('file')}
          >
            Add last-week files
          </button>
          <PapersInboxConnect
            onPulled={(next) => {
              setReceipt(next);
              setFlash(next);
            }}
          />
          {firstScreen ? (
            <p className="owner-desk-identity">
              {DAY1_IDENTITY_LINE}
              {' '}
              {frontPath && !needsPhoto ? DAY1_PREVIEW_CONTRACT : DAY1_SUBLINE}
            </p>
          ) : (
            <p className="owner-desk-poetry">{hookAsk}</p>
          )}
          {firstScreen && !paperPath ? (
            <div className="owner-desk-chips" aria-label="Floor asks">
              {DAY1_FRONT_PICKS.map((pick) => (
                <button
                  key={pick.id}
                  type="button"
                  className="owner-desk-pill is-need"
                  onClick={() => onFrontPick(pick)}
                >
                  {pick.chip}
                </button>
              ))}
            </div>
          ) : !firstScreen ? (
            <div className="owner-desk-chips" aria-label="Day-1 coach chips">
              {folders.map((folder) => {
                const coach = day1CoachById(folder.id);
                return (
                  <button
                    key={folder.id}
                    type="button"
                    className={`owner-desk-pill ${folder.state === 'READY' ? 'is-ready' : 'is-need'} ${activeFolder === folder.id ? 'is-hook' : ''}`}
                    onClick={() => {
                      const plate = OPERATOR_V2_PLATES.find((row) => row.id === folder.id);
                      if (plate) openPlate(plate, folder.state === 'NEED' ? 'photo' : 'ask');
                    }}
                  >
                    {folder.state === 'READY' ? `${folder.label} ✓` : coach?.chip ?? folder.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {needsPhoto ? (
            <>
              <button
                type="button"
                className="owner-desk-snap-hero"
                disabled={busy}
                onClick={() => {
                  const plate =
                    OPERATOR_V2_PLATES.find((row) => row.id === (activeFolder ?? DAY1_HOOK_PLATE_ID)) ??
                    OPERATOR_V2_PLATES[3];
                  openPlate(plate, 'photo');
                }}
              >
                <span className="owner-desk-snap-hero-mark" aria-hidden>
                  ⌖
                </span>
                {busy ? 'Receiving…' : 'Snap photos'}
              </button>
              <button
                type="button"
                className="owner-desk-file-quiet"
                disabled={busy}
                onClick={() => {
                  const plate =
                    OPERATOR_V2_PLATES.find((row) => row.id === (activeFolder ?? DAY1_HOOK_PLATE_ID)) ??
                    OPERATOR_V2_PLATES[3];
                  openPlate(plate, 'file');
                }}
              >
                Add files
              </button>
            </>
          ) : null}
        </section>
      ) : null}

      {view === 'labor' ? (
        <section className="mt-7">
          <h1 className="font-serif text-[2.2rem] leading-[0.95] tracking-[-0.04em] text-white">
            Labor cards · roles
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Paper-shop OCR. Daily compare to the clock. Punch ≠ schedule.
          </p>

          <div className="owner-v2-plates mt-5" aria-label="Labor folders">
            {folders
              .filter((folder) => folder.id === 'schedule' || folder.id === 'labor-cards')
              .map((folder) => {
                const plate = OPERATOR_V2_PLATES.find((row) => row.id === folder.id);
                return (
                  <button
                    key={folder.id}
                    type="button"
                    className={`owner-v2-plate ${folder.state === 'READY' ? 'is-ready' : ''}`}
                    onClick={() => plate && openPlate(plate)}
                  >
                    <span className="owner-v2-plate-kicker">{folder.folder}</span>
                    <span className="owner-v2-plate-label">{folder.label}</span>
                    <span className="owner-v2-plate-miss">{folder.reason}</span>
                  </button>
                );
              })}
          </div>

          <article className="owner-desk-card mt-5">
            <h2 className="text-lg font-semibold text-[#f4f1ea]">Roles on the card</h2>
            <p className="mt-1 text-sm text-[#8B949E]">
              Labor cards name seats, not people. FOH, Line, Dish, Run spawn from the week schedule.
            </p>
            <div className="owner-v2-roles mt-4">
              {roleCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`owner-v2-role ${card.state === 'READY' ? 'is-ready' : ''}`}
                  onClick={() => {
                    const plate = OPERATOR_V2_PLATES.find((row) => row.id === 'labor-cards');
                    if (plate) openPlate(plate);
                  }}
                >
                  <span className="owner-v2-plate-kicker">{card.role}</span>
                  <span className="owner-v2-role-meta">
                    {card.posted === 'On schedule' ? 'Posted in / out' : 'Posted Missing'}
                  </span>
                  <span className="owner-v2-plate-miss">
                    {card.punch === 'Missing' ? 'Punch Missing' : 'Clock landed · compare open'}
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className="owner-desk-card owner-desk-card-peach mt-4">
            <h2 className="text-lg font-semibold text-[#f4f1ea]">Daily compare</h2>
            <p className="mt-1 text-sm text-[#8B949E]">
              Early leave, late leave, and labor drift vs the posted card. No invented overtime.
            </p>
            <ul className="mt-4 space-y-2">
              {dailyCompare.map((chip) => (
                <li key={chip.id}>
                  <div className={`owner-desk-evidence ${chip.state === 'READY' ? 'is-ready' : ''}`}>
                    <span className="owner-desk-evidence-icon" aria-hidden>
                      {chip.state === 'READY' ? '✓' : '◷'}
                    </span>
                    <span className="text-left">
                      <span className="block font-semibold text-[#f4f1ea]">{chip.label}</span>
                      <span className="mt-1 block text-sm text-[#8B949E]">{chip.rule}</span>
                      <span className="mt-1 block text-sm text-[#8B949E]">{chip.reason}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="owner-desk-primary"
                onClick={() => {
                  setActiveFolder('schedule');
                  onMouth('photo');
                }}
              >
                Photo the schedule
              </button>
              <button
                type="button"
                className="owner-desk-secondary"
                onClick={() => {
                  setActiveFolder('labor-cards');
                  onMouth('file');
                }}
              >
                Add labor cards or clock
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {view === 'food' || view === 'bev' ? (
        <section className="mt-7">
          <h1 className="font-serif text-[2.2rem] leading-[0.95] tracking-[-0.04em] text-white">
            {view === 'food' ? 'Menu & invoice / truck' : 'Beverage margin'}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Same first-class folders as schedule and labor cards. Photo the paper. Invoice ≠ COGS.
          </p>
          {view === 'food' ? (
            <div className="owner-v2-plates mt-5" aria-label="Food folders">
              {folders
                .filter((folder) => folder.id === 'menu' || folder.id === 'invoice-truck')
                .map((folder) => {
                  const plate = OPERATOR_V2_PLATES.find((row) => row.id === folder.id);
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      className={`owner-v2-plate ${folder.state === 'READY' ? 'is-ready' : ''}`}
                      onClick={() => plate && openPlate(plate)}
                    >
                      <span className="owner-v2-plate-kicker">{folder.folder}</span>
                      <span className="owner-v2-plate-label">{folder.label}</span>
                      <span className="owner-v2-plate-miss">{folder.reason}</span>
                    </button>
                  );
                })}
            </div>
          ) : null}
          <article className="owner-desk-card mt-5">
            <div className="flex items-start gap-3">
              <span className="owner-desk-avatar" aria-hidden>
                N86
              </span>
              <div>
                <p className="text-sm leading-relaxed text-[#f4f1ea]">
                  {view === 'food'
                    ? 'Picture the menu and a truck ticket or invoice. Top plates first. Missing count stays Missing Evidence.'
                    : 'Ask for the count, invoice, or package change. Missing count stays Missing Evidence.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="owner-desk-chip is-ready">OCR folder</span>
                  <span className="owner-desk-chip is-need">No private dollars yet</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="owner-desk-primary"
                    disabled={busy}
                    onClick={() => {
                      setActiveFolder(view === 'food' ? 'menu' : 'invoice-truck');
                      onMouth('photo');
                    }}
                  >
                    Snap photos
                  </button>
                  <button
                    type="button"
                    className="owner-desk-secondary"
                    disabled={busy}
                    onClick={() => {
                      setActiveFolder(view === 'food' ? 'invoice-truck' : 'invoice-truck');
                      onMouth('file');
                    }}
                  >
                    Add files
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <div ref={answerRef} className={answer ? 'owner-seat-answer mt-5' : undefined} aria-live="polite">
        {answer ? <FreeOperatorAnswerCard answer={answer} compact live /> : null}
      </div>

      {localName ? (
        <p className="mt-4 text-sm text-white/80">
          {localName} · stored on this seat · source-tagged
        </p>
      ) : null}
        </div>
      </div>

      <div
        className={`owner-seat-dock ${askFocused ? 'is-ask-focus' : ''} ${firstScreen ? 'is-first-win' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onRemoteFiles('file', event.dataTransfer.files);
        }}
      >
      <div className="owner-desk-mouth">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void goAsk(ask, 'type');
          }}
        >
          <label htmlFor="owner-desk-ask" className="sr-only">
            Ask what&apos;s happening
          </label>
          {receipt ? (
            <p className="owner-seat-receipt" role="status" aria-live="polite">
              {receipt}
            </p>
          ) : null}
          <div className="owner-desk-ask-shell">
            <textarea
              id="owner-desk-ask"
              value={ask}
              onChange={(event) => setAsk(event.target.value)}
              onFocus={() => setAskFocused(true)}
              onBlur={() => setAskFocused(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void goAsk(ask, 'type');
                }
              }}
              rows={2}
              placeholder={listening ? 'Listening…' : DAY1_HELP_ENERGY}
              className="owner-desk-ask"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button type="button" className="owner-desk-round" aria-label="Add files" onClick={() => onMouth('file')}>
                  +
                </button>
                <button type="button" className="owner-desk-round" aria-label="Add photos" onClick={() => onMouth('photo')}>
                  ▣
                </button>
                <button type="button" className="owner-desk-round" aria-label="Talk" onClick={() => onMouth('talk')}>
                  ●
                </button>
              </div>
              <button type="submit" className="owner-desk-send" aria-label="Send ask" disabled={busy}>
                ↑
              </button>
            </div>
          </div>
        </form>
        <p className="owner-desk-legal">{PUBLIC_PREVIEW_COPY}</p>
        {flash && flash !== receipt ? <p className="owner-desk-flash">{flash}</p> : null}
      </div>

      <nav
        className={`owner-desk-tray ${firstScreen ? 'is-quiet' : ''}`}
        aria-label="Seat sections"
        hidden={firstScreen}
      >
        {OWNER_DESK_TRAY.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`owner-desk-tray-btn ${tray === item.id ? 'is-active' : ''}`}
            aria-label={item.label}
            onClick={() => onTray(item.id)}
          >
            <span className="owner-desk-tray-label">{item.label}</span>
          </button>
        ))}
      </nav>

      </div>
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => void onRemoteFiles('photo', event.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,.csv,.txt,.xlsx,.xls"
        multiple
        className="sr-only"
        onChange={(event) => void onRemoteFiles('file', event.target.files)}
      />
    </div>
  );
}

export const SimpleOwnerDemo = FreeOperatorPhone;

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
