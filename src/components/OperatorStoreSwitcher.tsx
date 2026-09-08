'use client';

import { useEffect, useState } from 'react';

type SeatChoice = { restaurantName: string };

/**
 * Same signed-in email. Switch isolated stores without a second login.
 * Lives on /operator so PR 241 can keep editing FreeOperatorPhone.
 */
export default function OperatorStoreSwitcher() {
  const [seats, setSeats] = useState<SeatChoice[]>([]);
  const [current, setCurrent] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/operator/stores', { method: 'GET' });
        const data = (await res.json()) as {
          success?: boolean;
          current?: { restaurantName: string } | null;
          seats?: SeatChoice[];
        };
        if (cancelled || !res.ok || !data.success) return;
        const nextSeats = Array.isArray(data.seats) ? data.seats : [];
        if (nextSeats.length < 2) return;
        setSeats(nextSeats);
        setCurrent(data.current?.restaurantName ?? nextSeats[0]?.restaurantName ?? '');
      } catch {
        /* unsigned desk stays quiet */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (seats.length < 2) return null;

  async function onChange(restaurantName: string) {
    if (!restaurantName || restaurantName === current) return;
    setBusy(true);
    try {
      const res = await fetch('/api/operator/switch-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName: restaurantName, restaurantName }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!res.ok || !data.success) return;
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md items-center justify-center gap-2 px-4 pt-3">
      <label className="text-[11px] uppercase tracking-[0.12em] text-[#6e6e73]" htmlFor="n86-store-switch">
        Store
      </label>
      <select
        id="n86-store-switch"
        value={current}
        disabled={busy}
        onChange={(event) => {
          setCurrent(event.target.value);
          void onChange(event.target.value);
        }}
        className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-sm text-[#1d1d1f]"
      >
        {seats.map((seat) => (
          <option key={seat.restaurantName} value={seat.restaurantName}>
            {seat.restaurantName}
          </option>
        ))}
      </select>
    </div>
  );
}
