'use client';

import Link from 'next/link';
import { useState } from 'react';
import { pointsWorth, usd } from '@/lib/roi';
import { trackEvent } from '@/lib/track';

const POINTS = [1, 2, 3, 4] as const;

// Homepage ROI calculator: an operator enters monthly sales and sees what a
// few points of food-cost recovery is worth — turning $199/mo into a rounding
// error. Pure math lives in @/lib/roi (tested); this is just the UI.
export default function RoiCalculator() {
  const [sales, setSales] = useState(60000);
  const [points, setPoints] = useState(2);
  const { monthly, annual } = pointsWorth(sales, points);

  return (
    <div className="compass-card" style={{ borderColor: '#0066ff' }}>
      <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center">
        {/* Inputs */}
        <div>
          <label className="compass-card-label" style={{ color: '#0066ff' }}>— Your monthly sales</label>
          <div className="mt-3 flex items-center gap-2">
            <span className="font-serif text-3xl" style={{ color: '#6e6e73' }}>$</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={sales}
              onChange={(e) => setSales(Math.max(0, Number(e.target.value) || 0))}
              aria-label="Monthly sales in dollars"
              className="w-full bg-black border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-2xl font-serif tabular-nums focus:outline-none focus:border-[#0066ff] transition-colors"
            />
          </div>
          <input
            type="range"
            min={10000}
            max={500000}
            step={5000}
            value={Math.min(sales, 500000)}
            onChange={(e) => setSales(Number(e.target.value))}
            aria-label="Monthly sales slider"
            className="w-full mt-4 accent-[#0066ff]"
          />

          <p className="compass-card-label mt-6" style={{ color: '#86868b' }}>— Food-cost points recovered</p>
          <div className="mt-3 flex gap-2">
            {POINTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPoints(p)}
                aria-pressed={points === p}
                className="flex-1 py-2 rounded-lg font-mono text-sm transition-colors"
                style={
                  points === p
                    ? { background: '#0066ff', color: '#fff', border: '1px solid #0066ff' }
                    : { background: 'transparent', color: '#86868b', border: '1px solid #2c2c2e' }
                }
              >
                {p} pt{p === 1 ? '' : 's'}
              </button>
            ))}
          </div>
          <p className="compass-body text-[13px] mt-4" style={{ color: '#6e6e73' }}>
            Most kitchens have 2–4 points hiding in voids, vendor drift, tips, and waste.
          </p>
        </div>

        {/* Output */}
        <div className="text-center md:text-left md:border-l md:border-[#1f1f1f] md:pl-8">
          <p className="compass-card-label" style={{ color: '#86868b' }}>— That&apos;s worth</p>
          <p className="font-serif text-white leading-none mt-3" style={{ fontSize: 'clamp(44px, 7vw, 72px)', letterSpacing: '-0.02em' }}>
            {usd(annual)}<span className="text-[24px]" style={{ color: '#6e6e73' }}>/yr</span>
          </p>
          <p className="font-mono text-[15px] mt-3" style={{ color: '#86868b' }}>
            {usd(monthly)}/mo · {points} point{points === 1 ? '' : 's'} of food cost
          </p>
          <p className="compass-body text-[14px] mt-5">
            Pulse is <span className="text-white font-semibold">$199/mo</span>
            {monthly >= 199
              ? <> — this pace pays for it <span className="text-white font-semibold">{Math.round(monthly / 199)}× over</span> every month.</>
              : <>. Even a fraction of a point covers it.</>}
          </p>
          <Link
            href="/trial"
            onClick={() => trackEvent('home_roi_cta_click', { meta: { sales, points, annual } })}
            className="btn-primary mt-6 inline-block"
            style={{ background: '#0066ff' }}
          >
            See where yours is leaking →
          </Link>
        </div>
      </div>
    </div>
  );
}
