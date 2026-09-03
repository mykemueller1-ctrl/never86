'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/track';
import {
  BASE_WHAT_I_KNOW,
  FREE_OPERATOR_CHIPS,
  FREE_OPERATOR_MOUTH,
  OWNER_SEAT_EOD,
  PUBLIC_PREVIEW_COPY,
  SAMPLE_LABEL,
  type FreeOperatorChipId,
  type FreeOperatorMouth,
  type WhatIKnowCard,
  nameLocalEvidence,
  resolveFreeOperatorAsk,
} from '@/lib/freeOperatorDemo';

const MOUTH_LABEL: Record<FreeOperatorMouth, string> = {
  talk: 'Talk',
  type: 'Type',
  photo: 'Photo',
  file: 'File',
};

export function FreeOperatorPhone() {
  const router = useRouter();
  const [ask, setAsk] = useState('');
  const [chipId, setChipId] = useState<FreeOperatorChipId | null>(null);
  const [mouth, setMouth] = useState<FreeOperatorMouth>('type');
  const [cards, setCards] = useState<WhatIKnowCard[]>(() => [...BASE_WHAT_I_KNOW]);
  const [localName, setLocalName] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readyCount = useMemo(() => cards.filter((card) => card.state === 'READY').length, [cards]);
  const needCount = cards.length - readyCount;

  function goAsk(nextAsk: string, nextChip: FreeOperatorChipId | null = chipId) {
    const resolved = resolveFreeOperatorAsk(nextAsk, nextChip);
    if (!resolved.ok) {
      setFlash(`${resolved.reason} NEEDS: ${resolved.needs}`);
      trackEvent('operator_demo_ask_empty', { pagePath: '/operator', meta: { chip: nextChip } });
      return;
    }
    setFlash(null);
    trackEvent('operator_demo_ask', { pagePath: '/operator', meta: { slug: resolved.slug, chip: resolved.chipId } });
    router.push(`/operator/answers/${resolved.slug}`);
  }

  function onChip(id: FreeOperatorChipId) {
    setChipId(id);
    const chip = FREE_OPERATOR_CHIPS.find((row) => row.id === id);
    if (chip) setAsk(chip.label);
    goAsk(FREE_OPERATOR_CHIPS.find((row) => row.id === id)?.label ?? '', id);
  }

  function onMouth(next: FreeOperatorMouth) {
    setMouth(next);
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
      setMouth('type');
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
      goAsk(said, chipId);
    };
    recognition.onerror = () => {
      setListening(false);
      setMouth('type');
      setFlash('Talk missed that. Type it.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function onLocalFile(kind: 'photo' | 'file', file: File | undefined) {
    if (!file) return;
    setLocalName(file.name);
    setCards(nameLocalEvidence(BASE_WHAT_I_KNOW, kind, file.name));
    setFlash(`${file.name} stays on this phone. Named is not a verified close.`);
    trackEvent('operator_demo_local_file', { pagePath: '/operator', meta: { kind, named: true } });
  }

  return (
    <div className="operator-phone">
      <header className="operator-phone-top">
        <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#005de8]">
          Never 86&apos;d
        </Link>
        <p className="mt-3 font-serif text-[2.1rem] leading-[0.95] tracking-[-0.04em] text-[#161616]">
          Ask the house.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-[#514b43]">
          One leak. One coach tomorrow. Needs named. Not a dashboard.
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#766f65]">{PUBLIC_PREVIEW_COPY}</p>
      </header>

      <section aria-labelledby="what-i-know-heading" className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <h2 id="what-i-know-heading" className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#005de8]">
            What I know
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#766f65]">
            {needCount} need · {readyCount} ready
          </p>
        </div>
        <ul className="mt-3 space-y-2">
          {cards.map((card) => (
            <li key={card.id} className="rounded-2xl border border-[#d8cec0] bg-[#fffaf2] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-[#1b1b1b]">{card.title}</p>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                    card.state === 'READY' ? 'text-[#0f6b3a]' : 'text-[#9a4a00]'
                  }`}
                >
                  {card.state}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[#554f47]">{card.reason}</p>
            </li>
          ))}
        </ul>
        {localName ? (
          <p className="mt-3 text-sm text-[#554f47]">
            {localName} · on this phone · {SAMPLE_LABEL}
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-[#d8cec0] bg-[#fffaf2] px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#766f65]">Forward EOD</p>
        <p className="mt-2 text-sm leading-relaxed text-[#514b43]">{OWNER_SEAT_EOD.copy}</p>
      </section>

      <div className="operator-phone-mouth">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Ask chips">
          {FREE_OPERATOR_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`rounded-full border px-3 py-2 text-sm ${
                chipId === chip.id
                  ? 'border-[#005de8] bg-[#005de8] text-white'
                  : 'border-[#afa396] bg-white text-[#24211e]'
              }`}
              onClick={() => onChip(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            goAsk(ask, chipId);
          }}
        >
          <label htmlFor="operator-ask" className="sr-only">
            Ask
          </label>
          <textarea
            id="operator-ask"
            value={ask}
            onChange={(event) => setAsk(event.target.value)}
            rows={3}
            placeholder={listening ? 'Listening…' : 'Talk, type, or tap a chip.'}
            className="w-full rounded-2xl border border-[#d8cec0] bg-white px-4 py-3 text-[16px] text-[#161616] placeholder:text-[#8a8176]"
          />
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Ask mouth">
            {FREE_OPERATOR_MOUTH.map((item) => (
              <button
                key={item}
                type="button"
                className={`min-h-11 flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
                  mouth === item ? 'border-[#005de8] text-[#005de8]' : 'border-[#afa396] text-[#423e38]'
                }`}
                onClick={() => onMouth(item)}
              >
                {MOUTH_LABEL[item]}
              </button>
            ))}
            <button type="submit" className="human-button human-button-primary min-h-11 flex-[1.2] text-sm">
              Ask →
            </button>
          </div>
        </form>
        {flash ? <p className="mt-3 text-sm leading-relaxed text-[#9a4a00]">{flash}</p> : null}
      </div>

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
