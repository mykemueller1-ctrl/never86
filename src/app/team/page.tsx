import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Team — Never 86'd",
  description:
    "Built by an operator, for operators. The people behind Never 86'd.",
  openGraph: {
    title: "Team — Never 86'd",
    description:
      "Built by an operator, for operators. The people behind Never 86'd.",
    url: 'https://never86.ai/team',
    siteName: "Never 86'd",
    type: 'website',
  },
};

type Member = {
  initials: string;
  name: string;
  role: string;
  where: string;
  bio: string;
  monogramTone: 'gold' | 'void' | 'ink';
  photo?: string;
};

const TEAM: Member[] = [
  {
    initials: 'MM',
    name: 'Myke Mueller',
    role: 'Founder / CEO',
    where: 'Fort Dodge, Iowa',
    bio: "Restaurant operator. Co-owner of Community Tap & Pizza (the store the software is built against). Built Never 86'd because nothing on the market reads a Z-report the way a line does.",
    monogramTone: 'gold',
    photo: '/team/mm.jpg',
  },
  {
    initials: 'VH',
    name: 'Victor Hatungimana',
    role: 'Growth',
    where: 'Iowa',
    bio: 'Runs the operator pipeline. Talks to more independent restaurant owners in a week than most vendors talk to in a quarter. (That is the job.)',
    monogramTone: 'void',
    photo: '/team/vh.jpg',
  },
  {
    initials: 'KA',
    name: 'Kristin Aduna',
    role: 'Head of Product',
    where: '',
    bio: 'Owns the product — the demo, the buyer journey, what ships next. If a prospect touches it, she shaped it. (The rough edges you never saw? She caught them first.)',
    monogramTone: 'ink',
  },
];

function monogramClasses(tone: Member['monogramTone']) {
  switch (tone) {
    case 'gold':
      return 'bg-gradient-to-br from-gold-400 to-gold-700 text-black';
    case 'void':
      return 'bg-gradient-to-br from-void-500 to-void-800 text-white';
    case 'ink':
    default:
      return 'bg-gradient-to-br from-neutral-700 to-neutral-900 text-white ring-1 ring-white/10';
  }
}

export default function TeamPage() {
  return (
    <main className="min-h-screen text-white">
      {/* Header — wordmark only. No shared nav; keeps this route self-contained. */}
      <header className="max-w-6xl mx-auto px-6 pt-8 md:pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-3 group"
          aria-label="Back to Never 86'd"
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-gradient-to-br from-void-500 to-void-800 text-white font-bold text-sm tracking-tight shadow-btn">
            N
          </span>
          <span className="font-display text-white text-lg md:text-xl leading-none">
            Never 86&#39;d{' '}
            <span className="font-serif italic text-gold-400/90 text-base md:text-lg">
              for operators
            </span>
          </span>
        </Link>
      </header>

      {/* Lede */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold-400/80">
          — Team
        </p>
        <h1 className="mt-4 font-display font-semibold text-4xl md:text-6xl leading-[1.05] tracking-tighter text-white">
          Built by an operator.{' '}
          <span className="font-serif italic text-white/70">
            For operators.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base md:text-lg text-white/60 leading-relaxed">
          Small team. Every hire has run a shift, sold a plate, or reconciled a
          Z-report the hard way.{' '}
          <span className="font-serif italic text-white/80">
            (Nothing is subcontracted.)
          </span>
        </p>
      </section>

      {/* Team grid */}
      <section className="max-w-6xl mx-auto px-6 pt-4 md:pt-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM.map((m) => (
            <article
              key={m.name}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7 flex flex-col"
            >
              <div className="flex items-center gap-4">
                {m.photo ? (
                  <Image
                    src={m.photo}
                    alt={m.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover ring-1 ring-white/15"
                  />
                ) : (
                  <div
                    className={
                      'w-16 h-16 rounded-full flex items-center justify-center font-display font-semibold text-xl tracking-tight ' +
                      monogramClasses(m.monogramTone)
                    }
                    aria-hidden="true"
                  >
                    {m.initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-display font-semibold text-white text-lg md:text-xl leading-tight">
                    {m.name}
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    {m.role}
                    {m.where ? (
                      <>
                        <span className="text-white/30 mx-1.5">·</span>
                        <span className="font-serif italic text-white/50">
                          {m.where}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-white/75">
                {m.bio}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Advisors — deliberately empty this ship. */}
      <section className="max-w-6xl mx-auto px-6 pb-24 md:pb-32">
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold-400/70">
            — Advisors
          </p>
          <p className="mt-4 font-display text-xl md:text-2xl text-white/80 leading-snug tracking-tight">
            Coming soon.{' '}
            <span className="font-serif italic text-white/50">
              (Names go up here once the paperwork is signed, not before.)
            </span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 pb-16">
        <p className="text-xs text-white/40 font-mono tracking-wider uppercase">
          Never 86&#39;d · Built by operators
        </p>
      </footer>
    </main>
  );
}

