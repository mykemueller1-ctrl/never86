'use client';

import { useEffect, useMemo, useState } from 'react';
import { fixturePapersScanRows, PAPERS_SCAN_FIXTURE_BANNER } from '@/lib/papersScanFixtures';
import {
  PAPERS_SCAN_CATEGORIES,
  papersCategoryLabel,
  type PapersLabeledField,
  type PapersScanJobState,
  type PapersScanRow,
} from '@/lib/papersScanTypes';

type ScanPayload = {
  job?: PapersScanJobState | null;
  rows?: PapersScanRow[];
  note?: string;
  error?: string;
};

function Honesty({ value }: { value: string }) {
  const key = value.toLowerCase();
  return <span className={`owner-seat-honesty is-${key}`}>{value}</span>;
}

function FieldRow({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  field: PapersLabeledField;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="papers-review-field">
      <span className="papers-review-field-label">
        {label}
        <Honesty value={field.honesty} />
      </span>
      <input
        value={value}
        placeholder="Missing"
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
      {field.note ? <small>{field.note}</small> : null}
    </label>
  );
}

function ReadField({ label, field }: { label: string; field?: PapersLabeledField }) {
  const shown = field ?? { honesty: 'Missing' as const, value: null, amount: null, note: null };
  return (
    <p className="papers-review-field">
      <span className="papers-review-field-label">
        {label}
        <Honesty value={shown.honesty} />
      </span>
      <span>{shown.value ?? 'Missing'}</span>
      {shown.note ? <small>{shown.note}</small> : null}
    </p>
  );
}

function progressLine(job: PapersScanJobState | null, fixture: boolean): string {
  if (fixture) return PAPERS_SCAN_FIXTURE_BANNER;
  if (!job) return 'Connect Google. The scan fills this screen. No uploads.';
  if (job.status === 'queued' || job.status === 'running') {
    return `Scanning ${job.phase}… ${job.scanned} checked, ${job.kept} kept, ${job.skipped} skipped, ${job.deduped} already seen.`;
  }
  if (job.status === 'failed') return job.error ?? 'Scan Missing. No invented papers.';
  return `Scan finished. ${job.kept} papers on this screen. ${job.deduped} duplicates skipped. Last ${job.lookbackDays} days.`;
}

