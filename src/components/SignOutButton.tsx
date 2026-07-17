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
      className="text-[13px] px-3 py-1.5 rounded-full text-ink-600 hover:text-ink-800 hover:bg-black/[0.04] transition-colors disabled:opacity-50"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
