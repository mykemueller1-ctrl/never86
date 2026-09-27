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
      <p className="owner-answer-kicker">
        {live ? 'Stored on this seat · source-tagged' : SAMPLE_LABEL}
      </p>
      {chip ? <p className="owner-answer-kicker mt-2">{chip.label}</p> : null}
      {tags?.length && !compact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="owner-desk-tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <h2 className="owner-answer-title">{answer.headline}</h2>
      {compact ? null : <p className="owner-desk-poetry">{PUBLIC_PREVIEW_COPY}</p>}

      <section className="owner-answer-section">
        <h3 className="owner-answer-kicker">Facts</h3>
        <ul>
          {answer.facts.map((fact) => (
            <li key={fact} className="owner-answer-fact">
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <section className="owner-answer-move">
        <h3 className="owner-answer-kicker">Coach this tomorrow</h3>
        <p className="owner-desk-poetry">{answer.coachTomorrow}</p>
      </section>

      <section className="owner-answer-needs">
        <h3 className="owner-answer-kicker">Needs</h3>
        <p className="owner-desk-poetry">{answer.needs}</p>
      </section>

      {compact && chip ? (
        <p className="mt-4">
          <Link href={`/operator/answers/${answer.slug}`} className="owner-answer-link">
            Open this card →
          </Link>
        </p>
      ) : compact ? null : (
        <>
          <p className="owner-desk-poetry">{OWNER_SEAT_EOD.copy}</p>
          <p className="mt-6">
            <Link href="/operator" className="owner-answer-link">
              ← Back to your seat
            </Link>
          </p>
        </>
      )}
    </article>
  );
}
