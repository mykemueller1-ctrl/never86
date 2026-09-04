import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CTAP_LAB_PACK_STATUS,
  CTAP_LAB_STATION_SEATS,
  CTAP_VENDOR_CADENCE_RULES,
} from '@/lib/ctapLabPack';

export const metadata: Metadata = {
  title: "Communities — open play seat for every operator | Never 86'd",
  description:
    'Any operator can open this community play seat now: owner desk, Action Shift, and station-seat lab templates. One location free. No private numbers, PINs, or staff names.',
};

const PLAY_DOORS = [
  {
    href: '/',
    label: 'Open play desk',
    body: 'never86.ai front door. Pain → POS email/photo → one Action Shift. Community Tap holds seat 1. Any operator can play — no login.',
    primary: true,
  },
  {
    href: '/operator',
    label: 'Owner desk',
    body: 'Phone-first play seat. Ask FOH, BOH, schedule, vendor, merchant. Sample answers only — no invented close.',
    primary: true,
  },
  {
    href: '/action-shift',
    label: 'Action Shift seats',
    body: 'Yesterday → one next action → night proof. Free owner seat shape + seat map.',
    primary: false,
  },
  {
    href: '/action-shift/lab',
    label: 'Station seat lab',
    body: 'Wall-doc checklists for owner, FOH, kitchen, bar, server, prep, driver, line, pizza, dish.',
    primary: false,
  },
] as const;

const KEEP_DOORS = [
  {
    href: '/trial',
    label: 'Claim your free owner seat',
    body: 'Same play loop, but your email keeps the seat. One location free. Extra seats paid.',
  },
  {
    href: '/login',
    label: 'Operator login',
    body: 'Email-only link when you want memory and return visits. No password. No portal login.',
  },
] as const;

export default function CommunitiesPage() {
  const vendorDays = Array.from(new Set(CTAP_VENDOR_CADENCE_RULES.map((rule) => rule.weekday)));

  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <Link href="/" className="flex items-start gap-4 group">
            <span className="compass-mark">N</span>
            <span>
              <p className="font-serif text-[24px] leading-none text-ink-800">
                Never 86&apos;d <span className="italic text-ink-600">· communities</span>
              </p>
              <p className="compass-eyebrow-dim mt-2">Open play seat · every operator · one location free</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px] flex-wrap">
            <Link
              href="/"
              className="btn-primary"
              style={{ background: '#0066ff' }}
            >
              Play now →
            </Link>
            <Link href="/login" className="btn-secondary" style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}>
              Sign in
            </Link>
          </nav>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-14 md:pt-20 pb-10">
        <p className="compass-eyebrow mb-4">— Open to every operator</p>
        <h1 className="compass-display text-5xl md:text-6xl mb-4">
          Play the community <em>seat</em>
        </h1>
        <p className="compass-body text-[16px] md:text-[17px]" style={{ color: '#6e6e73', maxWidth: 560 }}>
          Same shape we run in the Community Tap lab — owner desk, Action Shift, station seats —
          opened for any restaurant operator right now. No invite code. No portal password. Public-safe
          sample only: no private dollars, PINs, or staff names.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/" className="btn-primary" style={{ background: '#0066ff' }}>
            Start playing →
          </Link>
          <Link
            href="/action-shift"
            className="btn-secondary"
            style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}
          >
            Run Action Shift
          </Link>
          <Link
            href="/trial"
            className="btn-secondary"
            style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}
          >
            Keep a free seat
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-14">
        <div className="compass-card">
          <p className="compass-card-label">What you get</p>
          <p className="font-serif text-[22px] text-ink-800 mt-1">
            Shared play community · lab pack {CTAP_LAB_PACK_STATUS}
          </p>
          <p className="text-[14px] mt-2" style={{ color: '#86868b' }}>
            Play first. Claim the free owner seat when you want the loop to remember you. Manager and
            station seats stay paid expansions. Staff live issuance stays blocked.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-[#e8e8ed]">
            <div>
              <dt className="compass-card-label">Login to play</dt>
              <dd className="font-serif text-[28px] text-ink-800 mt-1">No</dd>
            </div>
            <div>
              <dt className="compass-card-label">Station seats</dt>
              <dd className="font-serif text-[28px] text-ink-800 mt-1">{CTAP_LAB_STATION_SEATS.length}</dd>
            </div>
            <div>
              <dt className="compass-card-label">Vendor cadence days</dt>
              <dd className="font-serif text-[28px] text-ink-800 mt-1">{vendorDays.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-14">
        <p className="compass-eyebrow mb-3">— Play doors</p>
        <h2 className="compass-display text-3xl mb-6">Go in and try it</h2>
        <div className="space-y-3">
          {PLAY_DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className="block compass-card hover:border-[#0066ff] transition-colors"
            >
              <p className="font-serif text-[20px] text-ink-800">
                {door.label}
                {door.primary ? <span className="italic text-ink-600"> · open now</span> : null}
              </p>
              <p className="text-[14px] mt-1" style={{ color: '#86868b' }}>
                {door.body}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-14">
        <p className="compass-eyebrow mb-3">— Station seats</p>
        <h2 className="compass-display text-3xl mb-6">Floor map every operator can open</h2>
        <ul className="space-y-3">
          {CTAP_LAB_STATION_SEATS.map((seat) => (
            <li
              key={seat.seatKey}
              className="flex items-baseline justify-between gap-4 py-3 border-b border-[#e8e8ed]"
            >
              <span className="font-serif text-[20px] text-ink-800">{seat.label}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: '#86868b' }}>
                {seat.stations.join(' · ')}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[13px] mt-4" style={{ color: '#86868b' }}>
          Titles and stations only. Not a live roster. POS ≠ payout. Incomplete week stays Open.
        </p>
        <Link
          href="/action-shift/lab"
          className="inline-block mt-5 text-[14px] underline"
          style={{ color: '#0066ff' }}
        >
          Open the full station checklist lab →
        </Link>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <p className="compass-eyebrow mb-3">— Keep it</p>
        <h2 className="compass-display text-3xl mb-6">When you want your own seat</h2>
        <div className="space-y-3">
          {KEEP_DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className="block compass-card hover:border-[#0066ff] transition-colors"
            >
              <p className="font-serif text-[20px] text-ink-800">{door.label}</p>
              <p className="text-[14px] mt-1" style={{ color: '#86868b' }}>
                {door.body}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
