'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import {
  GOLD_LABOR,
  GOLD_RECIPE,
  money,
  pctLabel,
  type HonestyLabel,
} from '@/lib/oneSeatPublicWin';
import { answerSeatAsk, SEAT_TABS, tabFromSeatHash, type SeatTabId } from '@/lib/oneSeatPanels';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export function OneSeatPanels({
  initial = 'missing',
  sample,
  invoices,
  papers,
  ask,
}: {
  initial?: SeatTabId;
  sample?: React.ReactNode;
  invoices?: React.ReactNode;
  papers?: React.ReactNode;
  ask?: React.ReactNode;
}) {
  const [tab, setTab] = useState<SeatTabId>(initial);
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [honesty, setHonesty] = useState<HonestyLabel>('Missing');

  useEffect(() => {
    function sync() {
      const next = tabFromSeatHash(window.location.hash);
      if (next) setTab(next);
    }
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    if (hash === '#photo') {
      document.getElementById('photo')?.scrollIntoView({ block: 'start' });
      return;
    }
    const id = tabFromSeatHash(hash);
    if (!id || id !== tab) return;
    document.getElementById(`seat-panel-${id}`)?.scrollIntoView({ block: 'start' });
  }, [tab]);

  function selectTab(next: SeatTabId) {
    setTab(next);
    const nextHash = `#${next}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }

  function onAsk(event: React.FormEvent) {
    event.preventDefault();
    const answer = answerSeatAsk(question);
    setHonesty(answer.honesty);
    setReply(answer.reply);
    setTab(answer.tab);
  }

  return (
    <div>
      <div className={styles.tabs} role="tablist" aria-label="One Seat">
        {SEAT_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`seat-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`seat-panel-${item.id}`}
            className={tab === item.id ? styles.tabOn : styles.tab}
            onClick={() => selectTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {reply ? <HonestyLegend active={honesty} note={reply} /> : null}

      {tab === 'missing' ? (
        <div role="tabpanel" id="seat-panel-missing" aria-labelledby="seat-tab-missing">
          <p className={styles.eyebrow}>STEP 1 · WHAT’S MISSING</p>
          <p className={styles.note}>
            Gmail is not connected. Drive is not connected. A photo, a PDF, or chat is the paper. Folders stay Missing. No invented $.
          </p>
          {sample}
          {papers}
        </div>
      ) : null}

      {tab === 'invoices' ? (
        <div role="tabpanel" id="seat-panel-invoices" aria-labelledby="seat-tab-invoices">
          <p className={styles.eyebrow}>STEP 2 · INVOICE DRIFT</p>
          <p className={styles.note}>
            Same vendor, same SKU, same pack. Paste text or drop a PDF. HEIC stays Missing. A price change is not recovered cash.
          </p>
          {invoices}
        </div>
      ) : null}

      {tab === 'labor' ? (
        <div role="tabpanel" id="seat-panel-labor" aria-labelledby="seat-tab-labor">
          <article className={styles.card}>
            <p className={styles.eyebrow}>STEP 3 · LABOR</p>
            <h2>Labor</h2>
            <p>
              Scheduled {GOLD_LABOR.scheduledHours.toFixed(2)} h → clocked {GOLD_LABOR.clockedHours.toFixed(2)} h.
              Sample ${GOLD_LABOR.sampleDollars}. Fictional.
            </p>
            <HonestyLegend
              demo
              active="Estimated"
              note="Demo · Estimated. Fictional sample hours and dollars. A missing punch stays Missing — not $0."
            />
            <p className={styles.note}>{GOLD_LABOR.claimBoundary}</p>
            <Link className={styles.secondary} href={ONE_SEAT_PATHS.tryLabor}>Open the labor sample</Link>
          </article>
        </div>
      ) : null}

      {tab === 'menu' ? (
        <div role="tabpanel" id="seat-panel-menu" aria-labelledby="seat-tab-menu">
          <article className={styles.card}>
            <p className={styles.eyebrow}>STEP 3 · MENU</p>
            <h2>Menu</h2>
            <p>
              Plate {money(GOLD_RECIPE.plateCost)} on menu {money(GOLD_RECIPE.menuPrice)}. Sample food cost {pctLabel(GOLD_RECIPE.foodCostPct)}.
            </p>
            <HonestyLegend
              demo
              active="Estimated"
              note="Demo · Estimated. Fictional plate math. No count stays Missing. Invoice ≠ COGS."
            />
            <p className={styles.note}>{GOLD_RECIPE.claimBoundary}</p>
            <Link className={styles.secondary} href={ONE_SEAT_PATHS.tryRecipes}>Open the plate sample</Link>
          </article>
        </div>
      ) : null}

      {tab === 'ask' ? (
        <div role="tabpanel" id="seat-panel-ask" aria-labelledby="seat-tab-ask">
          <p className={styles.eyebrow}>STEP 4 · ASK</p>
          <p className={styles.note}>A typed dollar is Estimated. It is not a SKU price. No invented $.</p>
          <form onSubmit={onAsk} className={styles.grid}>
            <label>
              Ask Never86’d
              <input
                className={styles.line}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Invoice, labor, menu, or what is Missing"
                maxLength={240}
                aria-label="Ask Never86'd"
              />
            </label>
            <button type="submit" className={styles.primary}>Ask</button>
          </form>
          {ask}
        </div>
      ) : null}
    </div>
  );
}
