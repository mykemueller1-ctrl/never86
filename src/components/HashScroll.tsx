'use client';

import { useEffect } from 'react';

/** Full page loads and in-page hashes. Next resets scroll after hydration. */
export function HashScroll({ id }: { id: string }) {
  useEffect(() => {
    function scroll() {
      if (window.location.hash !== `#${id}`) return;
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    }
    scroll();
    const frame = window.requestAnimationFrame(scroll);
    window.addEventListener('hashchange', scroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', scroll);
    };
  }, [id]);
  return null;
}
