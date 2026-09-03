import Link from 'next/link';
import {
  OWNER_SEAT_EOD,
  PUBLIC_PREVIEW_COPY,
  SAMPLE_LABEL,
  chipForSlug,
  type FreeOperatorAnswer,
} from '@/lib/freeOperatorDemo';

export function FreeOperatorAnswerCard({
  answer,
  compact = false,
}: {
  answer: FreeOperatorAnswer;
  compact?: boolean;
}) {
  const chip = chipForSlug(answer.slug);

  return (
    <article aria-label="Sample operator answer">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a4a00]">{SAMPLE_LABEL}</p>
      {chip ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#005de8]">{chip.label}</p>
      ) : null}
      <h2 className={`mt-3 font-serif leading-[0.95] tracking-[-0.04em] text-[#161616] ${compact ? 'text-[1.55rem]' : 'text-[2rem]'}`}>
        {answer.headline}
      </h2>
      {compact ? null : (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#766f65]">{PUBLIC_PREVIEW_COPY}</p>
      )}

      <section className="mt-6">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#005de8]">Facts</h3>
        <ul className="mt-3 space-y-2">
          {answer.facts.map((fact) => (
            <li key={fact} className="rounded-2xl border border-[#d8cec0] bg-[#fffaf2] px-4 py-3 text-[15px] leading-relaxed text-[#514b43]">
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border border-[#005de8] bg-[#fffaf2] px-4 py-4">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#005de8]">
          Coach this tomorrow
        </h3>
        <p className="mt-2 text-[16px] leading-relaxed text-[#161616]">{answer.coachTomorrow}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d8cec0] bg-[#fffaf2] px-4 py-4">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a4a00]">Needs</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-[#514b43]">{answer.needs}</p>
      </section>

      {compact ? (
        <p className="mt-4">
          <Link href={`/operator/answers/${answer.slug}`} className="text-sm font-semibold text-[#005de8]">
            Open this card →
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm leading-relaxed text-[#766f65]">{OWNER_SEAT_EOD.copy}</p>
          <p className="mt-8">
            <Link href="/operator" className="human-button human-button-primary text-sm">
              ← Back to the ask
            </Link>
          </p>
        </>
      )}
    </article>
  );
}
