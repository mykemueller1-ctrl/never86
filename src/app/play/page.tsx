import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Play Action Shift — free owner seat | Never 86'd",
  description:
    'Open play for any operator. Seat 1 is free. Community Tap is the first assigned store. Pain first, POS email/photo — no day-one API, no portal password.',
  alternates: { canonical: 'https://www.never86.ai/play' },
  openGraph: {
    title: "Play Action Shift — free owner seat | Never 86'd",
    description:
      'Anybody can start. Community Tap holds seat 1. Claim your own free owner seat when you are ready.',
    url: 'https://www.never86.ai/play',
  },
};

export default function OpenPlayPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f7f4ec] text-[#1a1712]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4dcc8] bg-[#ebe6d8] px-4 py-3">
        <div className="min-w-0">
          <p className="font-serif text-lg leading-none text-[#1a1712]">
            Never 86&apos;d <span className="italic text-[#6a6458]">· open play</span>
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6a6458]">
            Seat 1 · Community Tap · first store · any operator can play
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/onboard"
            className="rounded-full bg-[#1c1914] px-3 py-1.5 font-semibold text-[#f6f3ec]"
          >
            Claim your seat →
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[#e4dcc8] bg-[#fffdf8] px-3 py-1.5 font-semibold text-[#1a1712]"
          >
            Sign in
          </Link>
          <Link
            href="/operator"
            className="rounded-full border border-[#e4dcc8] bg-[#fffdf8] px-3 py-1.5 font-semibold text-[#1a1712]"
          >
            Owner desk
          </Link>
        </div>
      </header>
      <iframe
        title="Action Shift open play"
        src="/demo/action-shift.html"
        className="min-h-0 w-full flex-1 border-0"
        style={{ height: 'calc(100vh - 64px)' }}
      />
    </main>
  );
}
