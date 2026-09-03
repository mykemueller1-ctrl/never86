import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FREE_OPERATOR_ANSWERS,
  OWNER_SEAT_EOD,
  PUBLIC_PREVIEW_COPY,
  SAMPLE_LABEL,
  chipForSlug,
  getFreeOperatorAnswer,
} from '@/lib/freeOperatorDemo';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return FREE_OPERATOR_ANSWERS.map((answer) => ({ slug: answer.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const answer = getFreeOperatorAnswer(slug);
  if (!answer) return { title: "Operator sample | Never 86'd", robots: { index: false, follow: false } };
  return {
    title: `${answer.headline} · ${SAMPLE_LABEL}`,
    description: `${SAMPLE_LABEL}. ${answer.needs}`,
    robots: { index: false, follow: false },
  };
}

export default async function OperatorAnswerPage({ params }: { params: Params }) {
  const { slug } = await params;
  const answer = getFreeOperatorAnswer(slug);
  if (!answer) notFound();
  const chip = chipForSlug(answer.slug);

  return (
    <main className="human-page min-h-screen">
      <article className="operator-phone">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a4a00]">{SAMPLE_LABEL}</p>
        {chip ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#005de8]">{chip.label}</p>
        ) : null}
        <h1 className="mt-4 font-serif text-[2rem] leading-[0.95] tracking-[-0.04em] text-[#161616]">{answer.headline}</h1>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#766f65]">{PUBLIC_PREVIEW_COPY}</p>

        <section className="mt-8">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#005de8]">Facts</h2>
          <ul className="mt-3 space-y-2">
            {answer.facts.map((fact) => (
              <li key={fact} className="rounded-2xl border border-[#d8cec0] bg-[#fffaf2] px-4 py-3 text-[15px] leading-relaxed text-[#514b43]">
                {fact}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-[#005de8] bg-[#fffaf2] px-4 py-4">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#005de8]">
            Coach this tomorrow
          </h2>
          <p className="mt-2 text-[16px] leading-relaxed text-[#161616]">{answer.coachTomorrow}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#d8cec0] bg-[#fffaf2] px-4 py-4">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a4a00]">Needs</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#514b43]">{answer.needs}</p>
        </section>

        <p className="mt-6 text-sm leading-relaxed text-[#766f65]">{OWNER_SEAT_EOD.copy}</p>

        <p className="mt-8">
          <Link href="/operator" className="human-button human-button-primary text-sm">
            ← Back to the ask
          </Link>
        </p>
      </article>
    </main>
  );
}
