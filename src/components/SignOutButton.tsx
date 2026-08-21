'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/operator/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    router.push('/');
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="font-mono uppercase text-[10px] tracking-[0.12em] px-2 py-1 text-[#6b6b66] hover:text-[#141414] transition-colors disabled:opacity-50"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
