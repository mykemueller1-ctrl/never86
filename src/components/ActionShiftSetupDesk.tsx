'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import {
  ACTION_SHIFT_ROLE_PACKS,
  ACTION_SHIFT_ROSTER_TEMPLATE,
  ACTION_SHIFT_SCHEDULE_TEMPLATE,
  buildActionShiftSetupPlan,
} from '@/lib/actionShiftSetup';
import { ACTION_SHIFT_WEEKLY_TEMPLATE } from '@/lib/actionShiftWeeklySheet';

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

const MAX_LOCAL_FILE_BYTES = 5 * 1024 * 1024;

async function readFile(
  event: ChangeEvent<HTMLInputElement>,
  onRead: (value: string) => void,
  onError: (value: string | null) => void,
) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > MAX_LOCAL_FILE_BYTES) {
    onError('CSV is larger than the 5 MB local-processing limit. Export a smaller date range.');
    event.target.value = '';
    return;
  }
  onError(null);
  onRead(await file.text());
  event.target.value = '';
}

const inputClass = 'mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white';

export default function ActionShiftSetupDesk() {
  const [providerKey, setProviderKey] = useState('time-clock');
  const [rosterCsv, setRosterCsv] = useState(ACTION_SHIFT_ROSTER_TEMPLATE);
  const [scheduleCsv, setScheduleCsv] = useState(ACTION_SHIFT_SCHEDULE_TEMPLATE);
  const [storeOpen, setStoreOpen] = useState('11:00 AM');
  const [storeClose, setStoreClose] = useState('11:00 PM');
  const [timezoneOffset, setTimezoneOffset] = useState('-05:00');
  const [fileError, setFileError] = useState<string | null>(null);
  const result = useMemo(() => buildActionShiftSetupPlan({
    rosterCsv,
    scheduleCsv,
    providerKey,
    storeOpen,
    storeClose,
    timezoneOffset,
  }), [providerKey, rosterCsv, scheduleCsv, storeClose, storeOpen, timezoneOffset]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
        <p className="text-sm font-semibold text-amber-200">Safe staging mode</p>
        <p className="mt-1 text-sm leading-relaxed text-white/65">
          Files are parsed in this browser only. Nothing is uploaded or written to the database.
          Export the deployment packet after every red row is resolved; database activation remains a separate gate.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <label className="block text-xs uppercase tracking-wider text-white/50">
            Time-clock / schedule provider key
            <input value={providerKey} onChange={(event) => setProviderKey(event.target.value)} className={inputClass} />
          </label>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <label className="block text-xs uppercase tracking-wider text-white/50">
              Store open
              <input value={storeOpen} onChange={(event) => setStoreOpen(event.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/50">
              Store close
              <input value={storeClose} onChange={(event) => setStoreClose(event.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/50">
              Offset
              <input value={timezoneOffset} onChange={(event) => setTimezoneOffset(event.target.value)} className={inputClass} />
            </label>
          </div>
          <p className="mt-2 text-xs text-white/40">Open / CLOSE tokens on a weekly sheet resolve from these hours. They are staging labels, not a live store rule.</p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">1. Active-worker roster</h2>
            <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:border-white/35">
              Load CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void readFile(event, setRosterCsv, setFileError)} />
            </label>
          </div>
          <textarea value={rosterCsv} onChange={(event) => setRosterCsv(event.target.value)} rows={10} className={`${inputClass} font-mono text-xs`} spellCheck={false} />
          <button type="button" onClick={() => download('action-shift-roster-template.csv', ACTION_SHIFT_ROSTER_TEMPLATE, 'text/csv')} className="mt-3 text-xs text-amber-200 underline underline-offset-4">
            Download blank-format example
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">2. Published schedule</h2>
            <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:border-white/35">
              Load CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void readFile(event, setScheduleCsv, setFileError)} />
            </label>
          </div>
          <textarea value={scheduleCsv} onChange={(event) => setScheduleCsv(event.target.value)} rows={10} className={`${inputClass} font-mono text-xs`} spellCheck={false} />
          <button type="button" onClick={() => download('action-shift-schedule-template.csv', ACTION_SHIFT_SCHEDULE_TEMPLATE, 'text/csv')} className="mt-3 text-xs text-amber-200 underline underline-offset-4">
            Download blank-format example
          </button>
          <button type="button" onClick={() => download('action-shift-weekly-sheet-example.csv', ACTION_SHIFT_WEEKLY_TEMPLATE, 'text/csv')} className="mt-3 ml-4 text-xs text-amber-200 underline underline-offset-4">
            Download weekly sheet example
          </button>
          <p className="mt-2 text-xs text-white/40">
            Bar / kitchen / driver weekly sheets paste here. Join is worker ID from the roster, then station. Names are display-only.
          </p>
        </div>
      </section>

      {fileError ? <p className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200" role="alert">{fileError}</p> : null}

      {!result.ok ? (
        <section className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5 text-sm text-red-200" role="alert">
          {result.error}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="text-3xl text-white">{result.plan.seats.length}</p><p className="text-xs uppercase tracking-wider text-white/45">active seats</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="text-3xl text-white">{result.plan.shifts.length}</p><p className="text-xs uppercase tracking-wider text-white/45">matched shifts</p></div>
            <div className={`rounded-xl border p-4 ${result.plan.issues.length ? 'border-red-400/30 bg-red-400/5' : 'border-emerald-400/30 bg-emerald-400/5'}`}><p className="text-3xl text-white">{result.plan.issues.length}</p><p className="text-xs uppercase tracking-wider text-white/45">blocked rows</p></div>
          </div>

          {result.plan.issues.length > 0 ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
              <h2 className="font-semibold text-red-100">Resolve before activation</h2>
              <ul className="mt-3 space-y-2 text-sm text-red-100/80">
                {result.plan.issues.map((issue, index) => (
                  <li key={`${issue.source}-${issue.row}-${index}`}>
                    {issue.source} row {issue.row} · {issue.externalId || 'missing ID'} · {issue.reason.replaceAll('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-5">
              <div><p className="font-semibold text-emerald-100">Packet passes local validation</p><p className="mt-1 text-sm text-white/55">IDs, roles, dates, time windows, and duplicate checks passed.</p></div>
              <button type="button" onClick={() => download('action-shift-deployment-packet.json', JSON.stringify(result.plan, null, 2), 'application/json')} className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950">
                Export deployment packet
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-white/45"><tr><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Shift</th><th className="px-4 py-3">Checklist</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {result.plan.shifts.map((shift) => (
                  <tr key={shift.externalShiftId}><td className="px-4 py-3 text-white">{shift.displayName}<span className="block font-mono text-xs text-white/35">{shift.externalWorkerId}</span></td><td className="px-4 py-3 text-white/70">{shift.roleKey.replaceAll('_', ' ')}</td><td className="px-4 py-3 text-white/70">{shift.businessDate}<span className="block text-xs text-white/35">{shift.startsAt} → {shift.endsAt}</span></td><td className="px-4 py-3 text-white/70">{shift.checklistItems.length} required items</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-white">Role packs included</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(ACTION_SHIFT_ROLE_PACKS).map(([role, items]) => (
            <div key={role} className="rounded-xl border border-white/5 bg-black/20 p-4"><p className="text-sm font-semibold capitalize text-white">{role.replaceAll('_', ' ')}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-white/55">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>
          ))}
        </div>
      </section>
    </div>
  );
}
