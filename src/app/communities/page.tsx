import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CTAP_LAB_PACK_STATUS,
  CTAP_LAB_STATION_SEATS,
  CTAP_VENDOR_CADENCE_RULES,
} from '@/lib/ctapLabPack';

export const metadata: Metadata = {
  title: "Communities — Community Tap lab door | Never 86'd",
  description:
    'Public-safe Community Tap door: one free owner seat, station seats, Action Shift lab templates, and operator login. No private numbers, PINs, or staff names.',
};

const DOORS = [
  {
    href: '/login',
    label: 'Operator login',
    body: 'Email-only link. Opens your workspace — no password, no portal login.',
    primary: true,
  },
  {
    href: '/action-shift/lab',
    label: 'CTap lab templates',
    body: 'Station checklists from the wall docs. Templates only — not live payroll.',
    primary: false,
  },
  {
    href: '/staff/seats',
    label: 'Staff seats',
    body: 'Manager-first seat map on synthetic fixtures. Live issuance stays blocked.',
    primary: false,
  },
  {
    href: '/trial',
    label: 'Free owner seat',
    body: 'One location + one seat free. Extra seats and locations are paid.',
    primary: false,
  },
  {
    href: '/people',
    label: 'People platform',
    body: 'Shift Pulse and crew tools. Product 02 — waitlist, not live roster.',
    primary: false,
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
              <p className="compass-eyebrow-dim mt-2">One location · one seat free · receipt attached</p>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href="/login" className="btn-primary" style={{ background: '#0066ff' }}>
              Sign in →
            </Link>
          </nav>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-10">
        <p className="compass-eyebrow mb-4">— Reference community</p>
        <h1 className="compass-display text-5xl md:text-6xl mb-4">
          Community Tap <em>lab</em>
        </h1>
        <p className="compass-body text-[16px] md:text-[17px]" style={{ color: '#6e6e73', maxWidth: 540 }}>
          Fort Dodge proof store for Never 86&apos;d. Public door only — station seats and schedule rules.
          No private dollars, PINs, staff names, or live credentials on this page.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/login" className="btn-primary" style={{ background: '#0066ff' }}>
            Open operator login →
          </Link>
          <Link
            href="/action-shift/lab"
            className="btn-secondary"
            style={{ background: 'transparent', borderColor: '#d2d2d7', color: '#1d1d1f' }}
          >
            See lab templates
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-14">
        <div className="compass-card">
          <p className="compass-card-label">Status</p>
          <p className="font-serif text-[22px] text-ink-800 mt-1">
            Lab pack · {CTAP_LAB_PACK_STATUS}
          </p>
          <p className="text-[14px] mt-2" style={{ color: '#86868b' }}>
            Owner seat is the free seat. Manager and station seats are paid expansions. Staff live issuance
            is blocked until an approved activation migration ships.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-[#e8e8ed]">
            <div>
              <dt className="compass-card-label">Locations shown</dt>
              <dd className="font-serif text-[28px] text-ink-800 mt-1">1</dd>
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
        <p className="compass-eyebrow mb-3">— Station seats</p>
        <h2 className="compass-display text-3xl mb-6">Who works the floor map</h2>
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
          Titles only. Not a live roster. POS ≠ payout. Incomplete week stays Open.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <p className="compass-eyebrow mb-3">— Doors</p>
        <h2 className="compass-display text-3xl mb-6">Where to go next</h2>
        <div className="space-y-3">
          {DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className="block compass-card hover:border-[#0066ff] transition-colors"
            >
              <p className="font-serif text-[20px] text-ink-800">
                {door.label}
                {door.primary ? <span className="italic text-ink-600"> · start here</span> : null}
              </p>
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
