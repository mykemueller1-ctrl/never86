'use client';

import { useMemo, useState } from 'react';
import { STAFF_ROLE_DAY_WEEKDAYS } from '@/lib/staffRoleDayPack';
import {
  STAFF_SCHEDULE_STATUS,
  availabilityVisibleTo,
  buildStaffScheduleDesk,
  decideApproval,
  needsApprovalInbox,
  setStandingAvailability,
  submitSwapOrCover,
  submitTimeOff,
  type StaffStandingAvailability,
  type StaffSwapCoverRequest,
  type StaffTimeOffKind,
  type StaffTimeOffRequest,
} from '@/lib/staffScheduleDesk';
import type { StationSeatKey } from '@/lib/staffSeatAuth';

export function StaffScheduleDesk({
  seatKey,
  weekday,
  onWeekday,
}: {
  seatKey: StationSeatKey;
  weekday: (typeof STAFF_ROLE_DAY_WEEKDAYS)[number];
  onWeekday: (day: (typeof STAFF_ROLE_DAY_WEEKDAYS)[number]) => void;
}) {
  const schedule = useMemo(
    () => buildStaffScheduleDesk({ seatKey, weekday }),
    [seatKey, weekday],
  );
  const [timeOff, setTimeOff] = useState<StaffTimeOffRequest[]>([]);
  const [swaps, setSwaps] = useState<StaffSwapCoverRequest[]>([]);
  const [availability, setAvailability] = useState<StaffStandingAvailability[]>([]);
  const [offKind, setOffKind] = useState<StaffTimeOffKind>('full_day');
  const [offWindow, setOffWindow] = useState('11:00–13:00');
  const [offNote, setOffNote] = useState('');
  const [coverKind, setCoverKind] = useState<'swap' | 'cover'>('cover');
  const [coverNote, setCoverNote] = useState('');
  const [flash, setFlash] = useState('');

  const visibleAvailability = availabilityVisibleTo(seatKey, availability);
  const inbox = needsApprovalInbox({ seatKey, timeOff, swaps });
  const ownTimeOff = timeOff.filter((row) => row.fromSeatKey === seatKey);
  const ownSwaps = swaps.filter((row) => row.fromSeatKey === seatKey);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-emerald-200/20 bg-emerald-200/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">
          Schedule · {STAFF_SCHEDULE_STATUS} · not live
        </p>
        <h3 className="mt-1 font-medium">Week strip · slots, not people</h3>
        <p className="mt-2 text-sm text-white/60">
          Coverage counts only. No invented names. Weekday 11–1 is an unnamed driver slot.
          Bar-week extras sit on the selected day as station slots. Time off, swap, and cover stay in-app. No mail.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-7">
          {schedule.weekStrip.map((day) => (
            <button
              key={day.weekday}
              type="button"
              className={`rounded-xl border px-3 py-3 text-left ${
                weekday === day.weekday
                  ? 'border-emerald-200 text-emerald-100'
                  : 'border-white/15 text-white/70 hover:border-white/40'
              }`}
              onClick={() => onWeekday(day.weekday)}
            >
              <p className="text-[11px] uppercase tracking-[0.12em]">{day.weekday.slice(0, 3)}</p>
              <p className="mt-1 text-xs text-white/50">{day.date.slice(5)}</p>
              <p className="mt-2 text-[11px] leading-snug text-emerald-100/80">{day.barWeekShortLabel}</p>
              <p className="mt-1 text-[11px] leading-snug text-white/70">{day.summary}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">My shifts · {schedule.date}</p>
          <h3 className="mt-1 font-medium">{schedule.myShifts[0]?.stationLabel ?? 'No counted floor slot'}</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {schedule.myShifts.length === 0 ? (
              <li className="text-white/45">
                {seatKey === 'owner' || seatKey === 'foh_manager' || seatKey === 'kitchen_manager'
                  ? 'Lead desk. Floor coverage is slots below — not a named person.'
                  : 'No counted slot on this weekday.'}
              </li>
            ) : (
              schedule.myShifts.map((shift) => (
                <li key={shift.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                    {shift.weekday} · {shift.daypart.replaceAll('_', ' ')} · unnamed
                  </p>
                  <p className="mt-1">{shift.slotLabel}</p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Coverage counts · no names</p>
          <h3 className="mt-1 font-medium">{weekday} board</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {schedule.coverage.map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                <span>{row.slotLabel}</span>
                <span className="text-emerald-100">{row.slotsNeeded}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-lime-200/20 bg-lime-200/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-lime-100/80">
          Bar week extras · {schedule.barWeekShortLabel} · slots, not names
        </p>
        <h3 className="mt-1 font-medium">{weekday} extras</h3>
        <p className="mt-2 text-sm text-white/60">
          CTap bar-week extras for this weekday. Station slots only. Never a roster name.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-white/75">
          {schedule.barWeekExtras.map((extra) => (
            <li key={extra.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                {extra.slotLabel} · unnamed
              </p>
              <p className="mt-1">{extra.item}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Time Off · inside Schedule</p>
          {schedule.requestOff ? (
            <>
              <h3 className="mt-1 font-medium">
                {schedule.requestOff.house === 'foh' ? 'FOH' : 'BOH / drivers'} → {schedule.requestOff.routedTo} ({schedule.requestOff.routedRoleTitle})
              </h3>
              <p className="mt-2 text-sm text-white/60">Full or partial day. Date from the week strip. Note required. Dollars never.</p>
              <form
                className="mt-4 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const result = submitTimeOff({
                    requests: timeOff,
                    fromSeatKey: seatKey,
                    kind: offKind,
                    weekday,
                    window: offKind === 'partial_day' ? offWindow : null,
                    note: offNote,
                    at: new Date().toISOString(),
                  });
                  if (!result.ok) {
                    setFlash(result.error);
                    return;
                  }
                  setTimeOff(result.requests);
                  setOffNote('');
                  setFlash(`Time off routed to ${result.posted.routedTo}. Needs Approval. Mail sent: false.`);
                }}
              >
                <div className="flex flex-wrap gap-2">
                  {(['full_day', 'partial_day'] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-xs ${
                        offKind === kind ? 'border-emerald-200 text-emerald-100' : 'border-white/15 text-white/70'
                      }`}
                      onClick={() => setOffKind(kind)}
                    >
                      {kind === 'full_day' ? 'Full day' : 'Partial day'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/45">Date {schedule.date} · {weekday}</p>
                {offKind === 'partial_day' ? (
                  <input
                    value={offWindow}
                    onChange={(event) => setOffWindow(event.target.value)}
                    placeholder="11:00–13:00"
                    className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30"
                  />
                ) : null}
                <textarea
                  value={offNote}
                  onChange={(event) => setOffNote(event.target.value)}
                  rows={3}
                  placeholder="Note. No dollars."
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30"
                />
                <button type="submit" className="rounded-xl border border-white/20 px-4 py-2 text-xs uppercase tracking-wider">
                  Send in-app to {schedule.requestOff.routedTo}
                </button>
              </form>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/60">Owner does not request time off on this desk. Dollars never.</p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {ownTimeOff.map((row) => (
              <li key={row.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                  {row.kind.replaceAll('_', ' ')} · {row.date} · {row.status.replaceAll('_', ' ')} · mail {String(row.mailSent)}
                </p>
                <p className="mt-1">{row.note}{row.window ? ` · ${row.window}` : ''}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Swap / cover · same house · same seat</p>
          <h3 className="mt-1 font-medium">Slots in this station only. No named counterpart.</h3>
          {schedule.requestOff ? (
            <form
              className="mt-4 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                const result = submitSwapOrCover({
                  requests: swaps,
                  kind: coverKind,
                  fromSeatKey: seatKey,
                  counterpartSeatKey: seatKey,
                  weekday,
                  note: coverNote,
                  at: new Date().toISOString(),
                });
                if (!result.ok) {
                  setFlash(result.error);
                  return;
                }
                setSwaps(result.requests);
                setCoverNote('');
                setFlash(`${result.posted.kind} routed to ${result.posted.routedTo}. Needs Approval. Mail sent: false.`);
              }}
            >
              <div className="flex flex-wrap gap-2">
                {(['cover', 'swap'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      coverKind === kind ? 'border-emerald-200 text-emerald-100' : 'border-white/15 text-white/70'
                    }`}
                    onClick={() => setCoverKind(kind)}
                  >
                    {kind}
                  </button>
                ))}
              </div>
              <textarea
                value={coverNote}
                onChange={(event) => setCoverNote(event.target.value)}
                rows={3}
                placeholder="Which slot. Same seat. No names. No dollars."
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
              <button type="submit" className="rounded-xl border border-white/20 px-4 py-2 text-xs uppercase tracking-wider">
                Send {coverKind} in-app
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-white/60">Owner does not swap or cover a floor slot on this desk.</p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {ownSwaps.map((row) => (
              <li key={row.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                  {row.kind} · {row.fromSeatKey.replaceAll('_', ' ')} seat · {row.date} · {row.status.replaceAll('_', ' ')}
                </p>
                <p className="mt-1">{row.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Standing availability</p>
        <h3 className="mt-1 font-medium">This station’s windows. Not a roster name.</h3>
        {seatKey === 'owner' ? (
          <p className="mt-2 text-sm text-white/60">Owner desk does not post standing availability on the floor board.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {(['day', 'night', 'weekday_11_1'] as const).map((window) => {
              const current = visibleAvailability.find(
                (row) => row.seatKey === seatKey && row.weekday === weekday && row.window === window,
              );
              return (
                <button
                  key={window}
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    current?.available ? 'border-emerald-200 text-emerald-100' : 'border-white/15 text-white/70'
                  }`}
                  onClick={() => {
                    const result = setStandingAvailability({
                      rows: availability,
                      seatKey,
                      weekday,
                      window,
                      available: !current?.available,
                    });
                    if (!result.ok) {
                      setFlash(result.error);
                      return;
                    }
                    setAvailability(result.rows);
                    setFlash(`${result.posted.stationLabel} · ${weekday} · ${window.replaceAll('_', ' ')} · ${result.posted.available ? 'available' : 'not available'}.`);
                  }}
                >
                  {window.replaceAll('_', ' ')} · {current?.available ? 'available' : 'off'}
                </button>
              );
            })}
          </div>
        )}
        <ul className="mt-4 space-y-2 text-sm text-white/75">
          {visibleAvailability.map((row) => (
            <li key={row.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
              {row.stationLabel} · {row.weekday} · {row.window.replaceAll('_', ' ')} · {row.available ? 'available' : 'off'}
            </li>
          ))}
        </ul>
      </div>

      {schedule.canSeeNeedsApprovalInbox ? (
        <div className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.04] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-100/80">Needs Approval · manager inbox</p>
          <p className="mt-2 text-sm text-white/60">
            Owner sees the house. FOH lead sees FOH. Kitchen lead sees BOH. Station labels only. Crew does not decide this.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {inbox.length === 0 ? (
              <li className="text-white/45">No pending time off, swap, or cover in this house.</li>
            ) : (
              inbox.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                    {item.kind.replaceAll('_', ' ')} · {item.fromSeatKey.replaceAll('_', ' ')} · {item.date} → {item.routedTo}
                  </p>
                  <p className="mt-1">{item.note}</p>
                  <div className="mt-3 flex gap-2">
                    {(['approved', 'denied'] as const).map((decision) => (
                      <button
                        key={decision}
                        type="button"
                        className="rounded-lg border border-white/20 px-3 py-1 text-xs uppercase tracking-wider"
                        onClick={() => {
                          const result = decideApproval({
                            managerSeatKey: seatKey,
                            itemId: item.id,
                            decision,
                            timeOff,
                            swaps,
                          });
                          if (!result.ok) {
                            setFlash(result.error);
                            return;
                          }
                          setTimeOff(result.timeOff);
                          setSwaps(result.swaps);
                          setFlash(`Marked ${decision}. Mail sent: false.`);
                        }}
                      >
                        {decision}
                      </button>
                    ))}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-white/35">Needs Approval is a manager inbox. You see your own requests above, not the house queue.</p>
      )}

      {flash ? <p className="text-sm text-amber-100/80">{flash}</p> : null}
    </section>
  );
}
