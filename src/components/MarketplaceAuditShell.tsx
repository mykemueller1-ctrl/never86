import Link from 'next/link';
import { TeamFaces } from '@/components/HumanSiteShell';

export function MarketplaceAuditHeader({
  label = 'Marketplace audit',
}: {
  label?: string;
}) {
  return (
    <header className="border-b border-[#e8e8ed] bg-[#fbfbfd]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-6 px-6 pb-5 pt-6">
        <Link href="/" className="flex items-start gap-4 group min-w-0">
          <span className="compass-mark">N</span>
          <span className="min-w-0">
            <span className="block font-serif text-[24px] leading-none text-ink-800 sm:text-[28px]">
              Never 86&apos;d <span className="italic text-ink-600">for operators</span>
            </span>
            <span className="compass-eyebrow-dim mt-2 block">{label}</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-[13px]">
          <Link href="/delivery-marketplace-reconciliation" className="compass-pill">3P evidence</Link>
          <Link href="/answers" className="compass-pill">Operator answers</Link>
          <Link href="/team" className="compass-pill">The team</Link>
          <Link href="/audit" className="btn-primary" style={{ background: '#0066ff' }}>Free audit</Link>
        </nav>
      </div>
      <div className="border-t border-[#e8e8ed] bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
          <TeamFaces compact />
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6e6e73]">
            Built and reviewed by restaurant operators, field storytellers, product people, and hospitality technologists—not a black box.
          </p>
        </div>
      </div>
    </header>
  );
}

export function MarketplaceAuditFooter() {
  return (
    <footer className="border-t border-[#e8e8ed] bg-white px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-5 text-[12px] leading-relaxed text-[#6e6e73]">
        <p className="max-w-3xl">
          Never86&apos;d is independent and is not affiliated with or endorsed by DoorDash, Uber Eats, Grubhub, or ezCater. Operational reconciliation only—not legal, tax, or accounting advice.
        </p>
        <div className="flex gap-5">
          <Link href="/evidence-standard" className="hover:text-[#1d1d1f]">Evidence standard</Link>
          <Link href="/" className="hover:text-[#1d1d1f]">Home</Link>
        </div>
      </div>
    </footer>
  );
}
