'use client';

import { useState } from 'react';
import { OWNER_SEAT_SIGNOUT } from '@/lib/ownerSeatGate';

export function OwnerSeatSignOut() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(OWNER_SEAT_SIGNOUT.endpoint, { method: OWNER_SEAT_SIGNOUT.method });
    } catch {
      /* Cookie clear is best-effort; still leave the seat. */
    }
    window.location.assign(OWNER_SEAT_SIGNOUT.next);
  }

  return (
    <button
      type="button"
      className="owner-desk-signout"
      onClick={() => {
        void signOut();
      }}
      disabled={busy}
      aria-busy={busy}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
