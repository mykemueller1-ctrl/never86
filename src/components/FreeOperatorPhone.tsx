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
import { CTAP_SEAT1_PUBLIC_LABEL } from '@/lib/ctapSeat1';
import {
  OPERATOR_V2_PLATES,
  dailyCompareFromEvidence,
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

export function FreeOperatorPhone() {
  const [ask, setAsk] = useState('');
  const [view, setView] = useState<DeskView>('home');
  const [tray, setTray] = useState<OwnerDeskTrayId>('action');
  const [evidence, setEvidence] = useState<PrimeCostEvidence[]>(emptyEvidence);
  const [folders, setFolders] = useState<OperatorV2FolderState[]>(emptyFolders);
  const [roleCards, setRoleCards] = useState<LaborRoleCard[]>(emptyRoleCards);
  const [dailyCompare, setDailyCompare] = useState<DailyCompareChip[]>(emptyDailyCompare);
  const [activeFolder, setActiveFolder] = useState<OperatorV2PlateId | null>(null);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [answer, setAnswer] = useState<SimpleOwnerAskAnswer | null>(null);
  const [localName, setLocalName] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const readyCount = useMemo(() => evidence.filter((row) => row.state === 'READY').length, [evidence]);
  const coachReady = readyCount >= 2;

  function applyReadiness(next: SimpleOwnerReadiness | undefined) {
    if (!next?.evidence) return;
    setEvidence(next.evidence.map((row) => ({ ...row })));
    if (next.folders) setFolders(next.folders.map((row) => ({ ...row })));
    if (next.laborCards) setRoleCards(next.laborCards.map((row) => ({ ...row })));
    if (next.dailyCompare) setDailyCompare(next.dailyCompare.map((row) => ({ ...row })));
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/operator/readiness', { method: 'GET' });
        const body = (await res.json()) as { success?: boolean; readiness?: SimpleOwnerReadiness; error?: string };
        if (cancelled) return;
        if (!res.ok || !body.success) {
          setFlash(body.error ?? 'Readiness is not live yet. Persist may be unconfigured.');
          return;
        }
        applyReadiness(body.readiness);
      } catch {
        if (!cancelled) setFlash('Readiness could not load. Try again.');
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

  function openPlate(plate: OperatorV2Plate) {
    setActiveFolder(plate.id);
    setAsk(plate.ask);
    onTray(plate.tray);
    const folder = folders.find((row) => row.id === plate.id);
    const needPhoto = !folder || folder.state === 'NEED';
    trackEvent('operator_v2_plate', { pagePath: '/operator', meta: { plate: plate.id, ocr: needPhoto } });
    if (needPhoto) photoRef.current?.click();
    void goAsk(plate.ask, needPhoto ? 'photo' : 'type');
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

  async function onRemoteFile(kind: 'photo' | 'file', file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setFlash(null);
    try {
      const form = new FormData();
      form.set('file', file);
      if (activeFolder) form.set('folder', activeFolder);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        upload?: { filename: string; evidenceKind: string };
        readiness?: SimpleOwnerReadiness;
      };
      if (!res.ok || !body.success) {
        setFlash(body.error ?? 'Upload did not persist.');
        return;
      }
      setLocalName(body.upload?.filename ?? file.name);
      applyReadiness(body.readiness);
      setFlash(`${body.upload?.filename ?? file.name} stored on this seat with a source tag.`);
      trackEvent('operator_demo_local_file', { pagePath: '/operator', meta: { kind, named: true } });
    } catch {
      setFlash('Upload did not reach the seat. Try again.');
    } finally {
      setBusy(false);
      if (photoRef.current) photoRef.current.value = '';
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="owner-desk">
      <header className="owner-desk-top">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-[1.85rem] leading-none tracking-[-0.03em] text-white">
              {greeting()}, operator.
            </p>
            <p className="mt-2 text-sm text-white/80">{CTAP_SEAT1_PUBLIC_LABEL} · Owner desk</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="owner-desk-icon-btn"
              aria-label="Add evidence"
              onClick={() => onMouth('file')}
            >
              +
            </button>
            <Link href="/onboard" className="owner-desk-avatar" aria-label="Claim owner seat">
              1
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Missing folders">
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={`owner-desk-pill ${folder.state === 'READY' ? 'is-ready' : 'is-need'}`}
              onClick={() => {
                const plate = OPERATOR_V2_PLATES.find((row) => row.id === folder.id);
                if (plate) openPlate(plate);
              }}
            >
              {folder.state === 'READY' ? `${folder.label} ✓` : `Missing · ${folder.label}`}
            </button>
          ))}
        </div>
      </header>

      {view === 'home' ? (
        <section className="mt-7">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white">
            Action Shift · {weekdayLabel()}
          </p>
          <h1 className="mt-3 font-serif text-[2.35rem] leading-[0.95] tracking-[-0.04em] text-white">
            What&apos;s going on in your restaurant?
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/85">
            Paper-shop folders first: schedule, labor cards, menu, order guide. Photo the week. Labor cards name
            roles. Daily compare to the clock finds early leave, late leave, and labor drift.
          </p>

          <div className="owner-v2-plates mt-6" aria-label="Project folders">
            {folders.map((folder) => {
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
                  <span className="owner-v2-plate-miss">
                    {folder.state === 'READY' ? 'On this seat · named is not a close' : folder.reason}
                  </span>
                </button>
              );
            })}
          </div>

          <article className="owner-desk-card mt-6">
            <div className="flex items-start gap-3">
              <span className="owner-desk-bolt" aria-hidden>
                ⚡
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#06122b]">
                      {coachReady ? 'Prime Cost Coach is warming up' : 'Let’s finish your Prime Cost Coach.'}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#3d4d73]">
                      {coachReady
                        ? 'Two reports are on this seat. Add the third so labor vs demand can be checked without inventing the percentage.'
                        : 'Readiness is live from stored files. I still need the matching reports before I show where labor outran demand.'}
                    </p>
                  </div>
                  <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-[#003bb5]">
                    {readyCount} of 3 ready
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {evidence.map((row) => (
                    <span
                      key={`chip-${row.id}`}
                      className={`owner-desk-chip ${row.state === 'READY' ? 'is-ready' : 'is-need'}`}
                    >
                      {row.state === 'READY' ? `${row.short} ✓` : `Need ${row.short.toLowerCase()}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
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
            <h2 className="text-lg font-semibold text-[#06122b]">Roles on the card</h2>
            <p className="mt-1 text-sm text-[#3d4d73]">
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
            <h2 className="text-lg font-semibold text-[#06122b]">Daily compare</h2>
            <p className="mt-1 text-sm text-[#3d4d73]">
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
                      <span className="block font-semibold text-[#06122b]">{chip.label}</span>
                      <span className="mt-1 block text-sm text-[#3d4d73]">{chip.rule}</span>
                      <span className="mt-1 block text-sm text-[#3d4d73]">{chip.reason}</span>
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
            {view === 'food' ? 'Menu & order guides' : 'Beverage margin'}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Same first-class folders as schedule and labor cards. Photo the paper. Invoice ≠ COGS.
          </p>
          {view === 'food' ? (
            <div className="owner-v2-plates mt-5" aria-label="Food folders">
              {folders
                .filter((folder) => folder.id === 'menu' || folder.id === 'order-guide')
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
                <p className="text-sm leading-relaxed text-[#06122b]">
                  {view === 'food'
                    ? 'Picture the menu and the order guide. Top plates first. Missing count stays Missing Evidence.'
                    : 'Ask for the count, invoice, or package change. Missing count stays Missing Evidence.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="owner-desk-chip is-ready">OCR folder</span>
                  <span className="owner-desk-chip is-need">No private dollars yet</span>
                </div>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <div ref={answerRef} className={answer ? 'mt-5 scroll-mt-24' : undefined} aria-live="polite">
        {answer ? <FreeOperatorAnswerCard answer={answer} compact live /> : null}
      </div>

      {localName ? (
        <p className="mt-4 text-sm text-white/80">
          {localName} · stored on this seat · source-tagged
        </p>
      ) : null}

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
          <div className="owner-desk-ask-shell">
            <textarea
              id="owner-desk-ask"
              value={ask}
              onChange={(event) => setAsk(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void goAsk(ask, 'type');
                }
              }}
              rows={2}
              disabled={busy}
              placeholder={listening ? 'Listening…' : "Ask what's happening in your restaurant..."}
              className="owner-desk-ask"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button type="button" className="owner-desk-round" aria-label="Add file" onClick={() => onMouth('file')}>
                  +
                </button>
                <button type="button" className="owner-desk-round" aria-label="Take photo" onClick={() => onMouth('photo')}>
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
        <p className="mt-2 text-center text-[11px] leading-relaxed text-white/75">{PUBLIC_PREVIEW_COPY}</p>
        {flash ? <p className="mt-2 text-center text-sm text-white">{flash}</p> : null}
      </div>

      <nav className="owner-desk-tray" aria-label="Owner desk sections">
        {OWNER_DESK_TRAY.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`owner-desk-tray-btn ${tray === item.id ? 'is-active' : ''}`}
            aria-label={item.label}
            onClick={() => onTray(item.id)}
          >
            <span aria-hidden>{item.icon}</span>
          </button>
        ))}
      </nav>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => void onRemoteFile('photo', event.target.files?.[0])}
      />
      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        onChange={(event) => void onRemoteFile('file', event.target.files?.[0])}
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
