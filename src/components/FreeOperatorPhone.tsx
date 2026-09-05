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
import { OPERATOR_V2_PLATES, type OperatorV2Plate } from '@/lib/operatorV2';

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

export function FreeOperatorPhone() {
  const [ask, setAsk] = useState('');
  const [view, setView] = useState<DeskView>('home');
  const [tray, setTray] = useState<OwnerDeskTrayId>('action');
  const [evidence, setEvidence] = useState<PrimeCostEvidence[]>(emptyEvidence);
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
    setAsk(plate.ask);
    onTray(plate.tray);
    trackEvent('operator_v2_plate', { pagePath: '/operator', meta: { plate: plate.id } });
    void goAsk(plate.ask, 'type');
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

        <div className="mt-4 flex flex-wrap gap-2">
          {evidence.map((row) => (
            <span
              key={row.id}
              className={`owner-desk-pill ${row.state === 'READY' ? 'is-ready' : 'is-need'}`}
            >
              {row.state === 'READY' ? `${row.short} ✓` : `Need ${row.short.toLowerCase()}`}
            </span>
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
            Talk, type, take a picture, or add a file. Every ask and file is stored on this seat.
          </p>

          <div className="owner-v2-plates mt-6" aria-label="Missing folders">
            {OPERATOR_V2_PLATES.map((plate) => (
              <button
                key={plate.id}
                type="button"
                className="owner-v2-plate"
                onClick={() => openPlate(plate)}
              >
                <span className="owner-v2-plate-kicker">{plate.folder}</span>
                <span className="owner-v2-plate-label">{plate.label}</span>
                <span className="owner-v2-plate-miss">Missing · {plate.missingUntil}</span>
              </button>
            ))}
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
            Labor & schedule
          </h1>
          <p className="mt-2 text-sm text-white/80">Plan vs actual · demo restaurant</p>

          <article className="owner-desk-card owner-desk-card-peach mt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="owner-desk-bolt" aria-hidden>
                  ⚡
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[#06122b]">Unlock Prime Cost Coach</h2>
                  <p className="mt-1 text-sm text-[#3d4d73]">Two real reports turn this on.</p>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#003bb5]">
                {readyCount} of 3 ready
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {evidence.map((row) => (
                <li key={row.id}>
                  <div className={`owner-desk-evidence ${row.state === 'READY' ? 'is-ready' : ''}`}>
                    <span className="owner-desk-evidence-icon" aria-hidden>
                      {row.state === 'READY' ? '✓' : row.icon}
                    </span>
                    <span className="text-left">
                      <span className="block font-semibold text-[#06122b]">{row.title}</span>
                      <span className="mt-1 block text-sm text-[#3d4d73]">{row.reason}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="owner-desk-primary" onClick={() => onMouth('file')}>
                Choose a report
              </button>
              <button type="button" className="owner-desk-secondary" onClick={() => onMouth('photo')}>
                Take a picture
              </button>
            </div>
          </article>

          {answer?.slug === 'schedule-labor' ? null : (
            <article className="owner-desk-card mt-4">
              <div className="flex items-start gap-3">
                <span className="owner-desk-avatar" aria-hidden>
                  N86
                </span>
                <div>
                  <p className="text-sm leading-relaxed text-[#06122b]">
                    Add the schedule, time clock, and hourly sales. I&apos;ll line up planned people, actual punches,
                    and demand by hour from the files on this seat—without making up the answer.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="owner-desk-chip is-ready">Owner question</span>
                    <span className="owner-desk-chip is-need">Needs source evidence</span>
                  </div>
                </div>
              </div>
            </article>
          )}
        </section>
      ) : null}

      {view === 'food' || view === 'bev' ? (
        <section className="mt-7">
          <h1 className="font-serif text-[2.2rem] leading-[0.95] tracking-[-0.04em] text-white">
            {view === 'food' ? 'Food & invoice truth' : 'Beverage margin'}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Ask for the count, invoice, or package change. Missing count stays Missing Evidence.
          </p>
          <article className="owner-desk-card mt-5">
            <div className="flex items-start gap-3">
              <span className="owner-desk-avatar" aria-hidden>
                N86
              </span>
              <div>
                <p className="text-sm leading-relaxed text-[#06122b]">
                  I know the vendor rhythm. Add a current count or invoice and I&apos;ll compare draft, package,
                  credits, and price changes.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="owner-desk-chip is-ready">Ready</span>
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
