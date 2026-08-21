'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import {
  calculateMarketplaceCost,
  type MarketplaceCostInputs,
  type MarketplaceCostResult,
} from '@/lib/marketplaceCost';
import { trackEvent } from '@/lib/track';

type Marketplace = 'DoorDash' | 'Uber Eats' | 'Grubhub';

type Props = {
  initialPlatform?: Marketplace;
  intent?: string;
  pagePath?: string;
  compactIntro?: boolean;
  humanAuditHref?: string;
};

const FIELD_COPY: Array<{
  key: keyof MarketplaceCostInputs;
  label: string;
  hint: string;
  optional?: boolean;
}> = [
  { key: 'eligibleSales', label: 'Eligible marketplace sales', hint: 'Food sales or the fee base shown' },
  { key: 'commission', label: 'Commission', hint: 'Commission or marketplace fee' },
  { key: 'merchantFees', label: 'Merchant fees', hint: 'Processing, delivery, service, or other merchant fees' },
  { key: 'promotions', label: 'Restaurant-funded promos + ads', hint: 'Only the restaurant-funded amount' },
  { key: 'refundsAdjustments', label: 'Refunds + adjustments', hint: 'Deductions shown on the statement' },
  { key: 'otherFees', label: 'Other documented deductions', hint: 'Anything not included above' },
  { key: 'credits', label: 'Credits', hint: 'Credits that increase what you keep' },
  { key: 'reportedPayout', label: 'Reported payout', hint: 'Optional: compare with calculated payout', optional: true },
];

const emptyValues: Record<keyof MarketplaceCostInputs, string> = {
  eligibleSales: '',
  commission: '',
  merchantFees: '',
  promotions: '',
  refundsAdjustments: '',
  otherFees: '',
  credits: '',
  reportedPayout: '',
};

