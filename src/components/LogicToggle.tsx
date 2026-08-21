'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'n86_logic_mode';
const URL_PARAM = 'n86';
const URL_VALUE = 'logic';

// Operator-only provenance overlay. Activates via ?n86=logic in the URL
// (then persists in localStorage so subsequent pages keep it on). When
// active, sets a body data-attribute that reveals every `.logic-only`
// element. Customers never see the toggle button itself; only someone who
// knows the URL pattern can activate it. Per GOVERNANCE.md, methodology
// is only shown to the operator running calibration.
export function LogicToggle() {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let on = false;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get(URL_PARAM) === URL_VALUE) on = true;
      else if (window.localStorage.getItem(STORAGE_KEY) === '1') on = true;
    } catch { /* ignore */ }
    setActive(on);
    document.body.setAttribute('data-logic-mode', on ? 'true' : 'false');
    if (on) {
      try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    }
  }, []);

  function toggle() {
    const next = !active;
    setActive(next);
    document.body.setAttribute('data-logic-mode', next ? 'true' : 'false');
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, '1');
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }

  if (!mounted || !active) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-4 right-4 z-50 text-[11px] uppercase tracking-wider font-semibold rounded-full px-3 py-1.5 text-amber-300 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25"
      title="Logic mode active — click to disable"
    >
      🔍 logic · on
    </button>
  );
}
