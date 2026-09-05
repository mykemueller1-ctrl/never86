import type { Metadata } from 'next';
import Link from 'next/link';
import { HOUSE_CODE_SEAT_DOOR, ORCHESTRATION_BRAND_BLUE, ORCHESTRATION_VERSION } from '@/lib/orchestration';
import { PortalHouseForm } from './PortalHouseForm';

export const metadata: Metadata = {
  title: "House-code seat | Never 86'd",
  description: 'CTAP house-code portal. The only orchestration seat door. Fail-closed. No private store data.',
  robots: { index: false, follow: false },
};

export default function HouseCodePortalPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">
              Never 86&apos;d <span className="italic text-ink-600">· house code</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">
              Only seat door · orchestration {ORCHESTRATION_VERSION} · {HOUSE_CODE_SEAT_DOOR}
            </p>
          </span>
        </Link>
      </div>

      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28 pb-20">
        <p className="compass-eyebrow mb-4" style={{ color: ORCHESTRATION_BRAND_BLUE }}>
          — Seat door
        </p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">House code. Then the desk.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          This is the only orchestration seat. Owner /login stays owner-only. Staff /login stays fail-closed.
          A house code maps to one <span className="font-mono">operator_id</span>. No PIN, no staff name, no
          marketplace password. Live issuance is blocked until Myke enables it.
        </p>
        <PortalHouseForm />
        <p className="compass-body text-[13px] mt-8" style={{ color: '#86868b' }}>
          Supervisor then routes to labor, vendor, voids, Action Shift, or memory. Live math stays on{' '}
          <Link href="/mcp" className="underline" style={{ textDecorationColor: ORCHESTRATION_BRAND_BLUE }}>
            never86.ai/api/mcp
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
