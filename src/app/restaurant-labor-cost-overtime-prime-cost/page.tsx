import type { Metadata } from 'next';
import Link from 'next/link';
import { HonestyLegend } from '@/components/HonestyLegend';
import { OneSeatPublicShell, oneSeatStyles as styles } from '@/components/OneSeatPublicShell';
import { LABOR_CAPTURE } from '@/lib/captureLandings';
import { GOLD_LABOR } from '@/lib/oneSeatPublicWin';
import { LAST_WEEK_PRIME_FAMILIES } from '@/lib/lastWeekPrimeCost';
import { ONE_SEAT_PATHS } from '@/lib/selectedSites';

export const metadata: Metadata = {
  title: `${LABOR_CAPTURE.title} | Never86’d One Seat`,
  description: LABOR_CAPTURE.description,
  alternates: { canonical: LABOR_CAPTURE.canonical },
  openGraph: {
    title: LABOR_CAPTURE.title,
    description: LABOR_CAPTURE.description,
    url: LABOR_CAPTURE.canonical,
  },
};

const PRIME_FAMILIES = [
  ['Week sales', 'Missing until the same-store week sales paper lands. Incomplete week stays Open.'],
  ['Labor', 'Missing until same-week labor dollars exist. Hours are not labor dollars.'],
  ['Food', 'Missing until period food COGS exists. Invoice ≠ COGS. No count → Missing.'],
  ['Pop / liquor / beer', 'Missing until period beverage COGS exists.'],
] as const;

export default function RestaurantLaborPrimeCostPage() {
  return (
    <OneSeatPublicShell eyebrow={LABOR_CAPTURE.eyebrow} title={LABOR_CAPTURE.title} lede={LABOR_CAPTURE.geo}>
      <HonestyLegend
        active="Missing"
        note="Honesty labels only: Verified, Estimated, or Missing. A missing punch stays Missing, not zero. Prime cost stays Missing until the papers land. We do not invent “you’ll hit 65%.”"
      />
      <div className={styles.actions}>
        <Link className={styles.primary} href={ONE_SEAT_PATHS.checkLabor}>
          Open Labor Drift Catcher
        </Link>
        <Link className={styles.secondary} href={ONE_SEAT_PATHS.tryLabor}>
          See the labor sample
        </Link>
        <Link className={styles.ghost} href={ONE_SEAT_PATHS.onboard}>
          Claim free owner seat
        </Link>
      </div>

      <article className={styles.card}>
        <p className={styles.eyebrow}>LONG SHIFTS · SILENCE BETWEEN PAPER AND POS</p>
        <h2>The posted schedule and the clock have to meet before payroll closes.</h2>
        <p className={styles.note}>
          Overtime drift is clocked duration minus scheduled duration, and never less than zero.
          Early clock-in and late clock-out stay labeled until both papers exist.
        </p>
        <HonestyLegend
          active="Missing"
          note="No matching clock yet stays Missing. Matching live clock and schedule become Verified. A disclosed sample stays Estimated."
        />
      </article>

      <article className={styles.card}>
        <p className={styles.eyebrow}>FICTIONAL SAMPLE · HOURS ONLY</p>
        <div className={styles.prices}>
          <div>
            <small>Scheduled</small>
            <strong>{GOLD_LABOR.scheduledHours.toFixed(2)} h</strong>
          </div>
          <span>→</span>
          <div>
            <small>Clocked</small>
            <strong>{GOLD_LABOR.clockedHours.toFixed(2)} h</strong>
          </div>
        </div>
        <div className={styles.delta}>
          <strong>+{GOLD_LABOR.driftHours.toFixed(2)} h</strong>
          <b>hours, not dollars</b>
        </div>
        <HonestyLegend
          active="Estimated"
          note="Estimated fictional hours. Honesty label only. A missing punch stays Missing. Matching live clock and schedule become Verified."
        />
        <div className={styles.next}>
          <small>YOUR NEXT MOVE</small>
          <p>{GOLD_LABOR.nextMove}</p>
        </div>
        <p className={styles.note}>
          Fictional sample hours. Clock ≠ schedule until both papers exist. Honesty labels only. Not recovered cash.
        </p>
      </article>

      <article className={styles.card}>
        <p className={styles.eyebrow}>PRIME COST VIEW · HONESTY FIRST</p>
        <h2>Load sales, labor, food, and beverage. Label the gaps. Do not invent the band.</h2>
        <p className={styles.note}>{LABOR_CAPTURE.primeBandNote}</p>
        <HonestyLegend
          active="Missing"
          note="Prime cost stays Missing until every same-week family has a dollar. Honesty labels only. We do not invent the percent."
        />
        <ul className={styles.list}>
          {PRIME_FAMILIES.map(([label, detail]) => (
            <li key={label}>
              <strong>{label} · Missing.</strong> {detail}
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          {LAST_WEEK_PRIME_FAMILIES.length} families. Use the owner seat inputs on /operator after the clock check.
        </p>
        <div className={styles.actions}>
          <Link className={styles.secondary} href={ONE_SEAT_PATHS.operator}>
            Open prime-cost inputs
          </Link>
        </div>
      </article>

      <article className={styles.card}>
        <p className={styles.eyebrow}>WHAT THIS IS NOT</p>
        <ul className={styles.list}>
          {LABOR_CAPTURE.kill.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>

      <div className={styles.grid}>
        {LABOR_CAPTURE.related.map((link) => (
          <Link key={link.href} className={styles.tile} href={link.href}>
            <strong>RELATED</strong>
            {link.label}
          </Link>
        ))}
      </div>
    </OneSeatPublicShell>
  );
}
