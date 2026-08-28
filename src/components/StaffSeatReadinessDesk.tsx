'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN,
  STATION_SEAT_KEYS,
  capabilitiesForSeat,
  inviteStaffSeat,
  provePrivilegedShiftItem,
  resetStaffSeat,
  revokeStaffSeat,
  staffSeatKind,
  type StaffDirectory,
} from '@/lib/staffSeatAuth';
import {
  SYNTHETIC_OPERATOR_A_ID,
  SYNTHETIC_OPERATOR_B_ID,
  SYNTHETIC_STAFF_ROSTER,
  SYNTHETIC_STAFF_SCHEDULE,
  buildSyntheticStaffDirectory,
  syntheticActor,
  syntheticSeatId,
} from '@/lib/staffSeatFixtures';
import { StaffRoleDayDesk } from '@/components/StaffRoleDayDesk';

const NOW = '2026-08-24T16:00:00.000-05:00';
const EXPIRES = '2026-08-25T16:00:00.000-05:00';

export function StaffSeatReadinessDesk({ signedInOperatorId }: { signedInOperatorId?: number }) {
  const [directory, setDirectory] = useState<StaffDirectory>(() => buildSyntheticStaffDirectory());
  const [message, setMessage] = useState<string>('Synthetic desk only. Live issuance blocked. No mail sent.');
  const actor = useMemo(
    () => syntheticActor(SYNTHETIC_OPERATOR_A_ID, 'owner'),
    [],
  );

  function run(label: string, next: ReturnType<typeof inviteStaffSeat> | ReturnType<typeof revokeStaffSeat> | ReturnType<typeof provePrivilegedShiftItem>) {
    setDirectory(next.directory);
    setMessage(next.ok ? `${label}: ${next.receipt.reason}` : `${label} denied: ${next.error}`);
  }

  const tenantA = directory.seats.filter((seat) => seat.operatorId === SYNTHETIC_OPERATOR_A_ID);
  const receipts = [...directory.receipts].slice(-8).reverse();

  return (
    <div className="min-h-screen bg-[#0c1210] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-white/45">
          <Link href="/staff/desk" className="hover:text-white">← Staff desk</Link>
          <Link href="/staff/login" className="hover:text-white">Staff login</Link>
          <Link href="/login" className="hover:text-white">Owner login</Link>
          <Link href="/dashboard/staff" className="hover:text-white">Signed desk</Link>
        </nav>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-200">
          Staff seats · drafted · live issuance blocked
          {signedInOperatorId ? ` · signed operator ${signedInOperatorId}` : ' · public synthetic fixture'}
        </p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
          Manager-first seats. Tenant line. No live credentials.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          Owner (Myke), FOH manager (Kenzy), kitchen manager (Tom), bartender, server, prep, driver, line cook, pizza, and dishwasher
          are station seats. Kenzy is FOH only. Tom owns kitchen and drivers. Myke owns the drawer and the bank.
          The current /login credential still grants full operator access and stays owner-only. This desk proves
          least privilege and invite / reset / revoke receipts on synthetic operators 101 and 202 only.
        </p>
        <p className="mt-3 text-sm text-amber-100/80">{message}</p>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {STATION_SEAT_KEYS.map((seatKey) => (
            <article key={seatKey} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                {staffSeatKind(seatKey)} seat
              </p>
              <h2 className="mt-1 font-semibold capitalize">{seatKey.replaceAll('_', ' ')}</h2>
              <p className="mt-2 text-xs text-white/50">
                {capabilitiesForSeat(seatKey).join(' · ') || 'no privileged capabilities'}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-10">
          <StaffRoleDayDesk />
        </div>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-semibold">Synthetic roster · operator {SYNTHETIC_OPERATOR_A_ID}</h2>
          <p className="mt-2 text-xs text-white/45">Example labels only. No live names, PINs, phones, or schedules.</p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {tenantA.map((seat) => (
              <li key={seat.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2">
                <span>{seat.label} · {seat.seatKey.replaceAll('_', ' ')}</span>
                <span className="text-xs uppercase tracking-wider text-white/45">{seat.credentialState}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-semibold">Synthetic schedule · 2026-08-24</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {SYNTHETIC_STAFF_SCHEDULE.filter((row) => row.externalShiftId.includes(String(SYNTHETIC_OPERATOR_A_ID))).map((row) => (
              <li key={row.externalShiftId}>
                {row.station} · {row.startsAt.slice(11, 16)}–{row.endsAt.slice(11, 16)} · {row.externalWorkerId}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:border-white/40"
            onClick={() => run('Invite FOH manager', inviteStaffSeat({
              directory,
              actor,
              targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
              now: NOW,
              expiresAt: EXPIRES,
            }))}
          >
            Invite FOH manager
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:border-white/40"
            onClick={() => run('Reset FOH manager', resetStaffSeat({
              directory,
              actor,
              targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'foh_manager'),
              now: NOW,
              expiresAt: EXPIRES,
            }))}
          >
            Reset FOH manager
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:border-white/40"
            onClick={() => run('Revoke bartender', revokeStaffSeat({
              directory,
              actor,
              targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'bartender'),
              now: NOW,
            }))}
          >
            Revoke bartender
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-400/30 px-3 py-2 text-xs text-red-100 hover:border-red-200"
            onClick={() => run('Cross-tenant invite', inviteStaffSeat({
              directory,
              actor,
              targetSeatId: syntheticSeatId(SYNTHETIC_OPERATOR_B_ID, 'foh_manager'),
              now: NOW,
              expiresAt: EXPIRES,
            }))}
          >
            Invite operator {SYNTHETIC_OPERATOR_B_ID} (must deny)
          </button>
          <button
            type="button"
            className="rounded-lg border border-amber-300/40 px-3 py-2 text-xs text-amber-100 hover:border-amber-200"
            onClick={() => run('Verbal cash close', provePrivilegedShiftItem({
              directory,
              actor,
              target: {
                operatorId: SYNTHETIC_OPERATOR_A_ID,
                locationId: 11,
                seatId: syntheticSeatId(SYNTHETIC_OPERATOR_A_ID, 'owner'),
                family: 'cash',
              },
              outcome: 'verified',
              proofKind: 'verbal',
              now: NOW,
            }))}
          >
            Verbal yes on cash (must deny)
          </button>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-semibold">Audit receipts</h2>
          {receipts.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">No receipts yet. Run an invite, reset, revoke, or denied prove.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {receipts.map((receipt) => (
                <li key={receipt.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                    {receipt.action} · {receipt.outcome} · mail {String(receipt.mailSent)}
                  </p>
                  <p className="mt-2 text-white/80">{receipt.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200/20 bg-amber-200/[0.04] p-5">
          <h2 className="font-semibold text-amber-100">Stop. Private inputs still needed before any real login.</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-white/75">
            {PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN.map((item) => (
              <li key={item.id}>
                <span className="font-mono text-xs text-amber-100/80">{item.id}</span>
                <p className="mt-1">{item.what}</p>
                <p className="mt-1 text-xs text-white/40">{item.destination}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-white/40">
            {SYNTHETIC_STAFF_ROSTER.length} synthetic roster rows across two tenants. Zero live CTap identities.
          </p>
        </section>
      </div>
    </div>
  );
}