export function PapersReviewScreen({
  active,
  fixture,
}: {
  active: boolean;
  fixture: boolean;
}) {
  const [job, setJob] = useState<PapersScanJobState | null>(null);
  const [rows, setRows] = useState<PapersScanRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (fixture) {
      setRows(fixturePapersScanRows());
      setJob(null);
      setNotice(PAPERS_SCAN_FIXTURE_BANNER);
      return;
    }
    if (!active) {
      setRows([]);
      setJob(null);
      return;
    }
    let stop = false;
    let kicked = false;
    let status = '';
    async function load() {
      try {
        const res = await fetch('/api/papers/scan', { signal: AbortSignal.timeout(8000) });
        const body = (await res.json()) as ScanPayload;
        if (stop) return;
        setJob(body.job ?? null);
        setRows(body.rows ?? []);
        status = body.job?.status ?? '';
        if (body.job?.error) setNotice(body.job.error);
        if (!kicked && (!body.job || status === 'queued')) {
          kicked = true;
          await fetch('/api/papers/scan', { method: 'POST', signal: AbortSignal.timeout(20000) });
          if (!stop) await load();
        }
      } catch {
        if (!stop) setNotice('Scan status Missing. No invented papers.');
      }
    }
    void load();
    const id = window.setInterval(() => {
      if (status === 'done' || status === 'failed') return;
      void load();
    }, 2000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [active, fixture]);

  const grouped = useMemo(() => {
    return PAPERS_SCAN_CATEGORIES.map((category) => ({
      ...category,
      rows: rows.filter((row) => row.category === category.id),
    })).filter((group) => group.rows.length > 0);
  }, [rows]);

  function draftValue(row: PapersScanRow, key: string, field: PapersLabeledField): string {
    return drafts[row.id]?.[key] ?? field.value ?? '';
  }

  function setDraft(rowId: string, key: string, value: string) {
    setDrafts((prev) => ({ ...prev, [rowId]: { ...prev[rowId], [key]: value } }));
  }

  async function confirmRow(row: PapersScanRow) {
    const draft = drafts[row.id] ?? {};
    const fields = {
      vendorName: draft.vendorName ?? row.vendorName.value ?? '',
      invoiceNumber: draft.invoiceNumber ?? row.invoiceNumber.value ?? '',
      dates: draft.dates ?? row.dates.value ?? '',
      total: draft.total ?? row.total.value ?? '',
      deliveryGross: draft.deliveryGross ?? row.delivery.gross.value ?? '',
      deliveryFees: draft.deliveryFees ?? row.delivery.fees.value ?? '',
      deliveryNet: draft.deliveryNet ?? row.delivery.net.value ?? '',
      shifts: row.shifts.map((shift, index) => ({
        index,
        hours: draft[`shift-${index}`] ?? shift.hours.value ?? '',
      })),
      lineItems: row.lineItems.map((line, index) => ({
        index,
        sku: draft[`sku-${index}`] ?? line.sku.value ?? '',
        quantity: draft[`qty-${index}`] ?? line.quantity.value ?? '',
        unitPrice: draft[`price-${index}`] ?? line.unitPrice.value ?? '',
      })),
    };
    if (fixture || row.fixture) {
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, confirmed: true } : item)));
      setNotice('Fixture row confirmed on this screen only. Nothing was written to Google.');
      return;
    }
    const res = await fetch('/api/papers/scan/row', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, confirm: true, fields }),
    });
    const body = (await res.json()) as { row?: PapersScanRow; error?: string };
    if (!res.ok || !body.row) {
      setNotice(body.error ?? 'Row Missing.');
      return;
    }
    setRows((prev) => prev.map((item) => (item.id === row.id ? body.row! : item)));
    setNotice('Row confirmed. Edited numbers stay Estimated. Unread numbers stay Missing.');
  }

  async function scanAgain() {
    setNotice('Scanning Gmail and Drive again…');
    const res = await fetch('/api/papers/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true }),
    });
    const body = (await res.json()) as ScanPayload;
    if (!res.ok) {
      setNotice(body.error ?? 'Scan Missing. No invented papers.');
      return;
    }
    setJob(body.job ?? null);
    setRows(body.rows ?? []);
  }

  return (
    <section id="papers-review" className="papers-review" aria-label="Restaurant papers review">
      <p className="owner-desk-kicker">One review</p>
      <h3 className="owner-seat-papers-title">Confirm each paper</h3>
      <p className="papers-review-progress" role="status">{progressLine(job, fixture)}</p>
      {notice && !fixture ? <p className="owner-seat-receipt">{notice}</p> : null}
      {fixture ? <p className="papers-review-fixture">{PAPERS_SCAN_FIXTURE_BANNER}</p> : null}
      {active && !fixture ? (
        <button type="button" className="owner-desk-secondary" onClick={() => void scanAgain()}>
          Scan again
        </button>
      ) : null}
      {!rows.length ? (
        <p className="owner-seat-papers-outlook">
          No restaurant papers on this screen yet. EOD, invoices, labor, liquor and beer, delivery apps, and recipes show up here after the scan.
        </p>
      ) : null}
      {grouped.map((group) => (
        <div key={group.id} className="papers-review-group">
          <h4>{group.label}</h4>
          {group.rows.map((row) => (
            <article key={row.id} className="papers-review-row" aria-label={row.filename}>
              <header className="papers-review-row-head">
                <strong>{row.filename}</strong>
                <span>Category</span>
                <Honesty value={row.categoryHonesty} />
                <span>{papersCategoryLabel(row.category)}</span>
                {row.confirmed ? <span>Confirmed</span> : null}
              </header>
              <p className="papers-review-source">{row.fixture ? 'Fixture file' : row.source} · {row.note}</p>
              <p className="papers-review-week">ISO week {row.isoWeek ?? 'Missing'}</p>
              <div className="papers-review-grid">
                <FieldRow label="Vendor" field={row.vendorName} value={draftValue(row, 'vendorName', row.vendorName)} onChange={(value) => setDraft(row.id, 'vendorName', value)} />
                <FieldRow label="Invoice number" field={row.invoiceNumber} value={draftValue(row, 'invoiceNumber', row.invoiceNumber)} onChange={(value) => setDraft(row.id, 'invoiceNumber', value)} />
                <FieldRow label="Dates" field={row.dates} value={draftValue(row, 'dates', row.dates)} onChange={(value) => setDraft(row.id, 'dates', value)} />
                <FieldRow label="Total" field={row.total} value={draftValue(row, 'total', row.total)} onChange={(value) => setDraft(row.id, 'total', value)} />
              </div>
              {row.category === 'delivery-app' ? (
                <div className="papers-review-grid">
                  <p className="papers-review-field">
                    <span className="papers-review-field-label">
                      Platform
                      <Honesty value={row.delivery.platform.honesty} />
                    </span>
                    <span>{row.delivery.platform.value ?? 'Missing'}</span>
                  </p>
                  <FieldRow label="Gross" field={row.delivery.gross} value={draftValue(row, 'deliveryGross', row.delivery.gross)} onChange={(value) => setDraft(row.id, 'deliveryGross', value)} />
                  <FieldRow label="Fees" field={row.delivery.fees} value={draftValue(row, 'deliveryFees', row.delivery.fees)} onChange={(value) => setDraft(row.id, 'deliveryFees', value)} />
                  <FieldRow label="Net" field={row.delivery.net} value={draftValue(row, 'deliveryNet', row.delivery.net)} onChange={(value) => setDraft(row.id, 'deliveryNet', value)} />
                </div>
              ) : null}
              {row.lineItems.length ? (
                <ul className="papers-review-lines">
                  {row.lineItems.map((line, index) => (
                    <li key={`${row.id}-line-${index}`}>
                      <FieldRow label="SKU" field={line.sku} value={draftValue(row, `sku-${index}`, line.sku)} onChange={(value) => setDraft(row.id, `sku-${index}`, value)} />
                      <span>{line.description.honesty === 'Missing' ? 'Missing' : line.description.value}</span>
                      <Honesty value={line.description.honesty} />
                      <FieldRow label="Qty" field={line.quantity} value={draftValue(row, `qty-${index}`, line.quantity)} onChange={(value) => setDraft(row.id, `qty-${index}`, value)} />
                      <ReadField label="Unit" field={line.unit} />
                      <FieldRow label="Unit price" field={line.unitPrice} value={draftValue(row, `price-${index}`, line.unitPrice)} onChange={(value) => setDraft(row.id, `price-${index}`, value)} />
                      <ReadField label="Extended" field={line.extendedPrice} />
                      <ReadField label="Category" field={line.category} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {row.shifts.length ? (
                <ul className="papers-review-lines">
                  {row.shifts.map((shift, index) => (
                    <li key={`${row.id}-shift-${index}`}>
                      <span>{shift.employee.honesty === 'Missing' ? 'Missing' : shift.employee.value}</span>
                      <Honesty value={shift.employee.honesty} />
                      <FieldRow label="Hours" field={shift.hours} value={draftValue(row, `shift-${index}`, shift.hours)} onChange={(value) => setDraft(row.id, `shift-${index}`, value)} />
                    </li>
                  ))}
                </ul>
              ) : null}
              <button type="button" className="owner-desk-primary" onClick={() => void confirmRow(row)}>
                {row.confirmed ? 'Confirmed' : 'Confirm row'}
              </button>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
