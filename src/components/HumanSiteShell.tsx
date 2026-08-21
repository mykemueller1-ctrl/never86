import Image from 'next/image';
import Link from 'next/link';

const TEAM = [
  { name: 'Myke', src: '/team/mm.jpg' },
  { name: 'Victor', src: '/field/on-the-line-victor.jpg' },
  { name: 'Kristin', src: '/team/kristin.jpg' },
  { name: 'Rik', src: '/team/rik.jpg' },
];

export function HumanSiteHeader() {
  return (
    <header className="human-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Never 86'd home">
          <span className="human-mark">N</span>
          <span className="min-w-0">
            <span className="block font-serif text-xl leading-none text-[#161616] md:text-2xl">
              Never 86&apos;d <span className="italic text-[#544f48]">for operators</span>
            </span>
            <span className="mt-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-[#766f65] md:text-[10px]">
              Fort Dodge, Iowa · built inside the work
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[#423e38] lg:flex" aria-label="Primary navigation">
          <Link href="/delivery-marketplace-reconciliation" className="human-nav-link">How we check</Link>
          <Link href="/answers" className="human-nav-link">Operator answers</Link>
          <Link href="/team" className="human-nav-link">The team</Link>
          <Link href="/login" className="human-nav-link">Sign in</Link>
          <Link href="/audit" className="human-button human-button-primary text-sm">Free 3P audit →</Link>
        </nav>

        <Link href="/audit" className="human-button human-button-primary whitespace-nowrap text-xs lg:hidden">
          Free audit →
        </Link>
      </div>
    </header>
  );
}

export function TeamFaces({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center">
      {TEAM.map((person, index) => (
        <div
          key={person.name}
          className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} relative overflow-hidden rounded-full border-2 border-[#f4efe6] bg-[#ddd2c4]`}
          style={{ marginLeft: index === 0 ? 0 : -8, zIndex: TEAM.length - index }}
          title={person.name}
        >
          <Image src={person.src} alt={person.name} fill sizes={compact ? '32px' : '40px'} className="object-cover" />
        </div>
      ))}
    </div>
  );
}

export function HumanSiteFooter() {
  return (
    <footer className="border-t border-[#d8cec0] bg-[#ebe1d4] px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <TeamFaces compact />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#655f57]">
              Myke · Victor · Kristin · Rik · Vadim · and the operators who keep us honest
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#5b554d]">
            Built from firsthand operating experience inside independent restaurants and a 28-location, private-equity-backed restaurant group. Every claim stays tied to the evidence in front of us.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#4e4942]">
          <Link href="/audit" className="human-nav-link">Free 3P audit</Link>
          <Link href="/team" className="human-nav-link">Team</Link>
          <Link href="/story" className="human-nav-link">Story</Link>
          <a href="https://www.tiktok.com/@ontheline515" className="human-nav-link" target="_blank" rel="noreferrer">On the Line 515</a>
          <a href="mailto:myke@n86.app" className="human-nav-link">Email Myke</a>
        </div>
      </div>
    </footer>
  );
}
