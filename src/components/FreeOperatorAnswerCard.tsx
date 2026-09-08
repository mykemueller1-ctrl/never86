import Link from 'next/link';
import {
  OWNER_SEAT_EOD,
  PUBLIC_PREVIEW_COPY,
  SAMPLE_LABEL,
  chipForSlug,
  type FreeOperatorAnswer,
} from '@/lib/freeOperatorDemo';

type AnswerLike = Pick<
  FreeOperatorAnswer,
  'slug' | 'headline' | 'facts' | 'coachTomorrow' | 'needs'
> & {
  tags?: string[];
  sourceTags?: Array<{ tag: string; source: string }>;
};

export function FreeOperatorAnswerCard({
  answer,
  compact = false,
  live = false,
}: {
  answer: AnswerLike;
  compact?: boolean;
  live?: boolean;
}) {
  const chip = chipForSlug(answer.slug);
  const tags = answer.tags?.length
    ? answer.tags
    : answer.sourceTags?.map((tag) => `${tag.tag}:${tag.source}`);

  return (
    <article aria-label={live ? 'Operator answer' : 'Sample operator answer'} className="owner-desk-card">
      <p className="owner-desk-card-kicker">
        {live ? 'Stored on this seat · source-tagged' : SAMPLE_LABEL}
      </p>
      {chip ? <p className="owner-desk-card-kicker mt-2">{chip.label}</p> : null}
      {tags?.length && !compact ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="owner-desk-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <h2 className={`mt-3 font-serif leading-[0.95] tracking-[-0.04em] text-[#e6e1d6] ${compact ? 'text-[1.55rem]' : 'text-[2rem]'}`}>
        {answer.headline}
      </h2>
      {compact ? null : (
        <p className="owner-desk-card-copy mt-3">{PUBLIC_PREVIEW_COPY}</p>
      )}

      <section className="mt-6">
        <h3 className="owner-desk-card-kicker">Facts</h3>
        <ul className="mt-3 space-y-2">
          {answer.facts.map((fact) => (
            <li key={fact} className="owner-desk-fact">
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <section className="owner-desk-coach-block mt-5">
        <h3 className="owner-desk-card-kicker">
          Coach this tomorrow
        </h3>
        <p className="mt-2 text-[16px] leading-relaxed text-[#e6e1d6]">{answer.coachTomorrow}</p>
      </section>

      <section className="owner-desk-need-block mt-4">
        <h3 className="owner-desk-card-kicker">Needs</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-[#8b95a3]">{answer.needs}</p>
      </section>

      {compact && chip ? (
        <p className="mt-4">
          <Link href={`/operator/answers/${answer.slug}`} className="owner-desk-card-link">
            Open this card →
          </Link>
        </p>
      ) : compact ? null : (
        <>
          <p className="mt-6 text-sm leading-relaxed text-[#8b95a3]">{OWNER_SEAT_EOD.copy}</p>
          <p className="mt-8">
            <Link href="/operator" className="owner-desk-card-link">
              ← Back to Owner desk
            </Link>
          </p>
        </>
      )}
    </article>
  );
}
