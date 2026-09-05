'use client';

import { useState } from 'react';
import { HOUSE_CODE_BRAND_BLUE } from '@/lib/houseCode';

export function PortalHouseForm() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setOk(null);
    const response = await fetch('/api/portal/house', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const body = (await response.json()) as { ok?: boolean; hint?: string; error?: string };
    setOk(body.ok === true);
    setMessage(body.hint ?? body.error ?? 'No seat opened.');
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="compass-eyebrow">House code</span>
        <input
          type="text"
          name="code"
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Store house code"
          className="mt-2 w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-[#1d1d1f] focus:outline-none"
          style={{ boxShadow: `0 0 0 1px ${code ? HOUSE_CODE_BRAND_BLUE : 'transparent'}` }}
        />
      </label>
      <button type="submit" className="btn-primary w-full" style={{ background: HOUSE_CODE_BRAND_BLUE }}>
        Open the seat →
      </button>
      {message ? (
        <p className="text-sm" style={{ color: ok ? HOUSE_CODE_BRAND_BLUE : '#86868b' }}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