function money(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseMoney(value: string): number {
  const normalized = value.replace(/[$,\s]/g, '');
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function MarketplaceCostSnapshot({
  initialPlatform = 'DoorDash',
  intent = 'true-cost',
  pagePath = '/audit',
  compactIntro = false,
  humanAuditHref = '#claim',
}: Props) {
  const [platform, setPlatform] = useState<Marketplace>(initialPlatform);
  const [values, setValues] = useState(emptyValues);
  const [result, setResult] = useState<MarketplaceCostResult | null>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  function updateValue(key: keyof MarketplaceCostInputs, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setResult(null);
    setError('');
    if (!started) {
      setStarted(true);
      trackEvent('marketplace_snapshot_started', {
        pagePath,
        agentName: 'Marketplace Cost Snapshot',
        audience: 'restaurant_operator',
        meta: { platform, intent },
      });
    }
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const eligibleSales = parseMoney(values.eligibleSales);
    if (eligibleSales <= 0) {
      setError('Enter eligible marketplace sales greater than $0.');
      return;
    }

    const calculated = calculateMarketplaceCost({
      eligibleSales,
      commission: parseMoney(values.commission),
      merchantFees: parseMoney(values.merchantFees),
      promotions: parseMoney(values.promotions),
      refundsAdjustments: parseMoney(values.refundsAdjustments),
      otherFees: parseMoney(values.otherFees),
      credits: parseMoney(values.credits),
      reportedPayout: values.reportedPayout.trim()
        ? parseMoney(values.reportedPayout)
        : undefined,
    });

    if (!calculated) return;
    setResult(calculated);
    trackEvent('marketplace_snapshot_calculated', {
      pagePath,
      agentName: 'Marketplace Cost Snapshot',
      audience: 'restaurant_operator',
      meta: {
        platform,
        intent,
        hasReportedPayout: Boolean(values.reportedPayout.trim()),
      },
    });
  }

  const varianceCopy = result?.payoutVariance === null
    ? 'Add the reported payout to compare it with the calculation.'
    : result && Math.abs(result.payoutVariance) < 0.01
      ? 'The reported payout matches the entered statement math.'
      : result && result.payoutVariance > 0
        ? `Reported payout is ${money(result.payoutVariance)} above the calculation.`
        : result
          ? `Reported payout is ${money(Math.abs(result.payoutVariance ?? 0))} below the calculation.`
          : '';

  return (
    <section id="true-cost-snapshot" className="border-b border-white/10 bg-[#0d0d0d]">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#d4a017]">
              Free · no login · no email gate
            </p>
            <h2 className={`${compactIntro ? 'text-4xl md:text-5xl' : 'text-5xl md:text-6xl'} mt-5 font-black leading-[0.98] tracking-[-0.045em]`}>
              SEE THE COST BEFORE YOU SEND A FILE.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/62">
              Enter the numbers already on your statement. We separate the deductions, calculate an effective marketplace cost, and bridge sales to expected payout.
            </p>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-relaxed text-white/55">
              <strong className="block text-white/85">What this result means</strong>
              It is a calculation from the numbers you enter—not a verified audit, contract finding, or bank reconciliation. A rate claim needs the governing agreement and fee base. A cash claim needs the matching deposit evidence.
            </div>
          </div>

          <form onSubmit={calculate} className="rounded-3xl border border-[#d4a017]/30 bg-[#151515] p-5 shadow-2xl shadow-black/30 md:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label htmlFor="snapshot-platform" className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">Marketplace</label>
                <select
                  id="snapshot-platform"
                  value={platform}
                  onChange={(event) => {
                    const next = event.target.value as Marketplace;
                    setPlatform(next);
                    setResult(null);
                  }}
                  className="min-w-56 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#d4a017]"
                >
                  <option value="DoorDash">DoorDash</option>
                  <option value="Uber Eats">Uber Eats · early access</option>
                  <option value="Grubhub">Grubhub · early access</option>
                </select>
              </div>
              <p className="text-xs font-semibold text-white/40">Use positive dollar amounts</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {FIELD_COPY.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/55">
                    {field.label}{field.optional ? ' · optional' : ''}
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-3.5 text-white/35">$</span>
                    <input
                      inputMode="decimal"
                      value={values[field.key]}
                      onChange={(event) => updateValue(field.key, event.target.value)}
                      placeholder="0.00"
                      aria-describedby={`snapshot-${field.key}-hint`}
                      className="w-full rounded-xl border border-white/15 bg-black/35 py-3.5 pl-8 pr-4 text-white outline-none transition placeholder:text-white/20 focus:border-[#d4a017]"
                    />
                  </div>
                  <span id={`snapshot-${field.key}-hint`} className="mt-1.5 block text-[11px] leading-relaxed text-white/35">{field.hint}</span>
                </label>
              ))}
            </div>

            <button type="submit" className="mt-7 w-full rounded-xl bg-[#d4a017] px-5 py-4 text-base font-black text-black transition hover:bg-[#e6b82e]">
              CALCULATE MY TRUE COST →
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">
              Your dollar inputs stay in this browser and are not included in our analytics event.
            </p>
            {error ? <p role="alert" className="mt-3 text-sm font-semibold text-red-400">{error}</p> : null}

            {result ? (
              <div className="mt-7" aria-live="polite">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Documented deductions</p>
                    <p className="mt-2 text-2xl font-black text-white">{money(result.documentedDeductions)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#d4a017]/45 bg-[#d4a017]/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#e6b82e]">Effective marketplace cost</p>
                    <p className="mt-2 text-2xl font-black text-[#e6b82e]">{result.effectiveMarketplaceCostPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Expected payout</p>
                    <p className="mt-2 text-2xl font-black text-white">{money(result.expectedPayout)}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-white/45">Payout comparison</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{varianceCopy}</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <a
                    href={humanAuditHref}
                    onClick={() => trackEvent('marketplace_snapshot_human_audit_click', { pagePath, meta: { platform, intent } })}
                    className="rounded-xl bg-white px-5 py-3.5 text-center text-sm font-black text-black transition hover:bg-white/85"
                  >
                    GET THE STATEMENT REVIEWED →
                  </a>
                  <Link
                    href="/delivery-marketplace-reconciliation"
                    onClick={() => trackEvent('marketplace_snapshot_education_click', { pagePath, meta: { platform, intent } })}
                    className="rounded-xl border border-white/15 px-5 py-3.5 text-center text-sm font-black text-white transition hover:border-white/35"
                  >
                    LEARN WHAT TO CHECK →
                  </Link>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-white/40">
                  If you share a file, never send portal credentials. Redact guest names, addresses, phones, emails, bank/account/routing numbers, card data, tax IDs, credentials, and unrelated identifiers.
                </p>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
