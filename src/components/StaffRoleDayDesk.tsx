'use client';

import { useMemo, useState } from 'react';
import {
  STAFF_ROLE_DAY_PACK_STATUS,
  STAFF_ROLE_DAY_WEEKDAYS,
  buildStaffRoleDayDesk,
  storeWeekdayToday,
  type StaffRoleDayView,
} from '@/lib/staffRoleDayPack';
import { STATION_SEAT_KEYS, type StationSeatKey } from '@/lib/staffSeatAuth';
import { OWNER_YESTERDAY_CLOSE_DATES, ownerYesterdayCloseStrip } from '@/lib/yesterdayClosePack';

const VIEWS: readonly StaffRoleDayView[] = ['today', 'open', 'close'];

export function StaffRoleDayDesk({
  initialSeatKey = 'foh_manager',
  initialWeekday,
}: {
  initialSeatKey?: StationSeatKey;
  initialWeekday?: (typeof STAFF_ROLE_DAY_WEEKDAYS)[number];
}) {
  const [seatKey, setSeatKey] = useState<StationSeatKey>(initialSeatKey);
  const [weekday, setWeekday] = useState<(typeof STAFF_ROLE_DAY_WEEKDAYS)[number]>(
    initialWeekday ?? storeWeekdayToday(),
  );
  const [view, setView] = useState<StaffRoleDayView>('today');

  const desk = useMemo(
    () => buildStaffRoleDayDesk({ seatKey, weekday, view }),
    [seatKey, weekday, view],
  );
  const ownerCloses = useMemo(
    () => {
      if (seatKey !== 'owner') return [];
      return OWNER_YESTERDAY_CLOSE_DATES
        .map((date) => ownerYesterdayCloseStrip(date))
        .filter((row): row is NonNullable<ReturnType<typeof ownerYesterdayCloseStrip>> => row != null);
    },
    [seatKey],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-amber-200">
        Role-day desk · {STAFF_ROLE_DAY_PACK_STATUS} · today by role
      </p>
      <h2 className="mt-2 font-semibold">{desk.stationLabel} · {desk.weekday}</h2>
      <p className="mt-2 text-sm text-white/60">
        Today&apos;s checklist, coverage/schedule board, and station comms for this seat.
        Front → Kenzy. Back → Tom. Dollars → Myke. In-app notes only — no auto email.
        Cooked food is a promo, not a void. No recipe book.
        Tom path: ticket out of the printer, driver area, dispatch. Unentered cash is not a shortage.
      </p>

      {ownerCloses.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {ownerCloses.map((close) => (
            <article key={close.businessDate} className="rounded-xl border border-amber-200/30 bg-amber-200/[0.05] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-100/70">
                Yesterday close · {close.weekday} {close.businessDate}
              </p>
              <h3 className="mt-1 font-medium">{close.move}</h3>
              <p className="mt-2 text-sm text-white/75">
                Grand {close.grandTotal} · Food {close.food} · Beer {close.beer} · Liquor {close.liquor} · Pop {close.pop}
                {' · '}Labor {close.labor} · Late {close.late} · Delivery {close.inHouseDelivery}
              </p>
              <p className="mt-2 text-sm text-white/75">{close.cash}</p>
              <p className="mt-2 text-xs text-white/50">{close.deliveryNote} Unentered cash is not a shortage.</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {STATION_SEAT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`rounded-lg border px-3 py-2 text-xs ${
              seatKey === key ? 'border-amber-200 text-amber-100' : 'border-white/15 text-white/70 hover:border-white/40'
            }`}
            onClick={() => setSeatKey(key)}
          >
            {key.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {STAFF_ROLE_DAY_WEEKDAYS.map((day) => (
          <button
            key={day}
            type="button"
            className={`rounded-lg border px-3 py-2 text-xs ${
              weekday === day ? 'border-emerald-200 text-emerald-100' : 'border-white/15 text-white/70 hover:border-white/40'
            }`}
            onClick={() => setWeekday(day)}
          >
            {day.slice(0, 3)}
          </button>
        ))}
        {VIEWS.map((phase) => (
          <button
            key={phase}
            type="button"
            className={`rounded-lg border px-3 py-2 text-xs ${
              view === phase ? 'border-sky-200 text-sky-100' : 'border-white/15 text-white/70 hover:border-white/40'
            }`}
            onClick={() => setView(phase)}
          >
            {phase}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {desk.comms.map((comm) => (
          <article key={comm.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">{comm.channel} · in-app note</p>
            <h3 className="mt-1 font-medium">{comm.roleTitle} ({comm.stationName})</h3>
            <p className="mt-2 text-sm text-white/75">{comm.rule}</p>
          </article>
        ))}
      </div>

      {desk.scheduleBoard.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {desk.scheduleBoard.map((rule) => (
            <article key={rule.id} className="rounded-xl border border-emerald-200/20 bg-emerald-200/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-100/70">schedule board</p>
              <h3 className="mt-1 font-medium">{rule.title}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/75">
                {rule.rules.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}

      {desk.policies.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {desk.policies.map((policy) => (
            <article key={policy.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">{policy.kind.replaceAll('_', ' ')}</p>
              <h3 className="mt-1 font-medium">{policy.title}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/75">
                {policy.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}

      {desk.extras.length > 0 ? (
        <div className="mt-6 rounded-xl border border-amber-200/20 bg-amber-200/[0.04] p-4">
          <h3 className="font-medium text-amber-100">Today extras</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-white/75">
            {desk.extras.map((extra) => (
              <li key={extra}>{extra}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {desk.checklist.map((template) => (
          <details key={template.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-sm text-emerald-200">
              {template.name} · {template.weekday ?? 'any day'} · {template.shiftPhase}
            </summary>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-white/75">
              {template.steps.map((step) => (
                <li key={`${template.id}-${step.instruction}`}>{step.instruction}</li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </section>
  );
}
