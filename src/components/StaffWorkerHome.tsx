'use client';

import { useMemo, useState } from 'react';
import {
  STAFF_ROLE_DAY_WEEKDAYS,
  storeWeekdayToday,
} from '@/lib/staffRoleDayPack';
import {
  STAFF_WORKER_ASK_PROMPTS,
  answerStaffWorkerAsk,
  type StaffAskResult,
} from '@/lib/staffWorkerAskPack';
import { StaffScheduleDesk } from '@/components/StaffScheduleDesk';
import {
  STAFF_COMM_ROOMS,
  STAFF_FLOOR_PATH,
  STAFF_WORKER_HOME_STATUS,
  SYNTHETIC_COMM_SEED,
  buildStaffWorkerHome,
  messagesVisibleTo,
  postCommMessage,
  type StaffCommMessage,
  type StaffCommRoom,
} from '@/lib/staffWorkerHome';
import { STATION_SEAT_KEYS, type StationSeatKey } from '@/lib/staffSeatAuth';

export function StaffWorkerHome({
  initialSeatKey = 'server',
}: {
  initialSeatKey?: StationSeatKey;
}) {
  const [seatKey, setSeatKey] = useState<StationSeatKey>(initialSeatKey);
  const [weekday, setWeekday] = useState<(typeof STAFF_ROLE_DAY_WEEKDAYS)[number]>(storeWeekdayToday());
  const [ask, setAsk] = useState('');
  const [askResult, setAskResult] = useState<StaffAskResult | null>(null);
  const [room, setRoom] = useState<StaffCommRoom>('all');
  const [note, setNote] = useState('');
  const [messages, setMessages] = useState<StaffCommMessage[]>(() => [...SYNTHETIC_COMM_SEED]);
  const [flash, setFlash] = useState('');

  const home = useMemo(
    () => buildStaffWorkerHome({ seatKey, weekday }),
    [seatKey, weekday],
  );
  const visibleRooms = home.rooms;
  const activeRoom = visibleRooms.includes(room) ? room : visibleRooms[0] ?? 'all';
  const visibleMessages = messagesVisibleTo(seatKey, messages).filter((row) => row.room === activeRoom);

  function runAsk(question: string) {
    const next = answerStaffWorkerAsk(question);
    setAskResult(next);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-amber-200">
          Worker Home · {STAFF_WORKER_HOME_STATUS} · not live
        </p>
        <h2 className="mt-2 font-semibold">{home.checklist.stationLabel} · {home.weekday}</h2>
        <p className="mt-2 text-sm text-white/60">
          Ask the house. Talk in All / FOH / BOH. Schedule holds the week strip, bar-week extras, my shifts, time off, swap/cover, standing availability, and coverage counts — slots, not names.
          Dollars never. Crew does not see each other&apos;s checklist misses.
        </p>
        {home.floorPath ? (
          <p className="mt-3 text-sm text-emerald-100">{STAFF_FLOOR_PATH}</p>
        ) : null}

        <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-white/35">Preview seat · login fail-closed</p>
        <div className="mt-2 flex flex-wrap gap-2">
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
        </div>
      </div>

      <StaffScheduleDesk seatKey={seatKey} weekday={weekday} onWeekday={setWeekday} />

      <div className="rounded-2xl border border-sky-200/20 bg-sky-200/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-sky-100/80">Ask</p>
        <p className="mt-2 text-sm text-white/60">
          Answers only from the waitress quiz, dress SOP, Community Special, and pour spec already in the extracts.
          No invented dollars.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAFF_WORKER_ASK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 hover:border-white/40"
              onClick={() => {
                setAsk(prompt);
                runAsk(prompt);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            runAsk(ask);
          }}
        >
          <input
            value={ask}
            onChange={(event) => setAsk(event.target.value)}
            placeholder="Community Special · what can I wear · pour spec"
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30"
          />
          <button type="submit" className="rounded-xl border border-sky-200/40 px-4 py-3 text-sm text-sky-100">
            Ask
          </button>
        </form>
        {askResult ? (
          <article className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            {askResult.ok ? (
              <>
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                  {askResult.source.replaceAll('_', ' ')} · no invented dollars
                </p>
                <h3 className="mt-1 font-medium">{askResult.title}</h3>
                <p className="mt-2 text-sm text-white/80">{askResult.answer}</p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.14em] text-amber-100/70">cannot-answer</p>
                <p className="mt-2 text-sm text-white/80">{askResult.reason}</p>
                <p className="mt-2 text-xs text-white/50">{askResult.needed}</p>
              </>
            )}
          </article>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Comms · in-app only</p>
          <h3 className="mt-1 font-medium">Staff talk inside their house. Managers see all.</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {STAFF_COMM_ROOMS.map((id) => {
              const allowed = visibleRooms.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!allowed}
                  className={`rounded-lg border px-3 py-2 text-xs uppercase ${
                    activeRoom === id
                      ? 'border-emerald-200 text-emerald-100'
                      : allowed
                        ? 'border-white/15 text-white/70 hover:border-white/40'
                        : 'cursor-not-allowed border-white/5 text-white/25'
                  }`}
                  onClick={() => allowed && setRoom(id)}
                >
                  {id}
                </button>
              );
            })}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {visibleMessages.length === 0 ? (
              <li className="text-white/45">No notes in this room yet.</li>
            ) : (
              visibleMessages.map((message) => (
                <li key={message.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                    {message.fromSeatKey.replaceAll('_', ' ')} · {message.room} · mail {String(message.mailSent)}
                  </p>
                  <p className="mt-1">{message.body}</p>
                </li>
              ))
            )}
          </ul>
          <form
            className="mt-4 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const result = postCommMessage({
                messages,
                fromSeatKey: seatKey,
                room: activeRoom,
                body: note,
                at: new Date().toISOString(),
              });
              if (!result.ok) {
                setFlash(result.error);
                return;
              }
              setMessages(result.messages);
              setNote('');
              setFlash('In-app note posted. No mail sent.');
            }}
          >
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="In-app house note. No email."
              className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30"
            />
            <button type="submit" className="rounded-xl border border-white/20 px-4 py-2 text-xs uppercase tracking-wider">
              Post in {activeRoom}
            </button>
          </form>
        </div>

      {flash ? <p className="text-sm text-amber-100/80">{flash}</p> : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/70">Role-day checklist · seat + weekday</p>
        <h3 className="mt-1 font-medium">{home.checklist.stationLabel}</h3>
        <div className="mt-4 space-y-3">
          {home.checklist.checklist.map((template) => (
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
      </div>

      {home.missBoard.length > 0 ? (
        <div className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.04] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-100/80">Miss board · Myke / Tom / Kenzy</p>
          <p className="mt-2 text-sm text-white/60">
            Owner, FOH manager, and kitchen manager only. Station labels — no roster names. Crew does not see this.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {home.missBoard.map((miss) => (
              <li key={miss.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                  {miss.stationLabel} · {miss.weekday}
                </p>
                <p className="mt-1">{miss.item}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-white/35">Miss board is hidden from crew. You do not see another station&apos;s misses.</p>
      )}
    </section>
  );
}
