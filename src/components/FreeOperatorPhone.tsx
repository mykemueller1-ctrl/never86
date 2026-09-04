'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/lib/track';
import { FreeOperatorAnswerCard } from '@/components/FreeOperatorAnswerCard';
import {
  OWNER_DESK_TRAY,
  OWNER_PRIME_COST_EVIDENCE,
  PUBLIC_PREVIEW_COPY,
  SAMPLE_LABEL,
  type FreeOperatorAnswer,
  type FreeOperatorMouth,
  type OwnerDeskTrayId,
  type PrimeCostEvidence,
  getFreeOperatorAnswer,
  resolveOwnerDeskAsk,
} from '@/lib/freeOperatorDemo';

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

export function FreeOperatorPhone() {
  const [ask, setAsk] = useState('');
  const [view, setView] = useState<DeskView>('home');
  const [tray, setTray] = useState<OwnerDeskTrayId>('action');
  const [evidence, setEvidence] = useState<PrimeCostEvidence[]>(() =>
    OWNER_PRIME_COST_EVIDENCE.map((row) => ({ ...row })),
  );
  const [listening, setListening] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [answer, setAnswer] = useState<FreeOperatorAnswer | null>(null);
  const [localName, setLocalName] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const readyCount = useMemo(() => evidence.filter((row) => row.state === 'READY').length, [evidence]);
  const coachReady = readyCount >= 2;

  function goAsk(nextAsk: string) {
    const resolved = resolveOwnerDeskAsk(nextAsk, tray);
    if (!resolved.ok) {
      setAnswer(null);
      setFlash(`${resolved.reason} NEEDS: ${resolved.needs}`);
      trackEvent('operator_demo_ask_empty', { pagePath: '/operator', meta: { tray } });
      return;
    }
    const next = getFreeOperatorAnswer(resolved.slug);
    if (!next) {
      setAnswer(null);
      setFlash('That sample card is missing. No close invented.');
      return;
    }
    setAnswer(next);
    setFlash(null);
    trackEvent('operator_demo_ask', { pagePath: '/operator', meta: { slug: resolved.slug, tray } });
    queueMicrotask(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
      goAsk(said);
    };
    recognition.onerror = () => {
      setListening(false);
      setFlash('Talk missed that. Type it.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function markEvidence(id: PrimeCostEvidence['id']) {
    setEvidence((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              state: 'READY',
              reason: `${row.title} named on this phone. Named is not a verified close.`,
            }
          : row,
      ),
    );
    setFlash(`${id} marked ready on this phone only. ${SAMPLE_LABEL}`);
    trackEvent('operator_desk_evidence', { pagePath: '/operator', meta: { id } });
  }

  function onLocalFile(kind: 'photo' | 'file', file: File | undefined) {
    if (!file) return;
    setLocalName(file.name);
    setFlash(`${file.name} stays on this phone. Named is not a verified close.`);
    if (view === 'labor' || tray === 'labor') markEvidence('hourly');
    trackEvent('operator_demo_local_file', { pagePath: '/operator', meta: { kind, named: true } });
  }

  return (
    <div className="owner-desk">
      <header className="owner-desk-top">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-[1.85rem] leading-none tracking-[-0.03em] text-[#161616]">
              {greeting()}, operator.
            </p>
            <p className="mt-2 text-sm text-[#6f675e]">Demo restaurant · Owner desk · 1–3 unit ICP</p>
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
            <button
              key={row.id}
              type="button"
              className={`owner-desk-pill ${row.state === 'READY' ? 'is-ready' : 'is-need'}`}
              onClick={() => (row.state === 'READY' ? undefined : markEvidence(row.id))}
            >
              {row.state === 'READY' ? `${row.short} ✓` : `Need ${row.short.toLowerCase()}`}
            </button>
          ))}
        </div>
      </header>

      {view === 'home' ? (
        <section className="mt-7">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#e66b27]">
            Action Shift · {weekdayLabel()}
          </p>
          <h1 className="mt-3 font-serif text-[2.35rem] leading-[0.95] tracking-[-0.04em] text-[#161616]">
            What&apos;s going on in your restaurant?
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#514b43]">
            Talk, type, take a picture, or add a file. Ask it exactly like you&apos;d ask another operator.
          </p>

          <article className="owner-desk-card mt-6">
            <div className="flex items-start gap-3">
              <span className="owner-desk-bolt" aria-hidden>
                ⚡
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#161616]">
                      {coachReady ? 'Prime Cost Coach is warming up' : 'Let’s finish your Prime Cost Coach.'}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#514b43]">
                      {coachReady
                        ? 'Two reports are named. Add the third so labor vs demand can be checked without inventing the percentage.'
                        : 'I already understand the schedule. I still need hourly sales and the time-clock report so I can show where labor outran demand—not just tell you the percentage was high.'}
                    </p>
                  </div>
                  <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-[#e66b27]">
                    {readyCount} of 3 ready
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {evidence.map((row) => (
                    <button
                      key={`chip-${row.id}`}
                      type="button"
                      className={`owner-desk-chip ${row.state === 'READY' ? 'is-ready' : 'is-need'}`}
                      onClick={() => (row.state === 'READY' ? undefined : markEvidence(row.id))}
                    >
                      {row.state === 'READY' ? `${row.short} ✓` : `Need ${row.short.toLowerCase()}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {view === 'labor' ? (
        <section className="mt-7">
          <h1 className="font-serif text-[2.2rem] leading-[0.95] tracking-[-0.04em] text-[#161616]">
            Labor & schedule
          </h1>
          <p className="mt-2 text-sm text-[#6f675e]">Plan vs actual · demo restaurant</p>

          <article className="owner-desk-card owner-desk-card-peach mt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="owner-desk-bolt" aria-hidden>
                  ⚡
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[#161616]">Unlock Prime Cost Coach</h2>
                  <p className="mt-1 text-sm text-[#514b43]">Two real reports turn this on.</p>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#e66b27]">
                {readyCount} of 3 ready
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {evidence.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`owner-desk-evidence ${row.state === 'READY' ? 'is-ready' : ''}`}
                    onClick={() => (row.state === 'READY' ? undefined : markEvidence(row.id))}
                  >
                    <span className="owner-desk-evidence-icon" aria-hidden>
                      {row.state === 'READY' ? '✓' : row.icon}
                    </span>
                    <span className="text-left">
                      <span className="block font-semibold text-[#161616]">{row.title}</span>
                      <span className="mt-1 block text-sm text-[#6f675e]">{row.reason}</span>
                    </span>
                  </button>
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
                  <p className="text-sm leading-relaxed text-[#252525]">
                    Add the schedule, time clock, and hourly sales. I&apos;ll line up planned people, actual punches,
                    and demand by hour. I&apos;ll tell you what I know, what I&apos;m missing, and the smallest next
                    move—without making up the answer.
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
          <h1 className="font-serif text-[2.2rem] leading-[0.95] tracking-[-0.04em] text-[#161616]">
            {view === 'food' ? 'Food & invoice truth' : 'Beverage margin'}
          </h1>
          <p className="mt-2 text-sm text-[#6f675e]">
            Ask for the count, invoice, or package change. Missing count stays Missing Evidence.
          </p>
          <article className="owner-desk-card mt-5">
            <div className="flex items-start gap-3">
              <span className="owner-desk-avatar" aria-hidden>
                N86
              </span>
              <div>
                <p className="text-sm leading-relaxed text-[#252525]">
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
        {answer ? <FreeOperatorAnswerCard answer={answer} compact /> : null}
      </div>

      {localName ? (
        <p className="mt-4 text-sm text-[#6f675e]">
          {localName} · on this phone · {SAMPLE_LABEL}
        </p>
      ) : null}

      <div className="owner-desk-mouth">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            goAsk(ask);
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
                  goAsk(ask);
                }
              }}
              rows={2}
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
              <button type="submit" className="owner-desk-send" aria-label="Send ask">
                ↑
              </button>
            </div>
          </div>
        </form>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-[#8a8176]">{PUBLIC_PREVIEW_COPY}</p>
        {flash ? <p className="mt-2 text-center text-sm text-[#9a4a00]">{flash}</p> : null}
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
        onChange={(event) => onLocalFile('photo', event.target.files?.[0])}
      />
      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        onChange={(event) => onLocalFile('file', event.target.files?.[0])}
      />
    </div>
  );
}

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
